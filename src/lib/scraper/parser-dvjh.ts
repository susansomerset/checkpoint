import { pageScrape } from './scraper';

export interface ModuleItem {
  title: string;
  assignments: string[];
}

function parseModuleItems(htmlContent: string): ModuleItem[] {
  const h2Regex = /<h2[^>]*>(.*?)<\/h2>/gi;
  const h2Matches: RegExpExecArray[] = [];
  let match;
  
  while ((match = h2Regex.exec(htmlContent)) !== null) {
    h2Matches.push(match);
  }
  
  const validH2Tags = h2Matches.filter(h2Match => {
    const title = h2Match[1].trim();
    return title && title !== '&nbsp;' && title.length > 0;
  });
  
  if (validH2Tags.length === 0) {
    return [{ title: "All", assignments: [] }];
  }
  
  const modules: ModuleItem[] = [];
  
  for (let i = 0; i < h2Matches.length; i++) {
    const h2Match = h2Matches[i];
    const moduleTitle = h2Match[1].trim();
    
    if (!moduleTitle || moduleTitle === '&nbsp;') {
      continue;
    }
    
    const startPos = h2Match.index + h2Match[0].length;
    const endPos = i + 1 < h2Matches.length ? h2Matches[i + 1].index : htmlContent.length;
    const moduleContent = htmlContent.substring(startPos, endPos);
    
    const igTitleRegex = /<a[^>]*title="([^"]*)"[^>]*class="[^"]*ig-title[^"]*"[^>]*>/gi;
    const assignments: string[] = [];
    let titleMatch;
    
    while ((titleMatch = igTitleRegex.exec(moduleContent)) !== null) {
      const assignmentTitle = titleMatch[1].trim();
      if (assignmentTitle) {
        assignments.push(assignmentTitle);
      }
    }
    
    modules.push({
      title: moduleTitle,
      assignments: assignments
    });
  }
  
  return modules;
}

function convertDueDateToISO(dueDateString: string): string {
  if (!dueDateString || dueDateString.trim() === '') {
    return '';
  }
  
  // Parse format like "Oct 24 by 11:59pm" or "Sep 10 by 8:30am"
  // Month abbreviations
  const monthMap: { [key: string]: string } = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
  };
  
  const match = dueDateString.match(/(\w{3})\s+(\d+)\s+by\s+(\d+):(\d+)(am|pm)/i);
  
  if (!match) {
    return dueDateString; // Return original if can't parse
  }
  
  const [, monthAbbr, day, hour, minute, ampm] = match;
  const year = new Date().getFullYear();
  const month = monthMap[monthAbbr];
  
  if (!month) {
    return dueDateString;
  }
  
  // Convert to 24-hour format
  let hour24 = parseInt(hour);
  if (ampm.toLowerCase() === 'pm' && hour24 !== 12) {
    hour24 += 12;
  } else if (ampm.toLowerCase() === 'am' && hour24 === 12) {
    hour24 = 0;
  }
  
  // Format as M/D/YYYY HH:MM
  const formattedHour = hour24.toString().padStart(2, '0');
  const formattedMinute = minute.padStart(2, '0');
  
  return `${month}/${day}/${year} ${formattedHour}:${formattedMinute}`;
}

function convertSubmittedDateToISO(submittedString: string): string {
  if (!submittedString || submittedString.trim() === '') {
    return '';
  }
  
  // Parse format like "Sep 26 at 10:04am" or "Oct 14 at 9:55am"
  // Month abbreviations
  const monthMap: { [key: string]: string } = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
  };
  
  const match = submittedString.match(/(\w{3})\s+(\d+)\s+at\s+(\d+):(\d+)(am|pm)/i);
  
  if (!match) {
    return submittedString; // Return original if can't parse
  }
  
  const [, monthAbbr, day, hour, minute, ampm] = match;
  const year = new Date().getFullYear();
  const month = monthMap[monthAbbr];
  
  if (!month) {
    return submittedString;
  }
  
  // Convert to 24-hour format
  let hour24 = parseInt(hour);
  if (ampm.toLowerCase() === 'pm' && hour24 !== 12) {
    hour24 += 12;
  } else if (ampm.toLowerCase() === 'am' && hour24 === 12) {
    hour24 = 0;
  }
  
  // Format as M/D/YYYY HH:MM
  const formattedHour = hour24.toString().padStart(2, '0');
  const formattedMinute = minute.padStart(2, '0');
  
  return `${month}/${day}/${year} ${formattedHour}:${formattedMinute}`;
}

