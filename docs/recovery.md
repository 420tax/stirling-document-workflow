# Recovery Guide

This document explains how to rebuild or troubleshoot the document intake workflow if one component fails.

The production environment may contain credentials, OAuth tokens, passwords, or private identifiers. Those values are intentionally **not** stored in this repository.

---

# System Overview

The workflow has two intake paths.

## Gmail Intake

```text
Gmail
  ↓
Gmail Workspace Add-on
  ↓
Google Apps Script
  ↓
Google Drive: Email PDF Intake
  ↓
rclone
  ↓
Unraid
  ↓
Windows SMB
  ↓
Stirling PDF
```

## Scanner Intake

```text
OSS Document Scanner
  ↓
Google Drive PDF Sync
  ↓
Google Drive: OSS Document Scanner
  ↓
rclone
  ↓
Unraid
  ↓
Windows SMB
  ↓
Stirling PDF
```

Google Drive acts as a transport layer. Unraid is the persistent local archive.

---

# Important Paths

## Persistent rclone Configuration

```text
/boot/config/rclone/rclone.conf
```

Do not commit this file to GitHub.

## Local Document Folders

```text
/mnt/user/Documents/Email PDF Intake
/mnt/user/Documents/OSS Document Scanner
```

## Stirling Appdata

Typical persistent paths:

```text
/mnt/user/appdata/stirling-pdf/configs
/mnt/user/appdata/stirling-pdf/logs
/mnt/user/appdata/stirling-pdf/pipeline
/mnt/user/appdata/stirling-pdf/tessdata
/mnt/user/appdata/stirling-pdf/customFiles
```

---

# Recovery Order

When troubleshooting, work through the system in sequence.

For Gmail:

```text
Gmail
→ Apps Script
→ Google Drive
→ rclone
→ Unraid
→ SMB
→ Stirling
```

For scanning:

```text
OSS Document Scanner
→ Google Drive
→ rclone
→ Unraid
→ SMB
→ Stirling
```

Do not troubleshoot downstream components until the document is confirmed at the previous stage.

---

# 1. Verify Google Drive

The expected Drive folders are:

```text
Email PDF Intake
OSS Document Scanner
```

If the document is already present in Google Drive, the upstream intake mechanism is working.

The problem is then likely:

```text
rclone
Unraid
User Scripts scheduling
SMB
```

---

# 2. Verify rclone

Check the installed version:

```bash
rclone version
```

Verify that the persistent configuration can access Google Drive:

```bash
rclone --config /boot/config/rclone/rclone.conf lsd gdrive:
```

Expected result: Google Drive directories should be listed.

---

# 3. Verify Email PDF Intake

List the remote folder:

```bash
rclone ls \
  "gdrive:Email PDF Intake" \
  --config "/boot/config/rclone/rclone.conf"
```

If the expected PDF appears here, Google Drive and rclone authentication are working.

Run the transfer manually:

```bash
rclone copy \
  "gdrive:Email PDF Intake" \
  "/mnt/user/Documents/Email PDF Intake" \
  --config "/boot/config/rclone/rclone.conf" \
  -P
```

Then verify:

```bash
ls -lah "/mnt/user/Documents/Email PDF Intake"
```

---

# 4. Verify OSS Document Scanner Intake

List the remote folder:

```bash
rclone ls \
  "gdrive:OSS Document Scanner" \
  --config "/boot/config/rclone/rclone.conf"
```

Run the transfer manually:

```bash
rclone copy \
  "gdrive:OSS Document Scanner" \
  "/mnt/user/Documents/OSS Document Scanner" \
  --config "/boot/config/rclone/rclone.conf" \
  -P
```

Then verify:

```bash
ls -lah "/mnt/user/Documents/OSS Document Scanner"
```

---

# 5. Recreate the Unraid User Scripts

Two scripts are required.

## Email Intake

```bash
#!/bin/bash

rclone copy \
  "gdrive:Email PDF Intake" \
  "/mnt/user/Documents/Email PDF Intake" \
  --config "/boot/config/rclone/rclone.conf" \
  --log-level INFO
```

Recommended description:

```text
Pulls new email-intake PDFs from Google Drive to the Unraid archive without deleting archived local copies.
```

Schedule:

```cron
* * * * *
```

---

## Scanner Intake

```bash
#!/bin/bash

rclone copy \
  "gdrive:OSS Document Scanner" \
  "/mnt/user/Documents/OSS Document Scanner" \
  --config "/boot/config/rclone/rclone.conf" \
  --log-level INFO
```

