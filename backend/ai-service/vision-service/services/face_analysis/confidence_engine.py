def compute_confidence(face_detected: bool) -> int:
    """
    Temporary scoring system for MVP.
    Returns 70 if face detected, 30 otherwise.
    """
    if face_detected:
        return 70
    return 30
