/* eslint-disable @typescript-eslint/no-explicit-any, no-console, no-restricted-syntax, camelcase */
import { pageScrape } from './scraper';

export interface ModuleItem {
  title: string;
  assignments: Assignment[];
}

export interface Assignment {
  title: string;
  dueDate: string;
  scores: Array<{ Key: string; Earned: string; Possible: string }>;
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

function parseOutcomesFromCleaned(cleanedHtml: string): Outcome[] {
  const outcomes: Outcome[] = [];
  
  // Find the section between "Total Score" and "<table>"
  const totalScoreIndex = cleanedHtml.indexOf('Total Score');
  const tableIndex = cleanedHtml.indexOf('<table>');
  
  if (totalScoreIndex === -1 || tableIndex === -1) {
    console.log('Could not find "Total Score" or "<table>" in cleaned HTML');
    return outcomes;
  }
  
  // Extract just the outcomes section
  let outcomesSection = cleanedHtml.substring(totalScoreIndex, tableIndex);
  
  // Replace all tags with "~" to make the structure clearer
  outcomesSection = outcomesSection.replace(/<[^>]+>/g, '~');
  
  // Collapse multiple consecutive ~ into a single ~
  outcomesSection = outcomesSection.replace(/~+/g, '~');
  
  // Split by ~ and remove first element ("Total Score")
  const parts = outcomesSection.split('~').filter(p => p.trim() !== '');
  parts.shift(); // Remove "Total Score"
  
  // Each outcome has 5 elements: grade, earned/possible, weight, name, key
  // So we loop through the array in chunks of 5
  console.log(`ZXQ Found ${Math.floor(parts.length / 5)} outcomes`);
  
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
  
  return outcomes;
}

function parseModuleAssignmentsFromCleaned(cleanedHtml: string, _courseID: number): { modules: ModuleItem[]; assignments: string[] } {
  // Find where tables start
  const tableIndex = cleanedHtml.indexOf('<table>');
  
  if (tableIndex === -1) {
    console.log('Could not find "<table>" in cleaned HTML');
    return { modules: [], assignments: [] };
  }
  
  
  const assignmentData = cleanedHtml.substring(tableIndex);
  
  // Save the assignment table content to its own file (DEBUG ONLY - commented out for production)
  // const assignmentTableFilePath = path.join(docsDir, `zxq_${courseID}_assignment_table_content.txt`);
  // fs.writeFileSync(assignmentTableFilePath, assignmentData, 'utf8');
  // console.log(`Assignment table content saved to: ${assignmentTableFilePath}`);
  
  // Split by </table> first
  const tables = assignmentData.split('</table>');
  
  // Enumerate and write the tables (DEBUG ONLY - commented out for production)
  // let enumeratedTables = '';
  // tables.forEach((table, index) => {
  //   enumeratedTables += `[${index}] ${table}\n\n`;
  // });
  
  // Save the enumerated tables for debugging (DEBUG ONLY - commented out for production)
  // const assignmentDebugFilePath = path.join(docsDir, `zxq_${courseID}_assignments_cleaned.txt`);
  // fs.writeFileSync(assignmentDebugFilePath, enumeratedTables, 'utf8');
  // console.log(`Enumerated assignment tables saved to: ${assignmentDebugFilePath}`);
  
  // Parse each module from tables 0-22 (skip last one which is just closing tag)
  const modules: ModuleItem[] = [];
  const allAssignments: string[] = [];
  
  for (let i = 0; i < Math.min(tables.length - 1, 23); i++) {
    const moduleString = tables[i];
    
    // Extract module name from first <tr>
    const firstTrMatch = moduleString.match(/<tr>([^<]+)/);
    const moduleName = firstTrMatch ? firstTrMatch[1].trim() : '';
    
    if (!moduleName) continue;
    
    // Split by <tr> to get rows
    const rows = moduleString.split('<tr>').filter(r => r.trim() !== '');
    
    const moduleAssignments: Assignment[] = [];
    
    // Extract outcome keys from first row
    const outcomeKeysMatch = moduleString.match(/(CB|CT|CL|LM|OC|Pr|WC)/g);
    const outcomeKeys = outcomeKeysMatch || [];
    
    for (let j = 1; j < rows.length; j++) { // Skip first row (module name)
      const row = rows[j];
      
      // Skip Group Totals row
      if (row.includes('Group Totals')) continue;
      
      // Split row by <td> to get cells
      const cells = row.split('<td>').filter(c => c.trim() !== '');
      if (cells.length < 8) continue; // Need at least 8 cells (name/due + 7 outcomes)
      
      // First cell contains assignment name and due date
      const firstCell = cells[0];
      
      // Extract assignment name
      const nameMatch = firstCell.match(/<div><span>([^<]+)<\/span><\/div>/);
      const assignmentName = nameMatch ? nameMatch[1].trim() : '';
      
      // Extract due date
      const dueMatch = firstCell.match(/<div><span>Due<\/span> (.+? pm|.+? am)<\/span><\/div>/);
      let dueDate = '';
      if (dueMatch) {
        const dateStr = dueMatch[1];
        // Parse date like "Oct 6, 2025 at 11:59 pm"
        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj.getTime())) {
          // Format as MM/DD/YYYY HH:MM
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          const year = dateObj.getFullYear();
          const hours = String(dateObj.getHours()).padStart(2, '0');
          const minutes = String(dateObj.getMinutes()).padStart(2, '0');
          dueDate = `${month}/${day}/${year} ${hours}:${minutes}`;
        }
      }
      
      // Parse outcome scores from cells 1-7
      const outcomes: Array<{ Key: string; Earned: string; Possible: string }> = [];
      for (let k = 1; k < cells.length && k <= outcomeKeys.length; k++) {
        const cell = cells[k];
        // Parse scores like <span>5</span><span>/5</span> or <span>•</span>
        const scoreMatch = cell.match(/<span>(\d*)<\/span><span>\/(\d*)<\/span>/);
        if (scoreMatch) {
          const earned = scoreMatch[1] || '0';
          const possible = scoreMatch[2] || '0';
          if (earned !== '0' || possible !== '0') {
            outcomes.push({
              Key: outcomeKeys[k - 1],
              Earned: earned,
              Possible: possible
            });
          }
        }
      }
      
      if (assignmentName) {
        moduleAssignments.push({
          title: assignmentName,
          dueDate,
          scores: outcomes
        });
      }
    }
    