Recommended description:

```text
Pulls new scanned PDFs from Google Drive to the Unraid archive.
```

Schedule:

```cron
* * * * *
```

---

# 6. Why `copy` Must Be Used

Do not casually replace:

```bash
rclone copy
```

with:

```bash
rclone sync
```

`copy` preserves local documents even if the cloud copy is later deleted.

Desired behavior:

```text
Google Drive file created
        ↓
Copied to Unraid
        ↓
Google Drive file later deleted
        ↓
Unraid copy remains
```

Using `sync` could cause cloud deletions to propagate to the local archive.

---

# 7. Rebuild rclone Authentication

The Google Drive remote is named:

```text
gdrive
```

The intended Google Drive permission level is:

```text
drive.readonly
```

This gives Unraid permission to retrieve documents without permission to alter or delete Google Drive content.

After rebuilding the remote, store the working configuration at:

```text
/boot/config/rclone/rclone.conf
```

Test it with:

```bash
rclone \
  --config "/boot/config/rclone/rclone.conf" \
  lsd gdrive:
```

Never commit the resulting `rclone.conf`.

---

# 8. Gmail Labels

The Gmail workflow requires these labels:

```text
PDF Intake
PDF Processed
```

## PDF Processed

Applied after an attachment is successfully written to Google Drive.

## PDF Intake

Used as the fallback asynchronous workflow.

When `PDF Intake` is applied, the Apps Script timer job processes the thread, removes `PDF Intake`, and applies `PDF Processed`.

---

# 9. Apps Script Requirements

The Apps Script project requires these advanced services:

```text
Gmail API v1
Drive API v3
```

The required manifest is stored in:

```text
apps-script/appsscript.json
```

The working source code is stored in:

```text
apps-script/Code.gs
```

---

# 10. Apps Script Trigger

The fallback Gmail intake requires a time-driven trigger.

Function:

```text
processPdfIntake
```

Trigger type:

```text
Time-driven
```

Timer:

```text
Minutes timer
```

Interval:

```text
Every 1 minute
```

If Gmail messages with the `PDF Intake` label stop being processed, verify this trigger still exists.

---

# 11. Gmail Add-on

The Gmail add-on uses:

```text
onGmailMessageOpen
```

to build the Gmail contextual interface.

The button executes:

```text
processCurrentMessagePdf
```

The expected button label is:

```text
Send PDFs to Intake
```

Normal behavior:

```text
Open Gmail message
       ↓
Open Email PDF Intake add-on
       ↓
Send PDFs to Intake
       ↓
PDF written to Drive
       ↓
PDF Processed applied
```

The Gmail label should only be changed **after** the Drive write succeeds.

---

# 12. Drive Folder Recovery

The Apps Script creates and manages:

```text
Email PDF Intake
```

The folder ID is stored in Script Properties under:

```text
EMAIL_PDF_INTAKE_FOLDER_ID
```

If the Drive folder is deleted or the stored ID becomes invalid:

1. Open the Apps Script project.
2. Open **Project Settings**.
3. Locate **Script Properties**.
4. Remove:

```text
EMAIL_PDF_INTAKE_FOLDER_ID
```

5. Run the intake workflow again.

The script will create a new `Email PDF Intake` folder and store the new folder ID.

---

# 13. Duplicate Protection

Processed Gmail attachments are recorded in Script Properties.

Keys use the format:

```text
pdf:<MESSAGE_ID>:<ATTACHMENT_ID>
```

This prevents duplicate files when:

- the Gmail button is clicked repeatedly;
- the timer sees the same message more than once;
- a message is processed through both workflows.

Do not delete these properties unless duplicate history intentionally needs to be reset.

---

# 14. Gmail Attachment Handling

One implementation detail is important.

This did **not** work:

```javascript
Utilities.base64DecodeWebSafe(attachmentData.data);
```

It generated:

```text
Exception: Could not decode string.
```

Treating the value as a normal string also failed.

The working implementation with the Apps Script Advanced Gmail service is:

```javascript
const bytes = attachmentData.data;

const blob = Utilities.newBlob(
  bytes,
  'application/pdf',
  attachment.filename
);
```

If the Gmail attachment code is rewritten, preserve this behavior unless testing proves the API representation has changed.

---

# 15. OSS Document Scanner Recovery

Expected configuration:

