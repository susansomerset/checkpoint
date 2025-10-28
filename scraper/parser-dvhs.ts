import { pageScrape } from './scraper';
import * as path from 'path';
import * as fs from 'fs';

export interface ModuleItem {
  title: string;
  assignments: string[];
}

export interface Outcome {
  outcomeName: string;
  outcomeKey: string;
  outcomeGrade: string;
  outcomeEarned: string;
  outcomePossible: string;
  outcomeWeight: string;
}

function parseExternalTools(htmlContent: string): string {
  // Strip all attributes from table, tr, td, span, div tags and keep only text content
  let cleaned = htmlContent;
  
  // Remove all attributes from <table>, <tr>, <td>, <span>, <div> tags
  cleaned = cleaned.replace(/<(table)[^>]*>/gi, '<table>');
  cleaned = cleaned.replace(/<(tr)[^>]*>/gi, '<tr>');
  cleaned = cleaned.replace(/<(td)[^>]*>/gi, '<td>');
  cleaned = cleaned.replace(/<(span)[^>]*>/gi, '<span>');
  cleaned = cleaned.replace(/<(div)[^>]*>/gi, '<div>');
  
  // Also handle closing tags
  cleaned = cleaned.replace(/<\/(table)>/gi, '</table>');
  cleaned = cleaned.replace(/<\/(tr)>/gi, '</tr>');
  cleaned = cleaned.replace(/<\/(td)>/gi, '</td>');
  cleaned = cleaned.replace(/<\/(span)>/gi, '</span>');
  cleaned = cleaned.replace(/<\/(div)>/gi, '</div>');
  
  // Remove all other tags except those five types
  cleaned = cleaned.replace(/<(?!\/?(?:table|tr|td|span|div)\b)[^>]+>/gi, '');
  
  // Collapse duplicate opening tags
  cleaned = cleaned.replace(/(<div>)+/g, '<div>');
  cleaned = cleaned.replace(/(<span>)+/g, '<span>');
  cleaned = cleaned.replace(/(<tr>)+/g, '<tr>');
  cleaned = cleaned.replace(/(<td>)+/g, '<td>');
  cleaned = cleaned.replace(/(<table>)+/g, '<table>');
  
  // Collapse duplicate closing tags
  cleaned = cleaned.replace(/(<\/div>)+/g, '</div>');
  cleaned = cleaned.replace(/(<\/span>)+/g, '</span>');
  cleaned = cleaned.replace(/(<\/tr>)+/g, '</tr>');
  cleaned = cleaned.replace(/(<\/td>)+/g, '</td>');
  cleaned = cleaned.replace(/(<\/table>)+/g, '</table>');
  
  // Remove empty tag pairs
  cleaned = cleaned.replace(/<div><\/div>/g, '');
  cleaned = cleaned.replace(/<span><\/span>/g, '');
  cleaned = cleaned.replace(/<tr><\/tr>/g, '');
  cleaned = cleaned.replace(/<td><\/td>/g, '');
  cleaned = cleaned.replace(/<table><\/table>/g, '');
  
  // Normalize whitespace before opening tags
  cleaned = cleaned.replace(/ </g, '<');
  
  return cleaned;
}

