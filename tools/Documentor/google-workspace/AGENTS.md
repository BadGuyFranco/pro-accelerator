# Google Workspace Sub-tool

Create, edit, read, and export Google Docs, Sheets, and Slides via Google APIs.

**This is an optional sub-tool.** Only set it up if you specifically need native Google Docs/Sheets/Slides integration. For Word and PDF files, use the Local Generator instead (no setup required).

## Quick Start

```bash
node scripts/docs.js create --title "Meeting Notes" --account user@example.com
```

Expected output:
```
Document: Meeting Notes
URL: https://docs.google.com/document/d/abc123/edit
```

**If the command fails,** complete Setup below first.

## Setup

**Requires Google Cloud Console configuration.**

See **`SETUP.md`** for step-by-step instructions.

Quick summary:
1. Create Google Cloud project
2. Enable Docs, Sheets, Slides, Drive APIs
3. Configure OAuth consent screen
4. Create OAuth credentials (Desktop app)
5. Run: `node scripts/auth.js setup --account your@email.com`

Credentials stored in `/memory/Documentor/accounts/google/[email].json`

## Scripts

| Script | Purpose | Help |
|--------|---------|------|
| `scripts/docs.js` | Create, read, edit, export Google Docs | `--help` |
| `scripts/sheets.js` | Create, read, write, export Google Sheets | `--help` |
| `scripts/slides.js` | Create, read, add/delete slides, export Google Slides | `--help` |
| `scripts/drive.js` | Folder navigation, file ops, comments | `--help` |
| `scripts/auth.js` | OAuth setup and token management | `--help` |
| `scripts/collaboration.js` | Document collaboration (imported by docs.js) | JSDoc in file |

Run any script with `--help` for full command syntax.

## Key Capabilities

**Document styling** (via `docs.js`):
- Get/set margins (all sides or individual)
- Get/set page size (Letter, A4, trade paperback, custom)

**Document collaboration** (via `docs.js` or import `collaboration.js`):
- Inline markers: colored `[comment:]` (blue) and `[suggestion:]` (gold) annotations
- Find and replace with optional highlighting
- List/accept native Google suggestions
- Update heading styles (font, size, color)

**Export**: Native formats (pdf, docx, txt, html, rtf, odt). For conversion to md/epub, export to HTML then use `local-generator/scripts/convert.js`.

**Path detection**: Automatically extracts account from Google Drive paths like `/Users/.../GoogleDrive-user@example.com/Shared drives/...`

## Known Limitations

**Cannot create suggestions programmatically.** Google Docs "Suggesting" mode is UI-only. Workaround: inline markers.

**Drive API comments don't appear in Docs margin.** They're file-level, not document-anchored. Workaround: inline markers.

## Troubleshooting

**"No credentials found":** Run `node scripts/auth.js setup --account your@email.com`

**"Token refresh failed":** Credentials revoked. Re-run setup.

**"Folder not found":** Check spelling (case-sensitive) and access permissions.

**"Shared Drive not found":** Must be a member of the Shared Drive.
