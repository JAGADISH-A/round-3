export interface VisionMetrics {
  face_detected: boolean;
  faces: number;
  confidence_score: number;
  eye_contact: number;
  head_pose: string;
  engagement: number;
}

let latestMetrics: VisionMetrics | null = null;

/**
 * Set the latest vision metrics globally.
 * This is called by the FaceAnalyzer component.
 */
export function setLatestMetrics(metrics: VisionMetrics) {
  latestMetrics = metrics;
}

/**
 * Get the latest vision metrics globally.
 * This is called by the Chat system.
 */
export function getLatestMetrics(): VisionMetrics | null {
  return latestMetrics;
}
