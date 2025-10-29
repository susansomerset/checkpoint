// Augmentation layer - adds outcome data to existing student data
// Runs scraping operations and matches data by assignment name

import { scrapeOutcomes, closeScraperSession } from '@/lib/scraper/scraper';
import { StudentData } from './builder';

interface OutcomeScore {
  Key: string;
  Earned: string;
  Possible: string;
}

interface ScrapedAssignment {
  Name: string;
  Outcomes?: OutcomeScore[];
}

interface ScrapedModule {
  title: string;
  assignments: string[];
}

// For DVHS parser: outcomes with full metadata
interface OutcomeMetadata {
  outcomeName: string;
  outcomeKey: string;
  outcomeGrade: string;
  outcomeEarned: string;
  outcomePossible: string;
  outcomeWeight: string;
}

interface ScrapedCourseData {
  courseId: string;
  outcomes: OutcomeMetadata[]; // Both parsers now return full metadata
  modules?: ScrapedModule[];
  assignments: ScrapedAssignment[];
}


export interface AugmentationResult {
  ok: boolean;
  errors: string[];
  stats: {
    studentsProcessed: number;
    parseTypeGroups: Record<string, number>;
    coursesScraped: number;
    assignmentsAugmented: number;
    assignmentsUnmatched: number;
    coursesWithOutcomes: number;
    duration: number;
  };
}

/**
 * Normalize assignment names for comparison
 * - Trim whitespace
 * - Decode HTML entities (e.g., &amp; -> &)
 */
