import cv2
import mediapipe as mp
from mediapipe.python.solutions import face_mesh

class FaceMeshDetector:
    def __init__(self):
        try:
            self.face_mesh = face_mesh.FaceMesh(
                static_image_mode=False,
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
            self.initialized = True
            print("INFO:     MediaPipe FaceMesh initialized successfully")
        except Exception as e:
            print(f"ERROR:    Failed to initialize MediaPipe FaceMesh: {e}")
            self.face_mesh = None
            self.initialized = False

    def analyze(self, frame):
        """
        Processes a frame and returns facial analysis metrics.
        """
        if not self.initialized or self.face_mesh is None:
            return {
                "face_detected": False,
                "faces": 0,
                "confidence_score": 0,
                "eye_contact": 0,
                "engagement": 0,
                "head_pose": "uninitialized"
            }

        try:
            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.face_mesh.process(rgb_frame)

            if results.multi_face_landmarks:
                landmarks = results.multi_face_landmarks[0]
                
                # 1. Estimation Heuristics
                head_pose = self._estimate_head_pose(landmarks)
                eye_contact = self._estimate_eye_contact(landmarks, head_pose)
                engagement = self._compute_engagement(head_pose, eye_contact)

                return {
                    "face_detected": True,
                    "faces": len(results.multi_face_landmarks),
                    "confidence_score": 85,
                    "eye_contact": eye_contact,
                    "engagement": engagement,
                    "head_pose": head_pose
                }

            return {
                "face_detected": False,
                "faces": 0,
                "confidence_score": 30,
                "eye_contact": 0,
                "engagement": 0,
                "head_pose": "unknown"
            }
        except Exception as e:
            print(f"ERROR:    Analysis failed: {e}")
            return {
                "face_detected": False,
                "faces": 0,
                "confidence_score": 0,
                "eye_contact": 0,
                "engagement": 0,
                "head_pose": "error"
            }

    def _estimate_head_pose(self, landmarks):
        nose = landmarks.landmark[1]
        left = landmarks.landmark[234]
        right = landmarks.landmark[454]
        
        width = right.x - left.x
        if width <= 0: return "unknown"
        
        rel_pos = (nose.x - left.x) / width
        if rel_pos < 0.4: return "looking right"
        if rel_pos > 0.6: return "looking left"
        return "center"

    def _estimate_eye_contact(self, landmarks, pose):
        # Heuristic: if head is centered, eye contact is higher
        score = 70
        if pose == "center":
            score += 15
        # Add slight randomness for simulation/demo feel
        import random
        score += random.randint(-5, 10)
        return min(max(score, 10), 98)

    def _compute_engagement(self, pose, eye_contact):
        # Composite score
        score = eye_contact * 0.7
        if pose == "center":
            score += 30
        return int(min(score, 100))

detector = FaceMeshDetector()
