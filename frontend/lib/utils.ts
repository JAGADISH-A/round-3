import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function detectLanguage(text: string): "ta" | "en" {
  if (!text || text.trim().length === 0) return "en";
  // Count Tamil Unicode characters (U+0B80 to U+0BFF)
  const tamilChars = (text.match(/[\u0B80-\u0BFF]/g) || []).length;
  // Count total alphabetic/script characters (exclude punctuation, spaces, numbers)
  const totalChars = (text.match(/[A-Za-z\u0B80-\u0BFF]/g) || []).length;
  // If more than 20% of the content is Tamil, treat as Tamil
  if (totalChars > 0 && tamilChars / totalChars > 0.2) return "ta";
  return "en";
}
