/**
 * Parsers for extracting data from Canvas external tool pages
 */
import { Page } from 'playwright';
import { ScrapedAssignment, ScrapedCourse, VectorScore, VectorMetadata } from './types';

/**
 * Scrapes assignment data from a Canvas external tool page
 * This will need to be customized based on actual HTML structure
 */
export async function scrapeExternalToolPage(
  page: Page,
  courseId: string
): Promise<ScrapedCourse> {
  console.log(`  📊 Scraping course ${courseId}...`);

  // Get the LTI iframe (should already be loaded by caller)
  const frames = page.frames();
  const iframe = frames.find(f => f.name().includes('tool_content'));
  
  if (!iframe) {
    console.warn('  ⚠️  Could not find Echo Gradebook iframe');
    return {
      courseId,
      courseName: undefined,
      assignments: [],
      vectorMetadata: [],
      scrapedAt: new Date().toISOString(),
    };
  }
  
  const contentFrame = iframe;
  
  // Wait for React app to load and render the table
  await contentFrame.waitForSelector('.ReactVirtualized__Table, table, [class*="table"]', { timeout: 10000 });
  await contentFrame.waitForTimeout(3000); // Give virtualized table time to render

  // Extract course name if available
  const courseName = await extractCourseName(page);

  // Extract vector metadata from both main page and iframe
  const vectorMetadata = await extractVectorMetadata(page);
  
  // If no vectors found on main page, try inside the iframe
  if (vectorMetadata.length === 0) {
    console.log('  🔄 No vectors found on main page, trying iframe...');
    const iframeVectors = await extractVectorMetadata(contentFrame as any);
    vectorMetadata.push(...iframeVectors);
  }

  // Extract assignments from the iframe
  const assignments = await extractAssignments(contentFrame as any);

  return {
    courseId,
    courseName,
    vectorMetadata,
    assignments,
    scrapedAt: new Date().toISOString(),
  };
}

/**
 * Extracts course name from page
 */
async function extractCourseName(page: Page): Promise<string | undefined> {
  try {
    const nameElement = await page.$('#course_title, .course-title, h1');
    if (nameElement) {
      return await nameElement.textContent() || undefined;
    }
  } catch (error) {
    console.warn('Could not extract course name:', error);
  }
  return undefined;
}

/**
 * Extracts vector metadata from the main page (outside iframe)
 * Looks for vector cards with weights, scores, and percentages
 */
async function extractVectorMetadata(page: Page): Promise<VectorMetadata[]> {
  const vectors: VectorMetadata[] = [];

  try {
    // Look for vector cards/containers - these might be in various structures
    const vectorCards = await page.$$('[class*="vector"], [class*="card"], [class*="metric"], .progress-card, .vector-card, [class*="category"], [class*="score"]');
    
    console.log(`  🔍 Found ${vectorCards.length} potential vector cards`);
    
    // Debug: log some text content to see what we're working with
    if (vectorCards.length > 0) {
      console.log('  📝 Sample card content:');
      for (let i = 0; i < Math.min(3, vectorCards.length); i++) {
        const text = await vectorCards[i].textContent();
        console.log(`    Card ${i}: ${text?.substring(0, 100)}...`);
      }
    }
    
    for (const card of vectorCards) {
      try {
        const cardVectors = await extractVectorFromCard(card);
        if (cardVectors && cardVectors.length > 0) {
          vectors.push(...cardVectors);
        }
      } catch (error) {
        console.warn('Failed to extract vector from card:', error);
      }
    }

    // Remove duplicates based on abbreviation
    const uniqueVectors = vectors.filter((vector, index, self) => 
      index === self.findIndex(v => v.abbreviation === vector.abbreviation)
    );
    
    console.log(`  ✓ Extracted ${uniqueVectors.length} unique vector metadata`);
    return uniqueVectors;
  } catch (error) {
    console.warn('Failed to extract vector metadata:', error);
    return [];
  }
}

/**
 * Extracts vector metadata from a single card element
 */
async function extractVectorFromCard(element: any): Promise<VectorMetadata[]> {
  try {
    const text = await element.textContent() || '';
    
    // The text contains multiple vectors concatenated together
    // Pattern: percentage%score/possible%WtVectorNameAbbreviation
    // Example: "90%54/6010% WtCollaborationCB92%110/12010% WtCritical ThinkingCT"
    
    // More precise regex to avoid capturing wrong numbers
    // The pattern is: percentage%score/possible%WtVectorNameAbbreviation
    // Example: "90%54/6010% WtCollaborationCB" should parse as:
    // - percentage: 90, score: 54, possible: 60, weight: 10
    const vectorPattern = /(\d+)%(\d+)\/(\d+)(\d+)%\s*Wt([A-Za-z\s]+)(CB|CT|CL|LM|OC|Pr|WC)/g;
    const vectors: VectorMetadata[] = [];
    
    let match;
    while ((match = vectorPattern.exec(text)) !== null) {
      const percentage = parseInt(match[1]);
      const score = parseInt(match[2]);
      const possibleWeight = match[3] + match[4]; // "6010" becomes "6010"
      
      // Split possibleWeight into possible and weight
      // We need to find the right split point
      // For "6010", we want possible=60, weight=10
      // For "1201", we want possible=120, weight=1
      // For "1672", we want possible=167, weight=2
      // For "301", we want possible=30, weight=1
      // For "201", we want possible=20, weight=1
      // For "1851", we want possible=185, weight=1
      // For "302", we want possible=30, weight=2
      
      let possible: number;
      let weight: number;
      
      if (possibleWeight.endsWith('10')) {
        possible = parseInt(possibleWeight.slice(0, -2));
        weight = 10;
      } else if (possibleWeight.endsWith('25')) {
        possible = parseInt(possibleWeight.slice(0, -2));
        weight = 25;
      } else if (possibleWeight.endsWith('1')) {
        possible = parseInt(possibleWeight.slice(0, -1));
        weight = 1;
      } else if (possibleWeight.endsWith('2')) {
        possible = parseInt(possibleWeight.slice(0, -1));
        weight = 2;
      } else {
        // Fallback: assume last digit is weight
        possible = parseInt(possibleWeight.slice(0, -1));
        weight = parseInt(possibleWeight.slice(-1));
      }
      
      const name = match[5].trim();
      const abbreviation = match[6];
      
      // Map full names to expected names
      const nameMap: { [key: string]: string } = {
        'Collaboration': 'Collaboration',
        'Critical Thinking': 'Critical Thinking', 
        'Curricular Literacy': 'Curricular Literacy',
        'Learning Mindset': 'Learning Mindset',
        'Oral Communication': 'Oral Communication',
        'Professionalism': 'Professionalism',
        'Written Communication': 'Written Communication'
      };
      
      const mappedName = nameMap[name] || name;
      
      vectors.push({
        abbreviation,
        name: mappedName,
        weight,
        currentScore: score,
        possiblePoints: possible,
        percentage,
      });
    }
    
    // Return all vectors found in this card
    return vectors;
  } catch (error) {
    return [];
  }
}

