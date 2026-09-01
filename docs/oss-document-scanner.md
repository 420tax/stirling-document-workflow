# OSS Document Scanner Configuration

This document records the mobile scanning configuration used by the Stirling Document Workflow.

The scanner application is **OSS Document Scanner**, an open-source mobile document scanner. Its job in this architecture is limited to:

1. capturing documents,
2. processing the scan,
3. performing OCR,
4. generating a PDF, and
5. uploading that PDF to Google Drive.

It does **not** communicate directly with Unraid or Stirling PDF.

---

# Workflow

```text
Paper document
      ↓
OSS Document Scanner
      ↓
Image processing
      ↓
OCR
      ↓
PDF generation
      ↓
Google Drive PDF Sync
      ↓
Google Drive
OSS Document Scanner
      ↓
rclone
      ↓
Unraid
/mnt/user/Documents/OSS Document Scanner
```

Google Drive is the transport layer between the phone and Unraid.

---

# Scan Processing Configuration

The scan-processing settings used for this workflow are:

```text
Whitepaper: On
Enhance: Off
Color: Off
Brightness: 0
Contrast: 1.00
Filter: Normal
```

## Whitepaper

`Whitepaper` is enabled.

This processing mode produced the preferred result for ordinary office documents and paperwork.

The objective is a clean, readable document rather than a photographic reproduction of the original page.

## Enhance

```text
Enhance: Off
```

Additional enhancement is not normally required with Whitepaper processing enabled.

## Color

```text
Color: Off
```

The normal workflow is optimized for business documents rather than photographs.

Documents that genuinely require preserved color can be handled separately when necessary.

## Brightness

```text
Brightness: 0
```

No additional brightness adjustment is applied by default.

## Contrast

```text
Contrast: 1.00
```

Contrast remains at the normal value.

## Filter

```text
Filter: Normal
```

No additional specialized filter is applied.

---

# Batch Scanning

Batch scanning is supported and is useful for multi-page documents.

Typical workflow:

```text
Start scan
    ↓
Capture page 1
    ↓
Capture page 2
    ↓
Capture additional pages
    ↓
Review pages
    ↓
Save as one PDF
```

This allows multi-page paper documents to arrive on Unraid as a single PDF rather than as separate image files.

---

# Local Storage

OSS Document Scanner stores its working data on the phone.

Available storage locations are device-based, such as:

```text
Internal storage
SD card
```

The application is **not configured to write directly to SMB storage**.

That is intentional.

Direct SMB access would require the phone to have local-network connectivity and appropriate share credentials. The Google Drive transport design avoids that dependency.

---

# Google Drive PDF Sync

Google Drive PDF synchronization is enabled.

Configuration:

```text
Google Drive PDF Sync: Enabled
Auto Sync: On
Delete after sync: Off
Remote folder: OSS Document Scanner
```

The Google account must be authenticated within OSS Document Scanner.

---

# Remote Folder

The Google Drive destination is:

```text
OSS Document Scanner
```

This folder is later read by rclone on Unraid.

The matching rclone source is:

```text
gdrive:OSS Document Scanner
```

The local destination is:

```text
/mnt/user/Documents/OSS Document Scanner
```

---

# Delete After Sync

```text
Delete after sync: Off
```

The scanner should not automatically delete the phone-side document merely because the Google Drive upload succeeded.

This provides another layer of protection during normal use and troubleshooting.

---

# PDF Naming

The configured naming behavior is:

```text
Use document name when possible: On
Fallback filename: timestamp
Use document folder as subfolder: Off
```

## Document Name

When a document has been given a useful name in OSS Document Scanner, that name is used for the generated PDF.

Example:

```text
Vendor Invoice.pdf
```

rather than an arbitrary generated filename.

## Timestamp Fallback

If a useful document name is unavailable, the scanner uses a timestamp as the fallback filename.

This ensures that each generated PDF still receives a usable and generally unique name.

## Document Folder as Subfolder

```text
Use document folder as subfolder: Off
```

