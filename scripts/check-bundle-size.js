#!/usr/bin/env node

/**
 * Bundle size validation script
 * Ensures bundle size stays within budget
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Bundle size limits (in bytes)
const LIMITS = {
  initialRoute: 250 * 1024, // 250KB
  totalApp: 400 * 1024, // 400KB
}

function checkBundleSize() {
  console.log('📦 Checking bundle size...')
  
  try {
    // Build the application
    console.log('🔨 Building application...')
    execSync('npm run build', { stdio: 'pipe' })
    
    // Check if .next directory exists
    const nextDir = path.join(process.cwd(), '.next')
    if (!fs.existsSync(nextDir)) {
      throw new Error('Build failed - .next directory not found')
    }
    
    // Analyze bundle size
    const bundleAnalysis = analyzeBundleSize(nextDir)
    
    console.log('📊 Bundle size analysis:')
    console.log(`   Initial route JS: ${formatBytes(bundleAnalysis.initialRoute)}`)
    console.log(`   Total app: ${formatBytes(bundleAnalysis.totalApp)}`)
    
    // Check limits
    let passed = true
    
    if (bundleAnalysis.initialRoute > LIMITS.initialRoute) {
      console.error(`❌ Initial route JS exceeds limit: ${formatBytes(bundleAnalysis.initialRoute)} > ${formatBytes(LIMITS.initialRoute)}`)
      passed = false
    } else {
      console.log(`✅ Initial route JS within limit: ${formatBytes(bundleAnalysis.initialRoute)} <= ${formatBytes(LIMITS.initialRoute)}`)
    }
    
    if (bundleAnalysis.totalApp > LIMITS.totalApp) {
      console.error(`❌ Total app exceeds limit: ${formatBytes(bundleAnalysis.totalApp)} > ${formatBytes(LIMITS.totalApp)}`)
      passed = false
    } else {
      console.log(`✅ Total app within limit: ${formatBytes(bundleAnalysis.totalApp)} <= ${formatBytes(LIMITS.totalApp)}`)
    }
    
    if (passed) {
      console.log('🎉 Bundle size check passed!')
      process.exit(0)
    } else {
      console.log('💡 Consider:')
      console.log('   - Using dynamic imports for large libraries')
      console.log('   - Code splitting by route')
      console.log('   - Removing unused dependencies')
      process.exit(1)
    }
    
  } catch (error) {
    console.error('❌ Bundle size check failed:')
    console.error(error.message)
    process.exit(1)
  }
}

function analyzeBundleSize(nextDir) {
  const staticDir = path.join(nextDir, 'static')
  let initialRoute = 0
  let totalApp = 0
  
  if (fs.existsSync(staticDir)) {
    // Walk through static files
    const files = walkDirectory(staticDir)
    
    for (const file of files) {
      if (file.endsWith('.js')) {
        const stats = fs.statSync(file)
        const size = stats.size
        
        totalApp += size
        
        // Check if it's likely an initial route file
        if (file.includes('_app') || file.includes('pages') || file.includes('chunks')) {
          initialRoute += size
        }
      }
    }
  }
  
  return {
    initialRoute,
    totalApp,
  }
}

function walkDirectory(dir) {
  const files = []
  
  function walk(currentDir) {
    const items = fs.readdirSync(currentDir)
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        walk(fullPath)
      } else {
        files.push(fullPath)
      }
    }
  }
  
  walk(dir)
  return files
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Run check
checkBundleSize()