/**
 * Extracts assignment data from the Echo Gradebook iframe
 */
async function extractAssignments(frame: Page): Promise<ScrapedAssignment[]> {
  const assignments: ScrapedAssignment[] = [];

  try {
    // Look for assignment rows in the virtualized table
    const rows = await frame.$$('.ReactVirtualized__Table__row, tr[class*="row"], [class*="assignment"], [class*="grade"]');
    
    console.log(`  🔍 Found ${rows.length} potential rows`);
    
    for (const row of rows) {
      try {
        const assignment = await extractAssignmentFromRow(row);
        if (assignment) {
          assignments.push(assignment);
        }
      } catch (error) {
        console.warn('Failed to extract assignment from row:', error);
      }
    }

    console.log(`  ✓ Extracted ${assignments.length} assignments`);
  } catch (error) {
    console.warn('Failed to extract assignments:', error);
  }

  return assignments;
}

/**
 * Extracts a single assignment from a table row in Echo Gradebook
 */
async function extractAssignmentFromRow(element: any): Promise<ScrapedAssignment | null> {
  try {
    // Get assignment name (usually first cell)
    const nameEl = await element.$('td:first-child, .assignment-name, .title');
    const name = await nameEl?.textContent();
    if (!name || name.trim().length === 0) return null;

    // Get due date (look for date pattern in the name or separate cell)
    const dueDateMatch = name.match(/Due\s+([^,]+)/);
    const dueDate = dueDateMatch ? dueDateMatch[1].trim() : undefined;
    
    // Clean up name (remove due date if embedded)
    const cleanName = name.replace(/\s*Due\s+[^,]+.*$/, '').trim();

    // Look for vector scores in the row
    // Echo Gradebook has columns for each vector: CB, CT, CL, LM, OC, Pr, WC
    const vectorScores = await extractVectorScores(element);
    
    // Convert all vector scores to VectorScore objects
    const vectorScoresArray: VectorScore[] = [];
    
    for (const [vector, scoreText] of Object.entries(vectorScores)) {
      if (scoreText && scoreText !== '•') {
        // Handle both scored assignments (e.g., "5/5") and missing assignments (e.g., "/25")
        const scoredMatch = scoreText.match(/(\d+\.?\d*)\s*\/\s*(\d+\.?\d*)/);
        const missingMatch = scoreText.match(/\/\s*(\d+\.?\d*)/);
        
        if (scoredMatch) {
          // Scored assignment: "5/5"
          const score = parseFloat(scoredMatch[1]);
          const possiblePoints = parseFloat(scoredMatch[2]);
          vectorScoresArray.push({
            vector,
            score,
            possiblePoints,
            percentage: possiblePoints > 0 ? (score / possiblePoints) * 100 : 0
          });
        } else if (missingMatch) {
          // Missing assignment: "/25"
          const possiblePoints = parseFloat(missingMatch[1]);
          vectorScoresArray.push({
            vector,
            score: 0, // No score earned
            possiblePoints,
            percentage: 0 // 0% since no score
          });
        }
      }
    }

    return {
      id: `${cleanName}-${Date.now()}`,
      name: cleanName,
      dueDate,
      vectorScores: vectorScoresArray,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Extracts vector scores from a table row
 */
async function extractVectorScores(element: any): Promise<Record<string, string>> {
  const vectors = ['CB', 'CT', 'CL', 'LM', 'OC', 'Pr', 'WC'];
  const scores: Record<string, string> = {};

  try {
    // Look for cells that contain vector scores
    const cells = await element.$$('td');
    
    for (let i = 0; i < cells.length; i++) {
      const cellText = await cells[i].textContent();
      if (cellText) {
        const trimmed = cellText.trim();
        // Check if this looks like a score (contains "/" or is "•")
        if (trimmed.includes('/') || trimmed === '•') {
          // Try to match with known vectors based on position or content
          if (i < vectors.length) {
            scores[vectors[i]] = trimmed;
          }
        }
      }
    }
  } catch (error) {
    // Ignore errors, return empty scores
  }

  return scores;
}

/**
 * Takes a screenshot of the page for debugging
 */
export async function capturePageScreenshot(
  page: Page,
  filename: string
): Promise<void> {
  await page.screenshot({ 
    path: `scraper/${filename}`,
    fullPage: true 
  });
}