All synced PDFs are placed directly into:

```text
Google Drive
└── OSS Document Scanner
```

rather than reproducing the scanner application's internal folder structure in Google Drive.

This keeps the rclone intake path simple.

---

# PDF Export Configuration

The normal PDF export settings are:

```text
Orientation: Portrait
Page size / scaling: Full
Output: Color
Pages per sheet: 1
Margin: 10
Transparent OCR text: Enabled
Password: None
```

---

# Portrait Orientation

```text
Orientation: Portrait
```

This matches the majority of office documents handled by the workflow.

Orientation can be changed for an individual document when necessary.

---

# Full Page Output

```text
Page size / scaling: Full
```

The scanned page is exported at the normal full-page size rather than being intentionally reduced.

---

# PDF Color Setting

The PDF export setting is:

```text
Output: Color
```

This is separate from the scan-processing `Color` toggle.

The image-processing stage can produce the preferred Whitepaper-style appearance while the PDF export remains capable of representing the resulting page correctly.

---

# Pages Per Sheet

```text
Pages per sheet: 1
```

Each scanned page becomes one PDF page.

This is important for later operations such as:

- page removal,
- page reordering,
- splitting,
- merging,
- signing,
- OCR review.

---

# Margin

```text
Margin: 10
```

The configured PDF margin is 10.

---

# OCR Configuration

OCR is enabled.

```text
OCR: Enabled
Language: English
Quality: Best
Transparent OCR text: Enabled
```

OCR is performed by OSS Document Scanner before the document reaches Stirling.

That means many incoming scanned PDFs are already searchable when they arrive in the Unraid archive.

---

# Transparent OCR Text

Transparent OCR text is enabled in the PDF output.

Conceptually, the PDF contains:

```text
Visible scanned page image
          +
Invisible searchable text layer
```

This allows the document to retain its scanned appearance while supporting:

- text search,
- text selection,
- indexing,
- some extraction workflows.

---

# OCR Quality

```text
Quality: Best
```

The workflow favors document quality over minimizing processing time or file size.

The scanner is being used primarily for business documents where readability and OCR quality are more important than producing the smallest possible PDF.

---

# OCR Language

```text
Language: English
```

English is the default OCR language for this deployment.

---

# Password Protection

```text
PDF password: Blank
```

The scanner does not password-protect generated PDFs.

Access control is handled by the systems storing and transporting the documents rather than by assigning a separate password to every PDF.

---

# Why OCR Happens on the Phone

Stirling PDF also supports OCR, but automatic OCR is not applied to every incoming document.

OSS Document Scanner already performs OCR as part of the scanning workflow.

Therefore:

```text
Scanner
   ↓
OCR once
   ↓
Archive original generated PDF
```

is preferable to:

```text
Scanner
   ↓
PDF
   ↓
Archive
   ↓
Automatically OCR again
   ↓
Rewrite PDF
```

Stirling remains available when OCR needs to be repeated or corrected for a particular document.

---

# Why the Scanner Does Not Connect Directly to Unraid

A direct phone-to-Unraid architecture could use technologies such as:

```text
SMB
SFTP
VPN
WebDAV
Custom upload service
```

This design deliberately avoids them for scanner intake.

Instead:

```text
Phone
   ↓
Google Drive
   ↓
Outbound rclone pull
   ↓
Unraid
```

Advantages include:

- scanning works away from the office;
- no inbound Unraid service is required;
- no SMB credentials are stored in the scanner;
- no VPN connection is required just to scan a document;
- the scanner remains independent of the local network;
- the same transport mechanism works on-site or remotely.

---

# rclone Retrieval

The matching Unraid script is:

```bash
#!/bin/bash

rclone copy \
  "gdrive:OSS Document Scanner" \
  "/mnt/user/Documents/OSS Document Scanner" \
  --config "/boot/config/rclone/rclone.conf" \
  --log-level INFO
```

The job is scheduled every minute:

```cron
* * * * *
```

