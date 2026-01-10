#!/usr/bin/env node
/**
 * Google OAuth authentication management.
 * Handles setup, token storage, refresh, and multi-account support.
 * 
 * Usage:
 *   node auth.js setup --account user@example.com
 *   node auth.js status --account user@example.com
 *   node auth.js refresh --account user@example.com
 *   node auth.js list
 */

import { google } from 'googleapis';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';
import { createServer } from 'http';
import { URL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Default memory location for credentials
const MEMORY_BASE = process.env.DOCUMENTOR_MEMORY || 
  join(__dirname, '..', '..', '..', '..', '..', 'memory', 'Documentor');
const ACCOUNTS_DIR = join(MEMORY_BASE, 'accounts', 'google');

// OAuth scopes needed for Docs, Sheets, Slides, and Drive
const SCOPES = [
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/drive'
];

/**
 * Prompt user for input
 */
function prompt(question) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Get path to account credentials file
 */
function getAccountPath(email) {
  return join(ACCOUNTS_DIR, `${email}.json`);
}

/**
 * Load credentials for an account
 */
function loadCredentials(email) {
  const accountPath = getAccountPath(email);
  if (!existsSync(accountPath)) {
    return null;
  }
  return JSON.parse(readFileSync(accountPath, 'utf-8'));
}

/**
 * Save credentials for an account
 */
function saveCredentials(email, credentials) {
  // Ensure directory exists
  if (!existsSync(ACCOUNTS_DIR)) {
    mkdirSync(ACCOUNTS_DIR, { recursive: true });
  }
  
  const accountPath = getAccountPath(email);
  writeFileSync(accountPath, JSON.stringify(credentials, null, 2));
}

/**
 * List all configured accounts
 */
function listAccounts() {
  if (!existsSync(ACCOUNTS_DIR)) {
    return [];
  }
  
  return readdirSync(ACCOUNTS_DIR)
    .filter(f => f.endsWith('.json') && !f.startsWith('.'))
    .map(f => f.replace('.json', ''));
}

/**
 * Check if tokens are expired
 */
function isExpired(credentials) {
  if (!credentials.expiry) return true;
  const expiry = new Date(credentials.expiry);
  // Consider expired if less than 5 minutes remaining
  return expiry.getTime() - Date.now() < 5 * 60 * 1000;
}

const REDIRECT_PORT = 3847;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}`;

/**
 * Create OAuth2 client
 */
function createOAuth2Client(credentials) {
  return new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
    REDIRECT_URI
  );
}

/**
 * Start local server to capture OAuth callback
 */
function startCallbackServer() {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${REDIRECT_PORT}`);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');
      
      if (error) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<html><body><h1>Authorization Failed</h1><p>You can close this window.</p></body></html>');
        server.close();
        reject(new Error(`Authorization failed: ${error}`));
        return;
      }
      
      if (code) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<html><body><h1>Authorization Successful</h1><p>You can close this window and return to the terminal.</p></body></html>');
        server.close();
        resolve(code);
        return;
      }
      
      res.writeHead(404);
      res.end();
    });
    
    server.listen(REDIRECT_PORT, () => {
      console.log(`Listening for OAuth callback on port ${REDIRECT_PORT}...`);
    });
    
    server.on('error', (err) => {
      reject(new Error(`Failed to start callback server: ${err.message}`));
    });
    
    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error('Authorization timed out after 5 minutes'));
    }, 5 * 60 * 1000);
  });
}

/**
 * Get authenticated OAuth2 client for an account
 */
export async function getAuthClient(email) {
  const credentials = loadCredentials(email);
  
  if (!credentials) {
    throw new Error(`No credentials found for ${email}. Run: node auth.js setup --account ${email}`);
  }
  
  const oauth2Client = createOAuth2Client(credentials);
  
  oauth2Client.setCredentials({
    access_token: credentials.access_token,
    refresh_token: credentials.refresh_token
  });
  
  // Check if refresh needed
  if (isExpired(credentials)) {
    console.log(`Refreshing tokens for ${email}...`);
    try {
      const { credentials: newTokens } = await oauth2Client.refreshAccessToken();
      
      // Update stored credentials
      credentials.access_token = newTokens.access_token;
      if (newTokens.refresh_token) {
        credentials.refresh_token = newTokens.refresh_token;
      }
      credentials.expiry = newTokens.expiry_date 
        ? new Date(newTokens.expiry_date).toISOString()
        : new Date(Date.now() + 3600 * 1000).toISOString();
      
      saveCredentials(email, credentials);
      
      oauth2Client.setCredentials({
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token
      });
    } catch (error) {
      throw new Error(`Token refresh failed for ${email}. Re-run setup: node auth.js setup --account ${email}`);
    }
  }
  
  return oauth2Client;
}

/**
 * Setup new account credentials
 * Supports both interactive and non-interactive modes
 */
