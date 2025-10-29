/* eslint-disable no-console */
/**
 * Canvas authentication with session persistence
 */
import { firefox, Browser, BrowserContext } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const AUTH_STATE_PATH = path.join(__dirname, 'auth-state.json');

export interface CanvasAuthOptions {
  username: string;
  password: string;
  baseUrl: string;
  headless?: boolean;
}

/**
 * Creates an authenticated browser context, reusing saved session if available
 */
export async function getAuthenticatedContext(
  options: CanvasAuthOptions
): Promise<{ browser: Browser; context: BrowserContext }> {
  const browser = await firefox.launch({ 
    headless: options.headless ?? true 
  });

  // Try to reuse existing session
  if (fs.existsSync(AUTH_STATE_PATH)) {
    console.log('🔄 Reusing saved authentication session...');
    try {
      const context = await browser.newContext({
        storageState: AUTH_STATE_PATH,
      });
      
      // Verify session is still valid
      const isValid = await verifySession(context, options.baseUrl);
      if (isValid) {
        console.log('✅ Session is valid');
        return { browser, context };
      } else {
        console.log('⚠️  Session expired, logging in again...');
        await context.close();
      }
    } catch (error) {
      console.log('⚠️  Could not reuse session:', error);
    }
  }

  // Perform fresh login
  const context = await browser.newContext();
  await performLogin(context, options);
  
  // Save session for next time
  await context.storageState({ path: AUTH_STATE_PATH });
  console.log('💾 Session saved for future use');

  return { browser, context };
}

/**
 * Performs Canvas login with username/password
 */
async function performLogin(
  context: BrowserContext,
  options: CanvasAuthOptions
): Promise<void> {
  console.log('🔐 Logging in to Canvas...');
  
  const page = await context.newPage();
  
  try {
    // Navigate to Canvas login page (direct Canvas auth, not SSO)
    await page.goto(`${options.baseUrl}/login/canvas`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Fill in login form
    await page.fill('input#pseudonym_session_unique_id', options.username);
    await page.fill('input#pseudonym_session_password', options.password);
    
    // Submit and wait for navigation
    await Promise.all([
      page.waitForNavigation({ timeout: 15000 }),
      page.click('input[type="submit"][value="Log In"]')
    ]);
    
    // Verify login succeeded
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      const errorMsg = await page.locator('.ic-flash-error, .error_text, [role="alert"], .ic-flash-static').first().textContent().catch(() => null);
      if (errorMsg) {
        throw new Error(`Login failed: ${errorMsg.trim()}`);
      }
      throw new Error('Login failed: Still on login page');
    }
    
    console.log('✅ Login successful');
  } catch (error) {
    console.error('❌ Login failed:', error);
    throw new Error(`Canvas login failed: ${error}`);
  } finally {
    await page.close();
  }
}

/**
 * Verifies that a saved session is still valid
 */
async function verifySession(
  context: BrowserContext,
  baseUrl: string
): Promise<boolean> {
  const page = await context.newPage();
  
  try {
    await page.goto(`${baseUrl}/`, { timeout: 5000 });
    
    // If we're redirected to login page, session is invalid
    const url = page.url();
    const isValid = !url.includes('/login');
    
    await page.close();
    return isValid;
  } catch {
    await page.close();
    return false;
  }
}

/**
 * Clears saved authentication state
 */
export function clearAuthState(): void {
  if (fs.existsSync(AUTH_STATE_PATH)) {
    fs.unlinkSync(AUTH_STATE_PATH);
    console.log('🗑️  Cleared saved authentication state');
  }
}

