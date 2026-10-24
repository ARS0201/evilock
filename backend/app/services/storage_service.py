import os
import hashlib
import uuid
from typing import Tuple
from fastapi import UploadFile, HTTPException
from app.core.config import settings

class StorageService:
    @staticmethod
    def save_upload_stream(file: UploadFile) -> Tuple[str, str, int]:
        """
        Stream save upload file into private storage vault.
        Simultaneously computes SHA-256 cryptographic hash in 64KB chunks.
        Returns: (storage_path, sha256_hash, file_size_bytes)
        """
        # Validate filename and extension
        filename = file.filename or "unnamed_document"
        ext = filename.split(".")[-1].lower() if "." in filename else ""
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format '.{ext}'. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )

        # Generate private storage path using UUID
        vault_filename = f"{uuid.uuid4().hex}.dat"
        storage_path = os.path.join(settings.STORAGE_LOCAL_PATH, vault_filename)

        sha256 = hashlib.sha256()
        total_size = 0
        chunk_size = 64 * 1024  # 64 KB chunks

        with open(storage_path, "wb") as f:
            while chunk := file.file.read(chunk_size):
                total_size += len(chunk)
                if total_size > settings.MAX_UPLOAD_SIZE_BYTES:
                    f.close()
                    if os.path.exists(storage_path):
                        os.remove(storage_path)
                    raise HTTPException(
                        status_code=400,
                        detail=f"File exceeds maximum allowed size ({settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)} MB)"
                    )
                sha256.update(chunk)
                f.write(chunk)

        computed_hash = sha256.hexdigest()
        return storage_path, computed_hash, total_size

    @staticmethod
    def compute_file_hash(storage_path: str) -> str:
        """Re-compute SHA-256 hash from physical storage file."""
        if not os.path.exists(storage_path):
            raise FileNotFoundError(f"Storage file not found at: {storage_path}")

        sha256 = hashlib.sha256()
        with open(storage_path, "rb") as f:
            while chunk := f.read(64 * 1024):
                sha256.update(chunk)
        return sha256.hexdigest()

    @staticmethod
    def tamper_file_bytes(storage_path: str) -> bool:
        """
        Simulate unauthorized bit-flip tampering on a file for jury demonstration.
        Appends or flips a single byte to trigger MISMATCH detection.
        """
        if not os.path.exists(storage_path):
            return False
        with open(storage_path, "ab") as f:
            f.write(b"\x00[TAMPERED_BYTE_DEMO]")
        return True
