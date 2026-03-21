import cv2
import os

class FaceDetector:
    def __init__(self):
        # 1. Use OpenCV's built-in cascade path
        cascade_path = os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml")
        
        if not os.path.exists(cascade_path):
            raise FileNotFoundError(f"Haar Cascade file not found at {cascade_path}")
            
        # 2. Load cascade
        self.face_cascade = cv2.CascadeClassifier(cascade_path)
        
        if self.face_cascade.empty():
            raise IOError("Could not load Haar Cascade classifier.")

    def detect_face(self, frame) -> bool:
        """
        Detects if a face is present in the frame.
        """
        try:
            # Convert to grayscale for Haar Cascade
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )
            
            # Return True if faces detected
            return len(faces) > 0
        except Exception as e:
            print(f"Error during face detection: {str(e)}")
            return False

# Singleton instance
detector = FaceDetector()
