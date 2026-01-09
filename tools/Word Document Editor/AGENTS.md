# Word Document Editor

Create and edit Word documents with full track changes support using stable XML parsing.


## Approach

This library uses **XML parsing** for maximum stability. Word documents (.docx) are ZIP archives containing XML files. Track changes are stored in the XML structure, which we parse directly rather than using platform-specific automation.

**Why XML parsing:**
- More stable across Word/OS updates
- Cross-platform (Mac and Windows)
- No dependency on Word being installed
- Evergreen approach

**Limitations:**
- Some complex formatting edge cases may not be fully supported
- Requires understanding Word's XML structure


## Dependencies

### Verify Installation

```bash
cd "/cofounder/tools/Word Document Editor"
npm list
```

Expected packages:
- `jszip`
- `@xmldom/xmldom`
- `xpath`
- `dotenv`

### Install Dependencies

```bash
cd "/cofounder/tools/Word Document Editor"
npm install
```


## Core Operations

### Create New Document

**Script:** `scripts/create-document.js`

**Usage:**
```bash
node scripts/create-document.js path/to/new_document.docx
node scripts/create-document.js path/to/new_document.docx --text "Initial content"
node scripts/create-document.js path/to/new_document.docx --title "Document Title" --text "Content"
```

**Options:**
- `output` - Output file path (.docx) (required)
- `--text TEXT` - Initial text content (optional)
- `--title TITLE` - Document title (optional)

Creates a minimal but valid Word document that can be opened in Microsoft Word and edited with all other tools.


### List Track Changes

**Script:** `scripts/list-changes.js`

**Usage:**
```bash
node scripts/list-changes.js path/to/document.docx
```

**Output:** Lists all tracked changes with:
- Change ID (for referencing)
- Type (insertion, deletion, formatting, etc.)
- Author
- Date
- Content/text affected
- Current state (accepted/rejected/pending)

**Example output:**
```
Change ID: 1
Type: Insertion
Author: John Doe
Date: 2024-01-15 10:30:00
Text: "new text added here"
Status: Pending

Change ID: 2
Type: Deletion
Author: Jane Smith
Date: 2024-01-15 11:00:00
Text: "old text removed"
Status: Pending
```


### Apply a Track Change

**Script:** `scripts/apply-change.js`

**Usage:**
```bash
node scripts/apply-change.js path/to/document.docx --change-id 1
```

**Safety:** This script REQUIRES explicit confirmation. It will:
1. Show the change details
2. Prompt for confirmation
3. Only apply if explicitly approved

**Options:**
- `--change-id N` - ID of change to apply (from list_changes output)
- `--output PATH` - Save to new file (default: overwrites original)

**Never accepts changes automatically** - always requires user confirmation.


### Reject a Track Change

**Script:** `scripts/reject-change.js`

**Usage:**
```bash
node scripts/reject-change.js path/to/document.docx --change-id 2
```

**Safety:** Same as apply_change - requires explicit confirmation.

**Options:**
- `--change-id N` - ID of change to reject
- `--output PATH` - Save to new file


### Add a New Tracked Change

**Script:** `scripts/add-change.js`

**Usage:**
```bash
node scripts/add-change.js path/to/document.docx --text "New content" --type insertion
```

**Options:**
- `--text TEXT` - Text to insert or delete
- `--author NAME` - Author name for the change (default: "AIM")
- `--type TYPE` - Type: `insertion`, `deletion`, `formatting`
- `--position N` - Character position (optional, defaults to end)
- `--output PATH` - Save to new file

**Note:** Default author is "AIM" for easy identification of AI-generated changes.


## Comments Operations

### List Comments

**Script:** `scripts/list-comments.js`

**Usage:**
```bash
node scripts/list-comments.js path/to/document.docx
```

**Output:** Lists all comments with:
- Comment ID
- Author
- Date
- Comment text
- Text being commented on (if available)


### Add a Comment

**Script:** `scripts/add-comment.js`

**Usage:**
```bash
node scripts/add-comment.js path/to/document.docx --text "This needs review"
```

**Options:**
- `--text TEXT` - Comment text content (required)
- `--author NAME` - Author name (default: "AIM")
- `--initials INITIALS` - Author initials (default: derived from author)
- `--position N` - Character position (optional, defaults to end)
- `--output PATH` - Save to new file

**Note:** Default author is "AIM" for easy identification of AI-generated comments.


### Apply All Changes (Batch)

**Script:** `scripts/apply-all-changes.js`

**Usage:**
```bash
node scripts/apply-all-changes.js path/to/document.docx
```

**Safety:** Shows summary of ALL changes and requires explicit confirmation before applying any.

**Options:**
- `--output PATH` - Save to new file
- `--filter-author NAME` - Only apply changes by specific author
- `--filter-type TYPE` - Only apply specific change types


## Safety Rules

**CRITICAL:** This library NEVER accepts changes without explicit user feedback.

1. **All apply/reject operations** require explicit confirmation prompts
2. **Batch operations** show full summary before any action
3. **Default behavior** is to save to new file unless `--overwrite` is explicitly used
4. **Change IDs** must be explicitly provided - no "apply all" shortcuts


## Troubleshooting

**"Cannot find module" errors:** Run `npm install` in the Word Document Editor directory.

**"Cannot read document" errors:**
- Ensure file is a valid .docx file
- Check file permissions
- Try opening in Word first to ensure it's not corrupted

**"Change not found" errors:**
- Run `list_changes.py` first to get current change IDs
- Change IDs may change after applying/rejecting other changes

**"Track changes not detected":**
- Ensure track changes is enabled in the Word document
- Some documents may have changes in comments instead of track changes
- Try opening in Word to verify track changes are visible


## Technical Details

**XML Structure:**
- Track changes stored in `word/document.xml` and `word/settings.xml`
- Changes use Word's `w:ins`, `w:del`, `w:moveFrom`, `w:moveTo` elements
- Change metadata in `w:trackChange` attributes
- Comments stored in `word/comments.xml`
- Comment references use `w:commentRangeStart`, `w:commentRangeEnd`, `w:commentReference` elements

**Library Stack:**
- `jszip` - Reading/writing .docx (ZIP) files
- `@xmldom/xmldom` - XML parsing and manipulation
- `xpath` - XPath queries for finding elements
- Direct XML manipulation for full track changes support


## Usage Patterns

**Review workflow:**
1. `list-changes.js` - See all changes
2. Review each change
3. `apply-change.js` or `reject-change.js` - Process individually
4. Or use `apply-all-changes.js` for batch (with confirmation)

**AI editing workflow:**
1. `add-change.js` - Add AI edits as tracked changes (defaults to "AIM" author)
2. `add-comment.js` - Add AI comments for review (defaults to "AIM" author)
3. User reviews in Word
4. User applies/rejects as needed

**Never automate acceptance** - always require human review.

**Comments workflow:**
1. `list-comments.js` - See all comments in document
2. `add-comment.js` - Add new comments (defaults to "AIM" author)
3. Comments appear in Word's review pane