```text
Google Drive PDF Sync: Enabled
OCR: Enabled
Language: English
Quality: Best
Remote folder: OSS Document Scanner
Delete after sync: Off
```

If scans remain on the phone and never appear in Google Drive, troubleshoot the scanner before troubleshooting Unraid.

Check:

```text
Google authentication
Google Drive PDF Sync
Auto Sync
Remote folder
Network connectivity
```

---

# 16. Stirling PDF Recovery

Stirling runs as a Docker container on Unraid.

Typical container settings:

```text
Container: StirlingPDF
Image: docker.stirlingpdf.com/stirlingtools/stirling-pdf:latest
Container Port: 8080
```

Important environment variables:

```text
SECURITY_ENABLELOGIN=true
SYSTEM_DEFAULTLOCALE=en-US
SYSTEM_GOOGLEVISIBILITY=false
SYSTEM_ENABLEANALYTICS=false
```

Persistent appdata must remain outside the container.

The source PDFs are **not dependent on Stirling**. If Stirling fails entirely, archived PDFs should still remain intact under:

```text
/mnt/user/Documents
```

---

# 17. Windows SMB Recovery

If a PDF exists on Unraid but does not appear on the workstation, the intake system is already working.

Verify the Unraid `Documents` SMB share independently.

Expected directories:

```text
Documents
├── Email PDF Intake
└── OSS Document Scanner
```

At this point troubleshooting should focus on:

```text
SMB share configuration
Windows credentials
Network connectivity
Mapped-drive configuration
```

Do not modify Apps Script or rclone if the file already exists locally on Unraid.

---

# 18. Common Failure Cases

## Gmail button does nothing

Check:

```text
Apps Script Executions
Gmail add-on authorization
Advanced Gmail API
Advanced Drive API
OAuth permissions
```

---

## Gmail button succeeds but file never reaches Unraid

Check whether the PDF exists in:

```text
Google Drive → Email PDF Intake
```

If yes, test rclone manually.

---

## PDF Intake label remains indefinitely

Check the Apps Script trigger for:

```text
processPdfIntake
```

and inspect Apps Script **Executions** for failures.

---

## Scanner PDF never reaches Drive

Check OSS Document Scanner synchronization.

Do not troubleshoot rclone until the file exists in Drive.

---

## File exists in Drive but not Unraid

Run:

```bash
rclone ls \
  "gdrive:OSS Document Scanner" \
  --config "/boot/config/rclone/rclone.conf"
```

or:

```bash
rclone ls \
  "gdrive:Email PDF Intake" \
  --config "/boot/config/rclone/rclone.conf"
```

Then run the corresponding `rclone copy` command manually.

---

## Manual rclone copy works but scheduled copy does not

The problem is most likely the Unraid User Scripts configuration or schedule.

Verify:

```cron
* * * * *
```

and confirm the script points to:

```text
/boot/config/rclone/rclone.conf
```

---

## File exists on Unraid but not Windows

Troubleshoot SMB only.

---

## Stirling is unavailable

The source documents should still be accessible directly from the SMB share.

Stirling is a processing tool, not the archive.

---

# 19. End-to-End Test

A complete system test should exercise both intake paths.

## Gmail Test

1. Send or locate a Gmail message containing a PDF.
2. Open the message.
3. Open **Email PDF Intake**.
4. Click:

```text
Send PDFs to Intake
```

5. Verify `PDF Processed` is applied.
6. Verify the PDF appears in:

```text
Google Drive → Email PDF Intake
```

7. Wait up to approximately one minute.
8. Verify:

```text
/mnt/user/Documents/Email PDF Intake
```

9. Verify the file appears through the Windows SMB share.
10. Open or process it in Stirling.

---

## Scanner Test

1. Scan a document with OSS Document Scanner.
2. Save the PDF.
3. Verify it appears in:

```text
Google Drive → OSS Document Scanner
```

4. Wait up to approximately one minute.
5. Verify:

```text
/mnt/user/Documents/OSS Document Scanner
```

6. Verify the file appears through the Windows SMB share.
7. Open or process it in Stirling.

---

# Security Notes

Never commit:

```text
rclone.conf
OAuth tokens
Google credentials
Passwords
API secrets
Private deployment identifiers
```

The public repository should contain only the reproducible configuration and source code needed to rebuild the workflow.

The intended security boundaries are:

```text
Apps Script
    ↓
drive.file

Unraid
    ↓
drive.readonly

Stirling
    ↓
Internal network only
```

This keeps each component limited to the access required for its specific role.
