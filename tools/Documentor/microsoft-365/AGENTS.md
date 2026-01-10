# Microsoft 365 Sub-tool

**STATUS: FUTURE - Not yet implemented**

## Purpose

Alternative cloud backend for users with Microsoft 365 / OneDrive / SharePoint instead of Google Workspace.

## Planned Capabilities

| Operation | Google Equivalent | Microsoft |
|-----------|-------------------|-----------|
| Documents | Google Docs | Word Online |
| Spreadsheets | Google Sheets | Excel Online |
| Presentations | Google Slides | PowerPoint Online |
| Storage | Google Drive | OneDrive / SharePoint |
| Export | Drive API | Graph API |

## Technical Stack

- **API:** Microsoft Graph API
- **Package:** `@microsoft/microsoft-graph-client`
- **Auth:** Azure AD OAuth (similar pattern to Google OAuth)

## Planned Scripts

```
scripts/
  auth.js         ← Azure AD OAuth, multi-account
  word.js         ← Word Online operations
  excel.js        ← Excel Online operations
  powerpoint.js   ← PowerPoint Online operations
  onedrive.js     ← Folder detection, export, file management
```

## When to Build

Build this sub-tool when:
1. Users need OneDrive/SharePoint integration
2. Microsoft 365 is the primary cloud platform
3. Google Workspace is not available

Implementation follows same patterns as `google-workspace/` sub-tool.