This makes office scanning feel nearly immediate.

---

# Why rclone Uses `copy`

The scanner workflow uses:

```bash
rclone copy
```

rather than:

```bash
rclone sync
```

This ensures that deleting a scanned document from Google Drive does not remove the archived Unraid copy.

```text
Scan created
    ↓
Uploaded to Drive
    ↓
Copied to Unraid
    ↓
Drive copy later removed
    ↓
Unraid copy remains
```

---

# Verification Test

A complete scanner test is:

1. Open OSS Document Scanner.
2. Scan a document.
3. Add additional pages if required.
4. Save the document.
5. Verify the PDF is generated.
6. Verify the PDF appears in:

```text
Google Drive
└── OSS Document Scanner
```

7. Wait up to approximately one minute.
8. Verify the PDF appears on Unraid:

```text
/mnt/user/Documents/OSS Document Scanner
```

9. Verify the document appears through the Windows `Documents` SMB share.
10. Open the PDF.
11. Confirm OCR text is searchable.
12. Process the PDF in Stirling if additional manipulation is required.

---

# Troubleshooting

## PDF Exists on Phone but Not Google Drive

Check:

```text
Google account authentication
Google Drive PDF Sync
Auto Sync
Network connectivity
Remote folder
```

The problem is upstream of Unraid.

Do not troubleshoot rclone until the PDF appears in Google Drive.

---

## PDF Exists in Google Drive but Not Unraid

Verify that rclone can see it:

```bash
rclone ls \
  "gdrive:OSS Document Scanner" \
  --config "/boot/config/rclone/rclone.conf"
```

If the file is listed, test the copy manually:

```bash
rclone copy \
  "gdrive:OSS Document Scanner" \
  "/mnt/user/Documents/OSS Document Scanner" \
  --config "/boot/config/rclone/rclone.conf" \
  -P
```

---

## Manual Copy Works but Automatic Copy Does Not

Verify the Unraid User Scripts schedule:

```cron
* * * * *
```

and confirm the script references:

```text
/boot/config/rclone/rclone.conf
```

---

## PDF Exists on Unraid but Not Windows

The scanner, Google Drive, and rclone portions are already working.

Troubleshoot:

```text
Unraid SMB share
Windows credentials
Mapped drive
Network connectivity
```

---

## OCR Is Poor

Before rerunning OCR in Stirling, review the original scan.

Check:

```text
Page detection
Camera focus
Lighting
Page alignment
Whitepaper processing
OCR language
```

A clean source image usually produces better OCR than attempting to repair a poor capture later.

---

# Configuration Summary

```text
OSS Document Scanner

Image Processing
----------------
Whitepaper: On
Enhance: Off
Color: Off
Brightness: 0
Contrast: 1.00
Filter: Normal

Google Drive PDF Sync
---------------------
Enabled: On
Auto Sync: On
Delete after sync: Off
Remote folder: OSS Document Scanner

Naming
------
Use document name when possible: On
Fallback filename: timestamp
Use document folder as subfolder: Off

PDF
---
Orientation: Portrait
Size / scaling: Full
Output: Color
Pages per sheet: 1
Margin: 10
Transparent OCR text: Enabled
Password: None

OCR
---
Enabled: On
Quality: Best
Language: English

Unraid Destination
------------------
/mnt/user/Documents/OSS Document Scanner

rclone Source
-------------
gdrive:OSS Document Scanner

Transfer Method
---------------
rclone copy

Polling
-------
Every 1 minute
```

---

# Role in the Overall Architecture

OSS Document Scanner is intentionally a specialized endpoint.

Its responsibility ends when a properly generated PDF reaches Google Drive.

```text
Capture
  ↓
Process
  ↓
OCR
  ↓
Generate PDF
  ↓
Upload
  ↓
Done
```

Storage, archival retention, workstation access, and later PDF manipulation are handled by other components in the system.

That separation is what allows the scanner to remain simple while still participating in a larger self-hosted document workflow.