function parseOutcomesFromCleaned(cleanedHtml: string, courseID: number, docsDir: string): { outcomes: Outcome[]; assignmentData: string } {
  const outcomes: Outcome[] = [];
  
  // Find the section between "Total Score" and "<table>"
  const totalScoreIndex = cleanedHtml.indexOf('Total Score');
  const tableIndex = cleanedHtml.indexOf('<table>');
  
  if (totalScoreIndex === -1 || tableIndex === -1) {
    console.log('Could not find "Total Score" or "<table>" in cleaned HTML');
    return { outcomes: [], assignmentData: cleanedHtml };
  }
  
  // Extract just the outcomes section
  let outcomesSection = cleanedHtml.substring(totalScoreIndex, tableIndex);
  
  // Replace all tags with "~" to make the structure clearer
  outcomesSection = outcomesSection.replace(/<[^>]+>/g, '~');
  
  // Collapse multiple consecutive ~ into a single ~
  outcomesSection = outcomesSection.replace(/~+/g, '~');
  
  // Save the outcomes section to its own file
  const outcomesSectionFilePath = path.join(docsDir, `zxq_${courseID}_external_tools_outcomes_section.txt`);
  fs.writeFileSync(outcomesSectionFilePath, outcomesSection, 'utf8');
  console.log(`Outcomes section saved to: ${outcomesSectionFilePath}`);
  
  // Split by ~ and remove first element ("Total Score")
  const parts = outcomesSection.split('~').filter(p => p.trim() !== '');
  parts.shift(); // Remove "Total Score"
  
  // Each outcome has 5 elements: grade, earned/possible, weight, name, key
  // So we loop through the array in chunks of 5
  console.log(`Found ${Math.floor(parts.length / 5)} outcomes`);
  
  for (let i = 0; i < parts.length; i += 5) {
    if (i + 4 >= parts.length) break; // Need at least 5 elements
    
    const grade = parts[i];
    const earnedPossible = parts[i + 1];
    const weight = parts[i + 2];
    const name = parts[i + 3];
    const key = parts[i + 4];
    
    // Parse earned/possible (e.g., "54/60")
    const [earned, possible] = earnedPossible.split('/');
    
    // Parse weight (e.g., "10% Wt" -> "10")
    const weightValue = weight.replace('% Wt', '').trim();
    
    outcomes.push({
      outcomeName: name.trim(),
      outcomeKey: key.trim(),
      outcomeGrade: grade.trim(),
      outcomeEarned: earned.trim(),
      outcomePossible: possible.trim(),
      outcomeWeight: weightValue.trim()
    });
  }
  
  // Store the rest for assignment parsing
  const assignmentData = cleanedHtml.substring(tableIndex);
  
  return { outcomes, assignmentData };
}

export async function parseOutcomes_dvhs(courseIDs: number[]): Promise<any[]> {
  console.log(`Parsing outcomes for ${courseIDs.length} courses using dvhs method`);
  
  try {
    const results: any[] = [];
    
    for (const courseID of courseIDs) {
      console.log(`Processing course ${courseID}...`);
      
      // Scrape external tools page - try the specific tool first (Echo Gradebook)
      const externalToolsUrl = `${process.env.CANVAS_BASE_URL}/courses/${courseID}/external_tools/493`;
      const externalToolsHtml = await pageScrape(externalToolsUrl, 'react');
      
      // Save external tools HTML
      const docsDir = path.join(process.cwd(), '..', 'docs');
      if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
      }
      const externalToolsFilePath = path.join(docsDir, `zxq_${courseID}_external_tools_react.txt`);
      fs.writeFileSync(externalToolsFilePath, externalToolsHtml, 'utf8');
      console.log(`External tools REACT saved to: ${externalToolsFilePath}`);
      
      // Parse external tools - strip attributes and keep only table, tr, td, span, div
      const cleanedHtml = parseExternalTools(externalToolsHtml);
      const cleanedFilePath = path.join(docsDir, `zxq_${courseID}_external_tools_react.txt`);
      fs.writeFileSync(cleanedFilePath, cleanedHtml, 'utf8');
      console.log(`Cleaned external tools saved to: ${cleanedFilePath}`);
      
      // Parse outcomes from cleaned HTML
      const { outcomes, assignmentData } = parseOutcomesFromCleaned(cleanedHtml, courseID, docsDir);
      console.log(`Found ${outcomes.length} outcomes`);
      
      // TODO: Parse assignmentData for assignments and modules
      
      // Build result object
      const courseResult = {
        courseId: courseID.toString(),
        outcomes: outcomes,
        modules: [{ name: "All", assignments: [] }],
        assignments: []
      };
      
      results.push(courseResult);
      
      // Save parsed data
      const modulesFilePath = path.join(docsDir, `zxq_${courseID}_external_tools_modules.txt`);
      const modulesJson = JSON.stringify(courseResult, null, 2);
      fs.writeFileSync(modulesFilePath, modulesJson, 'utf8');
      console.log(`External tools data saved to: ${modulesFilePath}`);
    }
    
    return results;
    
  } catch (error) {
    console.error('Error during dvhs parsing:', error);
    throw error;
  }
}
