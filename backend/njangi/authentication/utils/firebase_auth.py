import jwt
import requests
import time
import logging
from cryptography.x509 import load_pem_x509_certificate
from django.conf import settings

logger = logging.getLogger(__name__)

class ManualFirebaseVerifier:
    """
    A resilient Firebase ID token verifier that performs cryptographic verification
    without requiring Service Account JSON credentials. Highly portable for local
    dev and production environments.
    """
    PUBKEY_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
    _cached_keys = {}
    _last_fetch = 0
    CACHE_DURATION = 3600  # 1 hour

    @classmethod
    def _fetch_public_keys(cls):
        """Fetches rotating public RSA keys from Google's x509 endpoint."""
        now = time.time()
        if now - cls._last_fetch < cls.CACHE_DURATION and cls._cached_keys:
            return cls._cached_keys
        
        try:
            response = requests.get(cls.PUBKEY_URL, timeout=10)
            response.raise_for_status()
            cls._cached_keys = response.json()
            cls._last_fetch = now
            logger.info("Successfully fetched and cached Firebase public keys.")
            return cls._cached_keys
        except Exception as e:
            logger.error(f"Critical error fetching Firebase public keys: {e}")
            # Fallback to expired cache if available, else re-raise
            if cls._cached_keys:
                return cls._cached_keys
            raise e

    @classmethod
    def verify(cls, id_token):
        """
        Verifies the signature and standard OIDC claims of a Firebase ID token.
        Returns the decoded token dictionary if valid.
        """
        project_id = getattr(settings, 'FIREBASE_PROJECT_ID', None)
        if not project_id:
            raise ValueError("FIREBASE_PROJECT_ID is missing from Django settings.")

        # 1. Extract Key ID (kid) from JWT header
        try:
            unverified_header = jwt.get_unverified_header(id_token)
        except Exception as e:
            raise jwt.InvalidTokenError(f"Failed to parse token header: {e}")

        kid = unverified_header.get('kid')
        if not kid:
            raise jwt.InvalidTokenError("Token header is missing 'kid' (Key ID).")

        # 2. Match kid with Google's current public certificates
        public_keys = cls._fetch_public_keys()
        cert_pem = public_keys.get(kid)
        
        if not cert_pem:
            # Refresh cache once if key not found
            cls._last_fetch = 0 
            public_keys = cls._fetch_public_keys()
            cert_pem = public_keys.get(kid)
            if not cert_pem:
                raise jwt.InvalidTokenError(f"No public key found matching kid: {kid}")

        # 3. Load public key from x509 certificate
        try:
            cert = load_pem_x509_certificate(cert_pem.encode())
            public_key = cert.public_key()
        except Exception as e:
            raise jwt.InvalidTokenError(f"Failed to load public key from certificate: {e}")

        # 4. Verify Signature and Claims
        # verify_aud: matches project ID
        # verify_iss: matches https://securetoken.google.com/<project_id>
        # iat, exp: verified automatically by PyJWT
        decoded_token = jwt.decode(
            id_token,
            public_key,
            algorithms=["RS256"],
            audience=project_id,
            issuer=f"https://securetoken.google.com/{project_id}",
            options={
                "verify_iat": True,
                "verify_exp": True,
                "verify_aud": True,
                "verify_iss": True,
            }
        )
        
        return decoded_token

def verify_firebase_id_token(id_token):
    """
    Standard entry point for Firebase ID token verification in Njangi.
    Uses the ManualVerifier for maximum portability across dev/prod environments.
    """
    try:
        return ManualFirebaseVerifier.verify(id_token)
    except jwt.ExpiredSignatureError:
        logger.warning("Firebase token has expired.")
        raise ValueError("Token expired.")
    except jwt.InvalidTokenError as e:
        logger.warning(f"Firebase token verification failed: {e}")
        raise ValueError(f"Invalid token: {e}")
    except Exception as e:
        logger.error(f"Unexpected error during Firebase verification: {e}")
        raise e
