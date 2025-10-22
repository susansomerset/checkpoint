/**
 * Types for Canvas scraper
 */

// Scraped assignment data from external tool
export interface ScrapedAssignment {
  id: string;
  name: string;
  dueDate?: string;
  status?: 'complete' | 'incomplete' | 'missing' | 'graded';
  vectorScores: VectorScore[]; // Multiple vectors can have scores for one assignment
}

// Score for a specific vector
export interface VectorScore {
  vector: string; // CB, CT, CL, LM, OC, Pr, WC
  score: number;
  possiblePoints: number;
  percentage?: number; // calculated: score/possiblePoints
}

// Vector metadata (from outside iframe)
export interface VectorMetadata {
  abbreviation: string; // CB, CT, CL, etc.
  name: string; // Collaboration, Critical Thinking, etc.
  weight: number; // 10, 25, etc. (percentage)
  currentScore: number; // 54, 110, etc.
  possiblePoints: number; // 60, 120, etc.
  percentage: number; // 90, 92, etc.
}

// Scraped course data
export interface ScrapedCourse {
  courseId: string;
  courseName?: string;
  vectorMetadata: VectorMetadata[]; // Vector weights and current scores
  assignments: ScrapedAssignment[]; // Assignment data with vector scores
  scrapedAt: string; // ISO timestamp
}

// Scraper configuration
export interface ScraperConfig {
  canvasBaseUrl: string;
  username: string;
  password: string;
  authStatePath: string;
  headless: boolean;
  courseIds: string[];
}

// Result of a scrape operation
export interface ScrapeResult {
  success: boolean;
  coursesScraped: number;
  errors: string[];
  data: ScrapedCourse[];
  duration: number; // milliseconds
}

