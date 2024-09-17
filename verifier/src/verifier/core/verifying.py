import json

import os
import falcon
import zipfile
import datetime
from keri.vdr import verifying, eventing
from keri.core import coring, parsing
from keri.core.coring import MtrDex, Diger


def setup(app, hby, vdb, reger, local=False):
    """ Set up verifying endpoints to process vLEI credential verifications

    Parameters:
        app (App): Falcon app to register endpoints against
        hby (Habery): Database environment for exposed KERI AIDs
        vdb (VerifierBaser): Database environment for the verifier
        reger (Reger): Database environment for credential registries

    """

    tvy = eventing.Tevery(reger=reger, db=hby.db, local=local)
    vry = verifying.Verifier(hby=hby, reger=reger)

    loadEnds(app, hby, vdb, tvy, vry)


def loadEnds(app, hby, vdb, tvy, vry):
    """ Load and map endpoints to process vLEI credential verifications

    Parameters:
        app (App): Falcon app to register endpoints against
        hby (Habery): Database environment for exposed KERI AIDs
        vdb (VerifierBaser): Verifier database environment
        tvy (Tevery): transaction event log event processor
        vry (Verifier): credential verification processor

    """
    # Define the upload directory
    upload_dir = os.path.abspath('./uploads')
    
    # Ensure the directory exists
    os.makedirs(upload_dir, exist_ok=True)

    verDocEnd = AttestationVerifierResource(hby, vdb, tvy, vry, upload_dir)
    app.add_route("/verify-attestation", verDocEnd)
    healthEnd = HealthEndpoint()
    app.add_route("/health", healthEnd)
    return []

