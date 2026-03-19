/**
 * Interview Analyzer Utility
 * Performs local heuristic analysis on speech transcripts for instant feedback.
 */

export interface LocalAnalysisResults {
  wordCount: number;
  wpm: number;
  fillers: string[];
  toxicWords: string[];
  technicalKeywords: string[];
  confidenceScore: number;
  professionalismScore: number;
  structureScore: number;
  technicalScore: number;
  starKeywordsFound: string[];
}

const FILLER_WORDS = ["um", "uh", "like", "you know", "actually", "basically"];
const TOXIC_WORDS = ["fight", "punch", "kill", "idiot", "stupid", "dumb"];
const TECHNICAL_KEYWORDS = [
  "api", "database", "backend", "java", "python", "system", "architecture", 
  "server", "algorithm", "performance", "frontend", "react", "nextjs", 
  "deployment", "scaling", "security", "git", "ci/cd", "microservices"
];
const STAR_KEYWORDS = ["situation", "task", "action", "result"];

export function analyzeInterview(transcript: string): LocalAnalysisResults {
  const words = transcript.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  
  // WPM estimate (approximation for UI display)
  const wpm = wordCount * 10; 

  // Detect fillers
  const fillersFound = words.filter(w => FILLER_WORDS.includes(w));
  
  // Detect toxic language
  const toxicsFound = words.filter(w => TOXIC_WORDS.includes(w));
  
  // Detect technical keywords
  const techFound = Array.from(new Set(words.filter(w => TECHNICAL_KEYWORDS.includes(w))));
  
  // Detect STAR method keywords
  const starFound = STAR_KEYWORDS.filter(k => words.includes(k));

  // Compute confidenceScore
  let confidenceScore = 40;
  if (wordCount > 30) confidenceScore = 80;
  else if (wordCount > 15) confidenceScore = 60;

  // Compute structureScore
  const structureScore = starFound.length >= 2 ? 80 : 40;

  // Compute professionalismScore
  let professionalismScore = 80;
  if (toxicsFound.length > 0) professionalismScore -= 20;

  // Compute technicalScore
  const technicalScore = Math.min(techFound.length * 10, 100);

  return {
    wordCount,
    wpm,
    fillers: fillersFound,
    toxicWords: toxicsFound,
    technicalKeywords: techFound,
    confidenceScore,
    professionalismScore,
    structureScore,
    technicalScore,
    starKeywordsFound: starFound
  };
}
