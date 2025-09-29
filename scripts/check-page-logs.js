#!/usr/bin/env node

const { firefox } = require('playwright');

async function checkPageLogs() {
  console.log('🔍 Checking page logs for /assignments...\n');
  
  const browser = await firefox.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture console logs
  const logs = [];
  page.on('console', msg => {
    const log = {
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    };
    logs.push(log);
    console.log(`[${log.type.toUpperCase()}] ${log.text}`);
  });

  // Capture page errors
  page.on('pageerror', error => {
    const log = {
      type: 'error',
      text: `Page Error: ${error.message}`,
      timestamp: new Date().toISOString()
    };
    logs.push(log);
    console.log(`[ERROR] Page Error: ${error.message}`);
  });
  
  // Capture network requests
  const requests = [];
  page.on('request', req => {
    requests.push({
      method: req.method(),
      url: req.url(),
      timestamp: new Date().toISOString()
    });
  });
  
  const responses = [];
  page.on('response', res => {
    responses.push({
      status: res.status(),
      url: res.url(),
      timestamp: new Date().toISOString()
    });
  });
  
  try {
    console.log('📱 Navigating to /assignments...');
    await page.goto('http://localhost:3000/assignments', { waitUntil: 'networkidle' });
    
    console.log('⏳ Waiting 3 seconds for data to load...');
    await page.waitForTimeout(3000);
    
    console.log('\n📊 PAGE CONTENT ANALYSIS:');
    console.log('========================');
    
    // Check what's actually on the page
    const studentText = await page.textContent('body');
    const hasStudentText = studentText.includes('Student:');
    const hasNoStudentsText = studentText.includes('No students found');
    const hasCheckingAuthText = studentText.includes('Checking authentication');
    const hasSignInText = studentText.includes('Sign in to view students');
    const hasSignInRequiredText = studentText.includes('Sign in required to view assignments');
    
    console.log(`✅ Has "Student:" text: ${hasStudentText}`);
    console.log(`❌ Has "No students found": ${hasNoStudentsText}`);
    console.log(`⏳ Has "Checking authentication": ${hasCheckingAuthText}`);
    console.log(`🔐 Has "Sign in to view students": ${hasSignInText}`);
    console.log(`🔐 Has "Sign in required to view assignments": ${hasSignInRequiredText}`);
    
    // Debug: Show actual text content
    console.log('\n🔍 DEBUG - First 500 chars of body text:');
    console.log(studentText.substring(0, 500));
    
    // Check for student buttons
    const studentButtons = await page.locator('button[class*="px-3 py-1 text-sm font-medium rounded-md"]').count();
    console.log(`🔘 Student buttons found: ${studentButtons}`);
    
    // Check for specific elements
    const studentSelector = await page.locator('text=Student:').count();
    console.log(`👤 Student selector elements: ${studentSelector}`);
    
    console.log('\n🌐 NETWORK REQUESTS:');
    console.log('===================');
    const authRequests = requests.filter(r => r.url.includes('/api/auth/'));
    const dataRequests = requests.filter(r => r.url.includes('/api/student-data'));
    
    console.log(`🔐 Auth requests: ${authRequests.length}`);
    authRequests.forEach(req => console.log(`  ${req.method} ${req.url}`));
    
    console.log(`📊 Data requests: ${dataRequests.length}`);
    dataRequests.forEach(req => console.log(`  ${req.method} ${req.url}`));
    
    console.log('\n📡 RESPONSES:');
    console.log('============');
    const authResponses = responses.filter(r => r.url.includes('/api/auth/'));
    const dataResponses = responses.filter(r => r.url.includes('/api/student-data'));
    
    console.log(`🔐 Auth responses: ${authResponses.length}`);
    authResponses.forEach(res => console.log(`  ${res.status} ${res.url}`));
    
    console.log(`📊 Data responses: ${dataResponses.length}`);
    dataResponses.forEach(res => console.log(`  ${res.status} ${res.url}`));
    
    console.log('\n📝 CONSOLE LOGS:');
    console.log('===============');
    const errorLogs = logs.filter(l => l.type === 'error');
    const warnLogs = logs.filter(l => l.type === 'warning');
    const infoLogs = logs.filter(l => l.type === 'log');
    
    if (errorLogs.length > 0) {
      console.log(`❌ Errors (${errorLogs.length}):`);
      errorLogs.forEach(log => console.log(`  [${log.timestamp}] ${log.text}`));
    }
    
    if (warnLogs.length > 0) {
      console.log(`⚠️  Warnings (${warnLogs.length}):`);
      warnLogs.forEach(log => console.log(`  [${log.timestamp}] ${log.text}`));
    }
    
    if (infoLogs.length > 0) {
      console.log(`ℹ️  Info logs (${infoLogs.length}):`);
      infoLogs.forEach(log => console.log(`  [${log.timestamp}] ${log.text}`));
    }
    
    console.log('\n🎯 QUICK DIAGNOSIS:');
    console.log('==================');
    
    if (hasStudentText) {
      console.log('✅ Student selector is working - shows student buttons');
    } else if (hasSignInText) {
      console.log('✅ Student selector is working - shows "Sign in to view students"');
    } else if (hasNoStudentsText) {
      console.log('❌ Student selector shows "No students found"');
    } else if (hasCheckingAuthText) {
      console.log('⏳ Student selector shows "Checking authentication"');
    } else {
      console.log('❌ No student selector text found');
    }
    
    if (hasSignInRequiredText) {
      console.log('✅ Assignment list is working - shows "Sign in required to view assignments"');
    } else if (dataResponses.length > 0) {
      console.log('✅ Student data API calls made');
    } else {
      console.log('⏳ No student data API calls made (expected if not authenticated)');
    }
    
    // Check for JavaScript errors
    const jsErrors = logs.filter(l => l.type === 'error');
    if (jsErrors.length > 0) {
      console.log(`❌ JavaScript errors detected: ${jsErrors.length}`);
      jsErrors.forEach(log => console.log(`  ${log.text}`));
    } else {
      console.log('✅ No JavaScript errors detected');
    }
    
  } catch (error) {
    console.error('❌ Error checking page:', error.message);
  } finally {
    await browser.close();
  }
}

checkPageLogs().catch(console.error);