    modules.push({
      title: moduleName,
      assignments: moduleAssignments
    });
    
    moduleAssignments.forEach(a => allAssignments.push(a.title));
  }
  
  return { modules, assignments: allAssignments };
}

export async function parseOutcomes_dvhs(courseIDs: number[]): Promise<any[]> {
  //console.log(`Parsing outcomes for ${courseIDs.length} courses using dvhs method`);
  
  try {
    const results: any[] = [];
    
    for (const courseID of courseIDs) {
      console.log(`ZXQ Processing course ${courseID}...`);
      
      // Scrape external tools page - try the specific tool first (Echo Gradebook)
      const externalToolsUrl = `${process.env.CANVAS_BASE_URL}/courses/${courseID}/external_tools/493`;
      const externalToolsHtml = await pageScrape(externalToolsUrl, 'react');
      
      // Save external tools HTML (DEBUG ONLY - commented out for production)
      // const docsDir = path.join(process.cwd(), '..', 'docs');
      // if (!fs.existsSync(docsDir)) {
      //   fs.mkdirSync(docsDir, { recursive: true });
      // }
      // const externalToolsFilePath = path.join(docsDir, `zxq_${courseID}_external_tools_react.txt`);
      // fs.writeFileSync(externalToolsFilePath, externalToolsHtml, 'utf8');
      // console.log(`External tools REACT saved to: ${externalToolsFilePath}`);
      
      // Parse external tools - strip attributes and keep only table, tr, td, span, div
      const cleanedHtml = parseExternalTools(externalToolsHtml);
      // const cleanedFilePath = path.join(docsDir, `zxq_${courseID}_external_tools_cleaned.txt`);
      // fs.writeFileSync(cleanedFilePath, cleanedHtml, 'utf8');
      // console.log(`Cleaned external tools saved to: ${cleanedFilePath}`);
      
      // Parse outcomes from cleaned HTML
      const outcomes = parseOutcomesFromCleaned(cleanedHtml);
      
      // Parse modules and assignments from cleaned HTML
      const { modules } = parseModuleAssignmentsFromCleaned(cleanedHtml, courseID);
      console.log(`ZXQ Found ${modules.length} modules`);
      
      // Collect all assignments with their outcome scores
      const assignmentObjects = modules.flatMap(m => m.assignments.map(a => ({
        Name: a.title,
        Due: a.dueDate,
        Outcomes: a.scores
      })));
      
      // Build result object
      const courseResult = {
        courseId: courseID.toString(),
        outcomes: outcomes,
        modules: modules.map(m => ({
          name: m.title,
          assignments: m.assignments.map(a => a.title)
        })),
        assignments: assignmentObjects
      };
      
      results.push(courseResult);
      
      // Save parsed data (DEBUG ONLY - commented out for production)
      // const modulesFilePath = path.join(docsDir, `zxq_${courseID}_external_tools_modules.txt`);
      // const modulesJson = JSON.stringify(courseResult, null, 2);
      // fs.writeFileSync(modulesFilePath, modulesJson, 'utf8');
      // console.log(`External tools data saved to: ${modulesFilePath}`);
    }
    
    return results;
    
  } catch (error) {
    console.error('Error during dvhs parsing:', error);
    throw error;
  }
}