class AttestationVerifierResource:
    """ Attestation Verifier Resource Class

    Handles credential verification by receiving a ZIP file with PDFs, extracting 
    them, and verifying the credential via its SAID. Also compares the document 
    hash to the credential's digest for validation.

    """

    def __init__(self, hby, vdb, tvy, vry, upload_dir):
        """ Create credential presentation resource endpoint instance

        Parameters:
            hby (Habery): Database environment for exposed KERI AIDs
            vdb (VerifierBaser): Verifier database environment
            tvy (Tevery): transaction event log event processor
            vry (Verifier): credential verification event processor

        """
        self.hby = hby
        self.vdb = vdb
        self.tvy = tvy
        self.vry = vry
        self.upload_dir = upload_dir

    def on_post(self, req, rep):
        # get incoming file
        try:
            incoming_file = req.get_param("file")
            if incoming_file is None:
                rep.status = falcon.HTTP_BAD_REQUEST
                rep.data = json.dumps(dict(msg="No file was uploaded")).encode("utf-8")
                return
            
            # get said from the zip file name
            # ex. examplezip-digest=EA2bjWRaF3Hk0e1x1hV5SbD_01APHYOg2oeeRNr8HVq1.zip 
            # EA2bjWRaF3Hk0e1x1hV5SbD_01APHYOg2oeeRNr8HVq1
            said = incoming_file.filename.split("-digest=")[1].split(".zip")[0]
            # Save uploaded file
            file_path = self._save_uploaded_zip(incoming_file)
            
            # Extract ZIP file
            files = self._extract(file_path)

            # ZIP not valid
            if not files:   
                rep.status = falcon.HTTP_BAD_REQUEST
                rep.data = json.dumps(dict(msg="The ZIP file is not valid")).encode("utf-8")
                return

            if not self._verify_credential(files["cesr_file"], said, rep):
                rep.status = falcon.HTTP_BAD_REQUEST
                rep.data = json.dumps(dict(msg=f"Credential {said} was not found")).encode("utf-8")
                return
            
            saider = coring.Saider(qb64=said)
            now = coring.Dater()
            self.vdb.iss.pin(keys=(saider.qb64,), val=now)     

            if not self._verify_document_hash(saider, files["document_file"], rep, said):
                rep.status = falcon.HTTP_BAD_REQUEST
                rep.data = json.dumps(dict(msg=f"Document hash does not match digest")).encode("utf-8")
                return            
            
            rep.status = falcon.HTTP_ACCEPTED
            rep.data = json.dumps(dict(msg=f"the document is a valid")).encode("utf-8")

            return 
        except Exception as e:
            rep.status = falcon.HTTP_BAD_REQUEST
            rep.data = json.dumps(dict(msg=str(e))).encode("utf-8")

    def _verify_credential(self, file_path, said, rep):
        """ Verify the credential by SAID """
        try:
            with open(file_path, "rb") as f:
                ims = f.read()

            self.vry.cues.clear()
            parsing.Parser().parse(ims=ims, kvy=self.hby.kvy, tvy=self.tvy, vry=self.vry)
            found = False
            while self.vry.cues:
                msg = self.vry.cues.popleft()
                if "creder" in msg:
                    creder = msg["creder"]
                    if creder.said == said:
                        found = True
            
            # Clean up the uploaded CESR file
            os.remove(file_path)
            return found

        except Exception as e:
            os.remove(file_path)
            raise falcon.HTTPBadRequest("Credential Verification Error", str(e))
        
    def _verify_document_hash(self, saider, document_path, rep, said):
        """ Verify the hash of the uploaded document against the credential digest """
        try:
            with open(document_path, "rb") as f:
                document = f.read()

            # Convert the hash to qb64 format using KERI's Diger class
            document_matter = Diger(raw=document, code=MtrDex.Blake3_256)

            # Get the qb64 encoded hash
            document_qb64 = document_matter.qb64

            os.remove(document_path)

            # Get the digest from the credential by SAID
            creder = self.vry.reger.creds.get(keys=(saider.qb64,))
            attrib_data = creder.attrib
            digest = attrib_data["digest"]

            # compare document hash with digest
            if document_qb64 != digest:
                return False
            return True

        except Exception as e:
            os.remove(document_path)
            raise falcon.HTTPBadRequest("Document Hash Error", str(e))           
                
    def _extract(self, zip_path):
        try:
            files = []
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                file_list = zip_ref.infolist()  # Get the list of files in the ZIP

                # The ZIP file must contain a CESR file.
                cesr_files = [file for file in file_list if file.filename.endswith('.cesr')]
                if not cesr_files :
                    return False
                # The ZIP file must contain exactly two or three files.
                if len(file_list) < 2  or len(file_list) > 3:
                    return False
                
                # Initialize a dictionary to store the file paths
                extracted_files = {"readme_file": None, "cesr_file": None, "document_file": None}

                # Loop through the files to identify them
                for file_info in file_list:
                    filename = file_info.filename
                    # Define the path to save the extracted PDF
                    path = os.path.join(self.upload_dir, file_info.filename)
                
                    # Identify the file type
                    if filename.endswith('.txt'):
                        extracted_files["readme_file"] = path
                    elif filename.endswith('.cesr'):
                        extracted_files["cesr_file"] = path
                    else:
                        extracted_files["document_file"] = path # The unknown type file

                    # Extract and save the PDF file
                    with open(path, 'wb') as file:
                        file.write(zip_ref.read(file_info.filename))
                    files.append(file_info.filename)

                # Clean up the uploaded ZIP file
                os.remove(zip_path)

            return extracted_files
        except Exception as e:
            raise falcon.HTTPBadRequest(str(e))
         
    def _save_uploaded_zip(self, incoming_file):
        """ Save the uploaded file to disk and return its path """
        try:
            img_id = str(int(datetime.datetime.now().timestamp() * 1000))
            filename = f"{img_id}.{incoming_file.filename.split('.')[-1]}"
            file_path = os.path.join(self.upload_dir, filename)

            temp_file_path = file_path + "~"
            with open(temp_file_path, "wb") as f:
                f.write(incoming_file.file.read())
            os.rename(temp_file_path, file_path)

            return file_path
        except Exception as e:
            raise falcon.HTTPBadRequest(str(e))
        
class HealthEndpoint:
    def __init__(self):
        pass

    def on_get(self, req, rep):
        rep.content_type = "application/json"
        rep.status = falcon.HTTP_OK
        rep.data = json.dumps(dict(msg="vLEI verification service is healthy")).encode("utf-8")
        return