async function setupAccount(email, cliClientId, cliClientSecret, cliCode) {
  console.log(`\nSetting up Google OAuth for: ${email}\n`);
  
  // Use CLI args if provided, otherwise prompt
  let clientIdVal = cliClientId;
  let clientSecretVal = cliClientSecret;
  
  if (!clientIdVal || !clientSecretVal) {
    console.log('You need OAuth 2.0 credentials from Google Cloud Console.');
    console.log('1. Go to: https://console.cloud.google.com/apis/credentials');
    console.log('2. Create or select a project');
    console.log('3. Enable APIs: Google Docs, Sheets, Slides, Drive');
    console.log('4. Create OAuth 2.0 Client ID (Desktop app type)');
    console.log('5. Copy the Client ID and Client Secret\n');
    
    clientIdVal = await prompt('Enter Client ID: ');
    clientSecretVal = await prompt('Enter Client Secret: ');
  }
  
  if (!clientIdVal || !clientSecretVal) {
    console.error('Error: Client ID and Client Secret are required');
    process.exit(1);
  }
  
  const oauth2Client = new google.auth.OAuth2(
    clientIdVal,
    clientSecretVal,
    REDIRECT_URI
  );
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Force consent to get refresh token
  });
  
  console.log('\nOpen this URL in your browser to authorize:\n');
  console.log(authUrl);
  console.log('');
  
  // Use CLI code if provided, otherwise start server to capture
  let code = cliCode;
  if (!code) {
    try {
      code = await startCallbackServer();
    } catch (error) {
      console.error(`\nError: ${error.message}`);
      process.exit(1);
    }
  }
  
  if (!code) {
    console.error('Error: Authorization code is required');
    process.exit(1);
  }
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    const credentials = {
      email,
      client_id: clientIdVal,
      client_secret: clientSecretVal,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry: tokens.expiry_date 
        ? new Date(tokens.expiry_date).toISOString()
        : new Date(Date.now() + 3600 * 1000).toISOString()
    };
    
    saveCredentials(email, credentials);
    
    console.log(`\nSuccess! Credentials saved for ${email}`);
    console.log(`Location: ${getAccountPath(email)}`);
  } catch (error) {
    console.error(`\nError getting tokens: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Generate auth URL without completing setup
 * For non-interactive workflows where code will be provided separately
 */
function generateAuthUrl(email, cliClientId, cliClientSecret) {
  if (!cliClientId || !cliClientSecret) {
    console.error('Error: --client-id and --client-secret are required for get-url');
    process.exit(1);
  }
  
  const oauth2Client = new google.auth.OAuth2(
    cliClientId,
    cliClientSecret,
    REDIRECT_URI
  );
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  
  console.log(authUrl);
}

/**
 * Show status of an account
 */
function showStatus(email) {
  const credentials = loadCredentials(email);
  
  if (!credentials) {
    console.log(`\nNo credentials found for: ${email}`);
    console.log(`Run: node auth.js setup --account ${email}`);
    return;
  }
  
  const expired = isExpired(credentials);
  const expiry = credentials.expiry ? new Date(credentials.expiry) : null;
  
  console.log(`\nAccount: ${email}`);
  console.log(`Status: ${expired ? 'EXPIRED' : 'VALID'}`);
  console.log(`Expiry: ${expiry ? expiry.toLocaleString() : 'Unknown'}`);
  console.log(`Has refresh token: ${credentials.refresh_token ? 'Yes' : 'No'}`);
  console.log(`File: ${getAccountPath(email)}`);
}

/**
 * Manually refresh tokens
 */
async function refreshTokens(email) {
  try {
    await getAuthClient(email);
    console.log(`\nTokens refreshed for ${email}`);
  } catch (error) {
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}

// CLI - only run when this file is the main entry point
async function runCLI() {
  function showHelp() {
    console.log(`
Google OAuth authentication management.

Usage:
  node auth.js <command> [options]

Commands:
  setup     Set up credentials for a new account
  status    Check status of an account's credentials
  refresh   Manually refresh tokens for an account
  list      List all configured accounts

Options:
  --account EMAIL   Google account email (required for setup/status/refresh)
  --help, -h        Show this help message

Examples:
  node auth.js setup --account user@example.com
  node auth.js status --account user@example.com
  node auth.js refresh --account user@example.com
  node auth.js list
`);
    process.exit(0);
  }

  // Parse CLI arguments
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
  }

  const command = args[0];
  let account = null;
  let clientId = null;
  let clientSecret = null;
  let authCode = null;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--account' && args[i + 1]) {
      account = args[++i];
    } else if (args[i] === '--client-id' && args[i + 1]) {
      clientId = args[++i];
    } else if (args[i] === '--client-secret' && args[i + 1]) {
      clientSecret = args[++i];
    } else if (args[i] === '--code' && args[i + 1]) {
      authCode = args[++i];
    }
  }

  switch (command) {
    case 'setup':
      if (!account) {
        console.error('Error: --account is required for setup');
        process.exit(1);
      }
      await setupAccount(account, clientId, clientSecret, authCode);
      break;
    
    case 'get-url':
      if (!account) {
        console.error('Error: --account is required for get-url');
        process.exit(1);
      }
      generateAuthUrl(account, clientId, clientSecret);
      break;
      
    case 'status':
      if (!account) {
        console.error('Error: --account is required for status');
        process.exit(1);
      }
      showStatus(account);
      break;
      
    case 'refresh':
      if (!account) {
        console.error('Error: --account is required for refresh');
        process.exit(1);
      }
      await refreshTokens(account);
      break;
      
    case 'list':
      const accounts = listAccounts();
      if (accounts.length === 0) {
        console.log('\nNo accounts configured.');
        console.log('Run: node auth.js setup --account your@email.com');
      } else {
        console.log('\nConfigured accounts:');
        accounts.forEach(a => console.log(`  - ${a}`));
      }
      break;
      
    default:
      console.error(`Unknown command: ${command}`);
      showHelp();
  }
}

// Only run CLI if this is the main entry point
const __filename = fileURLToPath(import.meta.url);
const isMainModule = __filename === process.argv[1];
if (isMainModule) {
  runCLI();
}