interface OutcomeValue {
  Key: string;
  Earned: string;
  Possible: string;
}

interface Assignment {
  Name: string;
  Due: string;
  Submitted: string;
  Status: string;
  Outcomes: OutcomeValue[];
}

interface GradesParseResult {
  assignments: Assignment[];
  outcomes: Array<{
    outcomeName: string;
    outcomeKey: string;
    outcomeGrade: string;
    outcomeEarned: string;
    outcomePossible: string;
    outcomeWeight: string;
  }>;
}

interface DVJHResult {
  courseId: string;
  outcomes: Array<{
    outcomeName: string;
    outcomeKey: string;
    outcomeGrade: string;
    outcomeEarned: string;
    outcomePossible: string;
    outcomeWeight: string;
  }>;
  modules: ModuleItem[];
  assignments: Assignment[];
}

function parseGradesFromHtml(htmlContent: string): GradesParseResult {
  // Parse assignments from rows with student_assignment class
  const assignments: Assignment[] = [];
  
  // Find all tr rows with class="student_assignment"
  const trRegex = /<tr[^>]*class="student_assignment[^"]*"[^>]*>(.*?)<\/tr>/gis;
  let trMatch;
  
  while ((trMatch = trRegex.exec(htmlContent)) !== null) {
    const trContent = trMatch[1];
    
    // Extract data from each td
    const tdRegex = /<td[^>]*>(.*?)<\/td>/gis;
    const tdMatches = [];
    let tdMatch;
    
    while ((tdMatch = tdRegex.exec(trContent)) !== null) {
      tdMatches.push(tdMatch[1]);
    }
    
    // Parse assignment data
    // Structure: <th class="title"> (with link), <td class="due">, <td class="submitted">, <td class="status">, <td class="assignment_score">, <td class="details">
    // We need to extract from th (row header) for name, then td cells
    
    // Extract assignment name from the <th class="title"> or the first cell
    let assignmentName = '';
    const titleMatch = trContent.match(/<th[^>]*class="title"[^>]*>.*?<a[^>]*>(.*?)<\/a>/s);
    if (titleMatch) {
      assignmentName = titleMatch[1].replace(/&amp;/g, '&').trim();
    }
    
    // Extract Outcome from <div class="context">
    let outcome = '';
    const contextMatch = trContent.match(/<div class="context">(.*?)<\/div>/);
    if (contextMatch) {
      outcome = contextMatch[1].trim();
    }
    
    // Parse due date from second cell
    const dueMatch = trContent.match(/<td class="due"[^>]*>(.*?)<\/td>/s);
    const due = dueMatch ? dueMatch[1].replace(/<[^>]*>/g, '').trim() : '';
    
    // Parse submitted from third cell
    const submittedMatch = trContent.match(/<td class="submitted"[^>]*>(.*?)<\/td>/s);
    const submitted = submittedMatch ? submittedMatch[1].replace(/<[^>]*>/g, '').trim() : '';
    
    // Parse status from fourth cell
    const statusMatch = trContent.match(/<td class="status"[^>]*>(.*?)<\/td>/s);
    const status = statusMatch ? statusMatch[1].replace(/<[^>]*>/g, '').trim() : '';
    
    // Parse score from assignment_score cell
    let earned = '';
    let possible = '';
    
    // First, try to extract the possible score (always present in format "x / y")
    const possibleMatch = trContent.match(/<span>\s*\/\s*(\d+(?:\.\d+)?)\s*<\/span>/s);
    if (possibleMatch) {
      possible = possibleMatch[1];
    }
    
    // Extract earned score from the grade span - try to find number or "-" before the "/ possible"
    const gradeSectionMatch = trContent.match(/<span class="grade"[^>]*>.*?(?=<span>\/)/s);
    if (gradeSectionMatch) {
      const gradeContent = gradeSectionMatch[0].replace(/<[^>]*>/g, '').replace(/<span class="grade"[^>]*>/, '').trim();
      
      // Check for numeric grade or "-"
      if (gradeContent.includes('-')) {
        earned = '0';
      } else {
        const numericMatch = gradeContent.match(/(\d+(?:\.\d+)?)/);
        if (numericMatch) {
          earned = numericMatch[1];
        }
      }
    }
    
    // Alternative: try to match "number / possible" directly
    if (!earned) {
      const fullScoreMatch = trContent.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
      if (fullScoreMatch) {
        earned = fullScoreMatch[1];
        possible = fullScoreMatch[2];
      }
    }
    
    // If still no earned score but we have possible
    if (!earned && possible) {
      if (status.toLowerCase() === 'missing') {
        // Missing assignments get 0 earned
        earned = '0';
      } else {
        // Non-missing assignments default to full possible points
        earned = possible;
      }
    }
    
    if (assignmentName) {
      const assignment: Assignment = {
        Name: assignmentName,
        Due: convertDueDateToISO(due), // Convert due date to ISO format
        Submitted: convertSubmittedDateToISO(submitted), // Convert submitted date to ISO format
        Status: status,
        Outcomes: [{
          Key: outcome,
          Earned: earned,
          Possible: possible
        }]
      };
      
      assignments.push(assignment);
    }
  }
  
  // Aggregate outcome scores from assignments to build course-level outcome metadata
  // Track totals for each outcome (Key is the outcome abbreviation like "Written Communication")
  const outcomeTotals: Record<string, { earned: number; possible: number; key: string }> = {};
  
  for (const assignment of assignments) {
    if (assignment.Outcomes && assignment.Outcomes.length > 0) {
      for (const outcome of assignment.Outcomes) {
        const key = outcome.Key;
        if (!outcomeTotals[key]) {
          outcomeTotals[key] = { earned: 0, possible: 0, key };
        }
        outcomeTotals[key].earned += parseFloat(outcome.Earned) || 0;
        outcomeTotals[key].possible += parseFloat(outcome.Possible) || 0;
      }
    }
  }
  
  // Convert to array of outcome metadata objects
  const outcomes = Object.entries(outcomeTotals).map(([key, totals]) => ({
    outcomeName: key,
    outcomeKey: key,
    outcomeGrade: '',
    outcomeEarned: totals.earned.toString(),
    outcomePossible: totals.possible.toString(),
    outcomeWeight: ''
  }));
  
  return { assignments, outcomes };
}

async function parseGrades(courseID: number): Promise<GradesParseResult> {
  const gradesUrl = `${process.env.CANVAS_BASE_URL}/courses/${courseID}/grades`;
  const gradesHtml = await pageScrape(gradesUrl, 'html');
  
  // Parse the HTML
  const parsedResult = parseGradesFromHtml(gradesHtml);
  
  return parsedResult;
}

export async function parseOutcomes_dvjh(courseIDs: number[]): Promise<DVJHResult[]> {
  try {
    const results: DVJHResult[] = [];
    
    for (const courseID of courseIDs) {
      // Scrape modules page first
      const modulesUrl = `${process.env.CANVAS_BASE_URL}/courses/${courseID}/modules`;
      const modulesHtml = await pageScrape(modulesUrl, 'html');
      
      // Parse modules
      const modules = parseModuleItems(modulesHtml);
      
      // Scrape grades page
      const gradesResult = await parseGrades(courseID);
      
      results.push({
        courseId: courseID.toString(),
        outcomes: gradesResult.outcomes,
        modules: modules,
        assignments: gradesResult.assignments
      });
    }
    
    return results;
    
  } catch (error) {
    console.error('Error during dvjh parsing:', error);
    throw error;
  }
}
