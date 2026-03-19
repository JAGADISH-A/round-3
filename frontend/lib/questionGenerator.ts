/**
 * Question Generator — Dynamic interview question pool for CareerSpark Voice Analyzer
 */

const QUESTION_POOLS: Record<string, string[]> = {
  backend: [
    "How would you design an API that handles 10,000 requests per second?",
    "Explain the difference between horizontal and vertical scaling.",
    "How would you implement rate limiting in an API?",
    "What strategies improve database query performance under heavy load?",
    "How would you design a caching system to reduce database calls?",
    "Describe how you would handle database transactions in a distributed system.",
    "Explain the difference between synchronous and asynchronous API calls.",
    "How do you ensure backward compatibility when versioning an API?",
    "What is connection pooling and why does it matter in backend systems?",
    "How would you handle pagination in a REST API serving millions of records?",
  ],
  systemDesign: [
    "Design a URL shortening service like Bitly.",
    "Design a real-time chat messaging system.",
    "Design a file upload service that scales to millions of users.",
    "How would you architect a notification delivery system?",
    "Design a job scheduling system for distributed tasks.",
    "How would you design a recommendation engine for a streaming platform?",
    "Design a global content delivery network.",
    "How would you architect a high-availability payment processing system?",
  ],
  databases: [
    "When would you choose a NoSQL database over a relational database?",
    "Explain the CAP theorem and how it affects database design decisions.",
    "How do database indexes work and when can they hurt performance?",
    "What is database sharding and when would you use it?",
    "Explain the differences between ACID and BASE consistency models.",
  ],
  apis: [
    "What is the difference between REST and GraphQL? When would you choose each?",
    "How would you secure a public API?",
    "Explain idempotency in APIs and why it matters.",
    "How do you handle API versioning in a large production system?",
    "What is the difference between authentication and authorization in API design?",
  ],
  distributed: [
    "What is the difference between a message queue and an event stream?",
    "How do you handle eventual consistency in a distributed system?",
    "What is a saga pattern and when is it used?",
    "Explain the circuit breaker pattern in microservices.",
    "How would you debug a latency issue across multiple microservices?",
  ],
  behavioral: [
    "Describe a challenging bug you solved and how you found the root cause.",
    "Tell me about a time you had to handle tight deadlines and competing priorities.",
    "Describe a situation where you disagreed with a technical decision. How did you handle it?",
    "Tell me about a time you had to explain a complex technical system to a non-technical stakeholder.",
    "Describe a project where you had to learn a new technology quickly.",
    "Tell me about a time you identified and fixed a production incident.",
    "How do you approach code reviews? Describe a time feedback improved your code.",
  ],
};

const ROLE_PRIORITY: Record<string, string[]> = {
  "Backend Developer": ["backend", "databases", "apis", "distributed", "systemDesign", "behavioral"],
  "Full Stack Developer": ["apis", "backend", "systemDesign", "databases", "behavioral"],
  "Frontend Developer": ["apis", "behavioral", "systemDesign", "backend", "databases"],
  "DevOps Engineer": ["distributed", "systemDesign", "backend", "behavioral", "apis"],
  "ML Engineer": ["systemDesign", "distributed", "behavioral", "backend", "apis"],
  default: ["systemDesign", "backend", "behavioral", "apis", "databases"],
};

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getRandomQuestion(role: string, excludeQuestions: string[] = []): string {
  const priority = ROLE_PRIORITY[role] || ROLE_PRIORITY["default"];

  // Build weighted pool: earlier categories appear twice for prioritization
  const weightedPool: string[] = [];
  priority.forEach((category, idx) => {
    const questions = QUESTION_POOLS[category] || [];
    const weight = idx < 2 ? 2 : 1;
    for (let i = 0; i < weight; i++) weightedPool.push(...questions);
  });

  // Exclude recently seen questions
  const available = weightedPool.filter((q) => !excludeQuestions.includes(q));
  const pool = available.length > 0 ? available : weightedPool;

  return shuffle(pool)[0];
}

export function getAllCategories(): string[] {
  return Object.keys(QUESTION_POOLS);
}
