/**
 * Interview Intelligence Engine — Advanced local transcript analysis for CareerSpark AI
 */

const FILLER_WORDS = ["um", "uh", "like", "you know", "basically", "actually", "right", "so"];
const AGGRESSIVE_WORDS = ["fight", "punch", "kill", "stupid", "dumb", "idiot", "hate", "trash", "useless"];
const STAR_KEYWORDS = ["situation", "task", "action", "result"];
const TECHNICAL_KEYWORDS = [
  "api", "database", "redis", "cache", "caching", "scaling", "load balancer",
  "microservices", "queue", "kafka", "rabbitmq", "backend", "frontend", "server",
  "algorithm", "architecture", "deployment", "performance", "latency", "throughput",
  "authentication", "authorization", "encryption", "indexing", "sharding", "replication",
  "container", "docker", "kubernetes", "ci/cd", "pipeline",
];

export interface IntelligenceResult {
  wordCount: number;
  wpm: number;
  fillers: string[];
  aggressiveWords: string[];
  technicalKeywords: string[];
  starKeywordsFound: string[];
  confidenceScore: number;
  professionalismScore: number;
  structureScore: number;
  technicalScore: number;
  contentQuality: "Basic" | "Intermediate" | "Advanced";
  issues: string[];
  strengths: string[];
}

export function analyzeInterview(transcript: string, durationSeconds = 60): IntelligenceResult {
  const lower = transcript.toLowerCase();
  const words = lower.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;

  // Real WPM using actual recording duration
  const wpm = durationSeconds > 0 ? Math.round(wordCount / (durationSeconds / 60)) : wordCount * 10;

  // Filler word detection
  const fillerCounts: Record<string, number> = {};
  for (const word of words) {
    if (FILLER_WORDS.includes(word)) {
      fillerCounts[word] = (fillerCounts[word] ?? 0) + 1;
    }
  }
  // Also detect multi-word fillers
  const fullText = lower;
  const multiWordFillers = ["you know", "i mean", "kind of", "sort of"];
  const fillerList: string[] = [...Object.keys(fillerCounts)];
  multiWordFillers.forEach((mf) => {
    if (fullText.includes(mf)) fillerList.push(mf);
  });

  // Aggressive language detection
  const aggressiveWords = Array.from(new Set(words.filter((w) => AGGRESSIVE_WORDS.includes(w))));

  // Technical keyword detection (deduplicated)
  const technicalKeywords = Array.from(new Set(TECHNICAL_KEYWORDS.filter((k) => fullText.includes(k))));

  // STAR keyword detection
  const starKeywordsFound = STAR_KEYWORDS.filter((k) => words.includes(k));

  // --- SCORING ---

  // Confidence Score
  let confidenceScore = 50;
  if (wordCount > 60) confidenceScore = 85;
  else if (wordCount > 30) confidenceScore = 70;

  // Professionalism Score
  let professionalismScore = 85;
  if (aggressiveWords.length > 0) professionalismScore -= Math.min(aggressiveWords.length * 15, 40);

  // Structure Score (STAR method)
  const structureScore = starKeywordsFound.length >= 2 ? 80 : starKeywordsFound.length === 1 ? 55 : 35;

  // Technical Score
  const technicalScore = Math.min(technicalKeywords.length * 10, 100);

  // Content Quality
  let contentQuality: "Basic" | "Intermediate" | "Advanced" = "Basic";
  if (technicalKeywords.length >= 6) contentQuality = "Advanced";
  else if (technicalKeywords.length >= 3) contentQuality = "Intermediate";

  // --- SMART FEEDBACK GENERATION ---
  const issues: string[] = [];
  const strengths: string[] = [];

  if (wordCount < 25) issues.push("Answer lacks depth — aim for at least 50 words");
  if (wpm > 200) issues.push("Speaking too fast — slow down for clarity");
  if (fillerList.length > 5) issues.push("Too many filler words — practice pausing instead");
  if (technicalKeywords.length < 2) issues.push("Technical explanation is weak — add specific terms");
  if (aggressiveWords.length > 0) issues.push("Aggressive or unprofessional language detected");

  if (starKeywordsFound.length >= 2) strengths.push("Good use of STAR method structure");
  if (technicalKeywords.length >= 4) strengths.push("Strong use of technical terminology");
  if (wordCount > 60) strengths.push("Detailed and comprehensive answer");
  if (professionalismScore >= 80) strengths.push("Professional and respectful tone");
  if (fillerList.length === 0) strengths.push("Clean delivery with no filler words");

  return {
    wordCount,
    wpm,
    fillers: fillerList,
    aggressiveWords,
    technicalKeywords,
    starKeywordsFound,
    confidenceScore,
    professionalismScore,
    structureScore,
    technicalScore,
    contentQuality,
    issues,
    strengths,
  };
}
