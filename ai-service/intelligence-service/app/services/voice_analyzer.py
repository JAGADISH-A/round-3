"""Voice Analyzer — Compute vocal precision from voice metrics."""

from typing import Dict, Any, List


def calculate_vocal_precision(voice_history: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Aggregate voice metrics from session history into a single vocal precision score.
    Works with both raw voice_history entries and normalized session data.
    """
    if not voice_history:
        return {
            "clarity": 0,
            "confidence": 0,
            "pacing": 0,
            "vocal_precision": 0,
        }

    # Average over all sessions (max last 10)
    recent = voice_history[:10]
    
    total_clarity = 0
    total_confidence = 0
    total_pacing = 0
    count = 0

    for entry in recent:
        clarity = entry.get("clarity_score", entry.get("clarity", 0))
        confidence = entry.get("confidence_score", entry.get("confidence", 0))
        
        # Pacing score: derive from WPM (ideal range ~120-160 WPM)
        wpm = entry.get("pacing_wpm", entry.get("wpm", entry.get("pacing", 0)))
        if isinstance(wpm, (int, float)) and wpm > 0:
            if 120 <= wpm <= 160:
                pacing_score = 90
            elif 100 <= wpm <= 180:
                pacing_score = 70
            else:
                pacing_score = 50
        else:
            pacing_score = entry.get("pacing", 50)

        total_clarity += clarity
        total_confidence += confidence
        total_pacing += pacing_score
        count += 1

    avg_clarity = round(total_clarity / count) if count else 0
    avg_confidence = round(total_confidence / count) if count else 0
    avg_pacing = round(total_pacing / count) if count else 0

    vocal_precision = round((avg_clarity + avg_confidence + avg_pacing) / 3)

    return {
        "clarity": avg_clarity,
        "confidence": avg_confidence,
        "pacing": avg_pacing,
        "vocal_precision": vocal_precision,
    }
