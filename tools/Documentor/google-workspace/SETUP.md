# Google Workspace Setup Guide

Step-by-step instructions for setting up Google Docs, Sheets, and Slides integration.

**Time required:** 10-15 minutes (one-time setup per Google account)

## Prerequisites

- A Google account (free Gmail or Google Workspace; both work)
- Access to [Google Cloud Console](https://console.cloud.google.com/)

**Note:** Google Cloud Console is free to use and available to anyone with a Google account. You don't need a paid Google Workspace subscription.

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Make sure you're signed in with the Google account you want to connect
3. Click the project dropdown at the top left (next to "Google Cloud")
4. Click **New Project**
5. Name it **Cofounder Tools**
6. Click **Create**
7. Wait for the project to be created (10-30 seconds)
8. **Important:** Click the project dropdown again and select **Cofounder Tools** to confirm you're working in the correct project

## Step 2: Enable Required APIs

1. **Verify you're in the correct project:** Look at the top left of the page, next to "Google Cloud". You should see **Cofounder Tools**. If you see a different project name, click on it and select Cofounder Tools.

**API 1: Google Docs API**
2. Click the hamburger menu (☰) at the top left to open the sidebar
3. Go to **APIs & Services** → **Library**
4. Search for **Google Docs API**
5. Click on it
6. Click **Enable**

**API 2: Google Sheets API**
7. Click **Library** in the left sidebar to return to the API Library
8. Search for **Google Sheets API**
9. Click on it
10. Click **Enable**

**API 3: Google Slides API**
11. Click **Library** in the left sidebar to return
12. Search for **Google Slides API**
13. Click on it
14. Click **Enable**

**API 4: Google Drive API**
15. Click **Library** in the left sidebar to return
16. Search for **Google Drive API**
17. Click on it
18. Click **Enable**

## Step 3: Configure OAuth Consent Screen

Before creating credentials, you must configure the consent screen:

1. Click the hamburger menu (☰) and go to **APIs & Services** → **OAuth consent screen**
2. If you see "Google Auth Platform not configured yet", click **Get started**

**Note:** You're creating a personal OAuth app for your own use. It stays in "Testing" mode and only you can authenticate with it.

### App Information

| Field | Enter |
|-------|-------|
| App name | Cofounder Tools |
| User support email | Your email (select from dropdown) |

3. Click **Next**

### Audience

4. Select your audience type:
   - **Internal** - Choose this if you have Google Workspace (recommended for isolation)
   - **External** - Choose this if you have a free Gmail account
5. Click **Next**

**Architecture note:** Create a separate Google Cloud project for each Google account you want to connect. This provides complete isolation; you can revoke access to one account without affecting others.

### Contact Information

6. Enter your email address
7. Click **Next**

### Finish

8. Review and click **Finish** (or **Create**)

You should now see the OAuth consent screen dashboard.

## Step 4: Create OAuth Credentials

1. Click the hamburger menu (☰) and go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Desktop app** as the application type
4. Name it **Cofounder Tools CLI**
5. Click **Create**

You'll see a popup with:
- **Client ID** (long string ending in `.apps.googleusercontent.com`)
- **Client Secret** (shorter string)

Copy both values; you'll need them next.

**Note:** Desktop apps automatically allow localhost redirects; no manual redirect URI configuration is needed.

## Step 5: Complete Authentication

Provide the AI agent with your **Client ID** and **Client Secret**. The agent will:

1. Run the auth script with your credentials
2. Generate an authorization URL
3. You open the URL in your browser and click **Allow**
4. The callback is captured automatically (no manual code entry)
5. Credentials are saved to `/memory/Documentor/accounts/google/your@email.com.json`

If running manually:

```bash
cd "/path/to/cofounder/tools/Documentor/google-workspace"
npm install
node scripts/auth.js setup --account your@email.com --client-id "YOUR_CLIENT_ID" --client-secret "YOUR_CLIENT_SECRET"
```

Open the displayed URL, authorize, and the callback is captured automatically.

## Step 6: Verify Setup

Test that everything works:

```bash
node scripts/auth.js status --account your@email.com
```

You should see:
```
Account: your@email.com
Status: VALID
```

## Troubleshooting

### "Access blocked: This app's request is invalid"

You selected "Web application" instead of "Desktop app" when creating credentials. Delete the credential and create a new one, selecting **Desktop app**.

### "Error 403: access_denied" (External users only)

If you chose External audience, add yourself as a test user in the OAuth consent screen.

### Token expired errors

Tokens auto-refresh, but if issues occur:

```bash
node scripts/auth.js refresh --account your@email.com
```

If refresh fails, re-run setup with your credentials.

### Wrong Google account

Delete the credentials file and re-run setup:

```bash
rm /memory/Documentor/accounts/google/wrong@email.com.json
```

## Multiple Accounts

To set up additional Google accounts, repeat Step 5 for each account:

```bash
node scripts/auth.js setup --account another@email.com
```

The tool will automatically detect which account to use based on the Google Drive path you're working in.

## Security Notes

- Credentials are stored in `/memory/Documentor/accounts/google/`
- These files contain sensitive tokens; do not share them
- The `/memory/` directory should be gitignored
- Tokens auto-refresh; you shouldn't need to re-authorize unless revoked

