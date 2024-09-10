import json

import falcon
from keri.core import coring, parsing
from keri.vdr import verifying, eventing
from verifier.core.authorizing import Schema


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

    healthEnd = HealthEndpoint()
    app.add_route("/health", healthEnd)
    return []


class HealthEndpoint:
    def __init__(self):
        pass

    def on_get(self, req, rep):
        rep.content_type = "application/json"
        rep.status = falcon.HTTP_OK
        rep.data = json.dumps(dict(msg="vLEI verification service is healthy")).encode("utf-8")
        return
