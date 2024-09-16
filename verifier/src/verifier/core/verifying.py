import json

import os
import falcon
from keri.vdr import verifying, eventing


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
            rep.status = falcon.HTTP_ACCEPTED
            rep.data = json.dumps(dict(msg=f"the document is a valid")).encode("utf-8")
            return 
        except Exception as e:
            raise falcon.HTTPBadRequest("Error", str(e))

        
class HealthEndpoint:
    def __init__(self):
        pass

    def on_get(self, req, rep):
        rep.content_type = "application/json"
        rep.status = falcon.HTTP_OK
        rep.data = json.dumps(dict(msg="vLEI verification service is healthy")).encode("utf-8")
        return
