import base64
import numpy as np
import cv2
from fastapi import HTTPException

def decode_base64_image(base64_string: str) -> np.ndarray:
    """
    Decodes a base64 encoded jpeg/png image into an OpenCV frame.
    Validates that the payload is less than 1MB.
    """
    # 1. Validate payload size (< 1MB)
    # Each base64 character represents roughly 3/4 of a byte.
    # 1MB = 1024 * 1024 bytes = 1,048,576 bytes.
    # Safe estimate for base64 string length is ~1,398,101 characters.
    if len(base64_string) > 1_500_000: # Slightly generous limit for 1MB content
        raise HTTPException(status_code=413, detail="Payload too large. Maximum size is 1MB.")

    try:
        # Strip data URI header if present
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]

        # 1. Decode base64
        image_data = base64.b64decode(base64_string)
        
        # 2. Convert to numpy array
        nparr = np.frombuffer(image_data, np.uint8)
        
        # 3. Decode using OpenCV
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            raise ValueError("Could not decode image.")
            
        # 4. Return OpenCV frame
        return frame
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")