function normalizeAssignmentName(name: string): string {
  return name
    .trim()
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/**
 * Augment student data with outcome scores from Canvas scraping
 * This function batches courses by parseType for efficiency
 */
export async function augmentStudentDataOutcomes(
  studentData: StudentData
): Promise<AugmentationResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const stats = {
    studentsProcessed: 0,
    parseTypeGroups: {} as Record<string, number>,
    coursesScraped: 0,
    assignmentsAugmented: 0,
    assignmentsUnmatched: 0,
    coursesWithOutcomes: 0,
    duration: 0
  };

  try {
    // Phase A1: Group all courses by parseType across all students
    const coursesByParseType: Record<string, { courseId: string; studentId: string }[]> = {};
    
    for (const [studentId, student] of Object.entries(studentData.students)) {
      stats.studentsProcessed++;
      
      const parseType = student.meta.parseType;
      if (!parseType) {
        errors.push(`Student ${studentId}: Missing parseType in metadata`);
        continue;
      }

      // Initialize parseType group if needed
      if (!coursesByParseType[parseType]) {
        coursesByParseType[parseType] = [];
        stats.parseTypeGroups[parseType] = 0;
      }

      // Add all courses for this student to the parseType group
      for (const courseId of Object.keys(student.courses)) {
        coursesByParseType[parseType].push({ courseId, studentId });
        stats.parseTypeGroups[parseType]++;
      }
    }

    console.info(`ZXQ augment.grouped: ${Object.keys(coursesByParseType).length} parseType groups`);

    // Phase A2: Scrape outcomes for each parseType group
    const scrapeResults: Record<string, ScrapedCourseData[]> = {};

    for (const [parseType, courses] of Object.entries(coursesByParseType)) {
      console.info(`ZXQ augment.scrape.start: parseType=${parseType}, courses=${courses.length}`);
      
      try {
        // Extract course IDs only
        const courseIds = courses.map(c => parseInt(c.courseId, 10));
        
        // Call scrapeOutcomes with batched course IDs (keep session alive)
        const result = await scrapeOutcomes(courseIds, parseType, false);
        
        // Store results with reverse lookup structure
        for (const data of result.data) {
          if (!scrapeResults[data.courseId]) {
            scrapeResults[data.courseId] = [];
          }
          scrapeResults[data.courseId].push(data);
          stats.coursesScraped++;
        }
        
        console.info(`ZXQ augment.scrape.success: parseType=${parseType}, coursesScraped=${result.data.length}`);
      } catch (error) {
        const errorMsg = `Failed to scrape ${parseType}: ${(error as Error).message}`;
        errors.push(errorMsg);
        console.error(`ZXQ augment.scrape.failure: ${errorMsg}`);
      }
    }

    // Close scraper session now that all scraping is complete
    await closeScraperSession();

    // STOP if no scrape results
    if (Object.keys(scrapeResults).length === 0) {
      console.error(`ZXQ augment.error: No scrape results obtained`);
      return {
        ok: false,
        errors: [...errors, 'No scrape results obtained'],
        stats: {
          ...stats,
          duration: Date.now() - startTime
        }
      };
    }

    // Phase A3: Match and augment assignments
    for (const [studentId, student] of Object.entries(studentData.students)) {
      for (const [courseId, course] of Object.entries(student.courses)) {
        const scrapedData = scrapeResults[courseId];
        if (!scrapedData || scrapedData.length === 0) {
          continue;
        }

        console.info(`ZXQ augment.matching: course=${courseId}, student=${studentId}`);
        const scraped = scrapedData[0]; // Use first result for this course

        // Augment course-level outcomes (convert array to indexed record)
        // Store outcome data indexed by outcome name/key with full metadata
        if (scraped.outcomes && scraped.outcomes.length > 0) {
          course.courseOutcomes = scraped.outcomes.reduce((acc, outcome) => {
            const outcomeKey = outcome.outcomeKey?.trim() || '';
            if (outcomeKey) {
              acc[outcomeKey] = outcome;
            }
            return acc;
          }, {} as Record<string, OutcomeMetadata>);
          stats.coursesWithOutcomes++;
        }

        // Build module lookup map (index by both original and normalized names)
        const moduleByAssignment: Record<string, string> = {};
        if (scraped.modules) {
          for (const scrapedModule of scraped.modules) {
            for (const assignmentName of scrapedModule.assignments) {
              const normalizedName = normalizeAssignmentName(assignmentName);
              // Index by both original and normalized names for lookup
              moduleByAssignment[assignmentName] = scrapedModule.title;
              moduleByAssignment[normalizedName] = scrapedModule.title;
            }
          }
        }

        // Augment assignments with outcome scores and module names
        // We iterate scraped assignments (source of truth) and try to match to Canvas data
        for (const scrapedAssignment of scraped.assignments) {
          // Normalize the scraped assignment name
          const normalizedScrapedName = normalizeAssignmentName(scrapedAssignment.Name);
          
          // Find matching Canvas assignment by name (with normalization)
          const matchedAssignment = Object.values(course.assignments).find(assignment => {
            const canvasData = assignment.canvas as Record<string, unknown>;
            const canvasName = canvasData.name as string;
            const normalizedCanvasName = normalizeAssignmentName(canvasName);
            return normalizedCanvasName === normalizedScrapedName;
          });

          if (matchedAssignment) {
            // Add outcome scores (convert array to indexed record)
            if (scrapedAssignment.Outcomes && scrapedAssignment.Outcomes.length > 0) {
              // console.info(`ZXQ augment.outcomeScores: assignment="${scrapedAssignment.Name}", outcomes=${JSON.stringify(scrapedAssignment.Outcomes)}`);
              matchedAssignment.outcomeScores = scrapedAssignment.Outcomes.reduce((acc, score) => {
                acc[score.Key] = { earned: score.Earned, possible: score.Possible };
                return acc;
              }, {} as Record<string, { earned: string; possible: string }>);
              stats.assignmentsAugmented++;
            }

            // Add module name (lookup by normalized name)
            const moduleName = moduleByAssignment[normalizedScrapedName];
            if (moduleName) {
              matchedAssignment.moduleName = moduleName;
            }
          } else {
            // This IS a problem - scraped assignment couldn't be matched to Canvas data
            stats.assignmentsUnmatched++;
            console.warn(`ZXQ augment.error.scraped_assignment_not_found: course=${courseId}, assignment="${scrapedAssignment.Name}"`);
          }
        }
      }
    }

    // STOP if no assignments were augmented
    if (stats.assignmentsAugmented === 0) {
      console.error(`ZXQ augment.error: No assignments augmented`);
      return {
        ok: false,
        errors: [...errors, 'No assignments augmented - check name matching'],
        stats: {
          ...stats,
          duration: Date.now() - startTime
        }
      };
    }

    stats.duration = Date.now() - startTime;
    console.info(`ZXQ augment.success: duration=${stats.duration}ms, augmented=${stats.assignmentsAugmented}, unmatched=${stats.assignmentsUnmatched}`);

    return {
      ok: true,
      errors,
      stats
    };

  } catch (error) {
    console.error('ZXQ augment.fatal:', error);
    // Ensure session is closed even on error
    try {
      await closeScraperSession();
    } catch {
      // Ignore close errors
    }
    return {
      ok: false,
      errors: [...errors, `Fatal error: ${(error as Error).message}`],
      stats: {
        ...stats,
        duration: Date.now() - startTime
      }
    };
  }
}

