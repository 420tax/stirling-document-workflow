# 🧰 Replacing My Adobe Acrobat Pro + Adobe Scan Workflow

> A self-hosted document workflow built around Stirling PDF, OSS Document Scanner, Unraid, rclone, Gmail, Google Apps Script, and Google Drive.

**The goal was never to recreate Adobe Acrobat Pro feature-for-feature.  
The goal was to make Acrobat unnecessary for the PDF work I actually do.**

---

## At a Glance

| Adobe-centered workflow | Replacement |
|---|---|
| 📱 Adobe Scan | OSS Document Scanner |
| 📄 Everyday Acrobat PDF tools | Stirling PDF |
| 📥 Email attachment intake | Gmail + Google Apps Script |
| ☁️ Document transport | Google Drive |
| 🔄 Automated retrieval | rclone |
| 🗄️ Local document archive | Unraid |
| 💻 Workstation access | SMB |
| 📁 Finished document storage | Existing client/business storage |

> [!NOTE]
> This is not a feature-for-feature clone of Adobe Acrobat Pro, nor is every component in the stack open source. Gmail and Google Drive remain proprietary services.
>
> What this project replaces is the **Adobe-centered document workflow** I was actually using.

---

# 💡 Where This Started

This project began after I read Tashreef Shareef's August 2026 MakeUseOf article:

> **“55+ PDF tools fit inside this Docker container — my files never leave the house”**

[Read the MakeUseOf article](https://www.makeuseof.com/stirling-pdf-docker-self-hosted/)

The article introduced me to **Stirling PDF**, a self-hosted PDF toolkit that packages dozens of common PDF functions into a Docker container.

That caught my attention immediately.

I work with PDFs constantly. They arrive as email attachments, tax forms, reports, scans, statements, signed documents, notices, and supporting schedules. Adobe Acrobat Pro had gradually become infrastructure rather than just an application.

The MakeUseOf article posed a simple question:

**How much of that work could be done locally instead?**

So I installed Stirling PDF on my Unraid server.

That part was easy.

And then the project became much more interesting.

---

# 🎯 The Real Problem Wasn't Acrobat

Installing Stirling solved the **PDF manipulation** problem.

It did not solve the **document workflow** problem.

Acrobat was only one component of the way documents moved through my office.

Adobe Scan handled paper documents.

Email attachments arrived through Gmail.

Documents moved between phones, cloud services, Windows, and local storage.

Acrobat handled the final PDF manipulation.

So simply replacing:

```text
Adobe Acrobat Pro
        ↓
Stirling PDF
```

wasn't enough.

The real question became:

> **Can I replace the practical Adobe Scan + Acrobat workflow without making document handling less convenient?**

That changed the scope of the project.

---

# 🧩 What Actually Needed to Be Replaced

When I reduced the Adobe workflow to the functions I actually use, the list was much more manageable.

I needed to be able to:

- scan paper documents from a phone;
- perform OCR on scans;
- merge PDFs;
- split PDFs;
- remove pages;
- reorder pages;
- sign documents;
- redact information;
- compress PDFs;
- convert PDFs;
- extract information from PDFs;
- move email attachments into the working document system quickly;
- access those documents from Windows;
- retain an independent local copy of source documents.

That is not the same thing as reproducing every feature in Acrobat Pro.

And that distinction became the foundation of the project.

> [!IMPORTANT]
> The goal is not **“build another Acrobat.”**
>
> The goal is **“replace the document operations for which I was actually depending on Acrobat.”**

---

# 🔄 The Resulting Stack

Instead of finding one application to replace Adobe, I ended up using several tools with narrow responsibilities.

| Component | Responsibility |
|---|---|
| **OSS Document Scanner** | Capture paper documents and perform OCR |
| **Gmail** | Receive emailed documents |
| **Google Apps Script** | Extract PDF attachments and manage the Gmail workflow |
| **Google Drive** | Transport documents from external sources |
| **rclone** | Pull new documents into the local environment |
| **Unraid** | Maintain the persistent local archive |
| **SMB** | Present the archive to Windows |
| **Stirling PDF** | Manipulate PDFs on demand |
| **Existing client/business storage** | Store the finished document |

The architecture looks roughly like this:

```text
                    ┌───────────────────────┐
                    │         Gmail         │
                    └───────────┬───────────┘
                                │
                     Gmail Workspace Add-on
                                │
                       Google Apps Script
                                │
                                ▼
                    ┌───────────────────────┐
                    │     Google Drive      │
                    │   Email PDF Intake    │
                    └───────────┬───────────┘
                                │
                                │
                                │
┌───────────────────────┐       │
│ OSS Document Scanner  │       │
│  Scan + OCR + PDF     │       │
└───────────┬───────────┘       │
            │                   │
            ▼                   │
┌───────────────────────┐       │
│     Google Drive      │       │
│ OSS Document Scanner  │       │
└───────────┬───────────┘       │
            │                   │
            └─────────┬─────────┘
                      │
                rclone copy
                 read-only
                      │
                      ▼
               ┌─────────────┐
               │   Unraid    │
               │  Documents  │
               └──────┬──────┘
                      │
                     SMB
                      │
                      ▼
               ┌─────────────┐
               │   Windows   │
               └──────┬──────┘
                      │
                      ▼
               ┌─────────────┐
               │ Stirling PDF│
               └──────┬──────┘
                      │
                      ▼
             Finished Document
```

The important architectural choice is that **no single application owns the entire workflow**.

---

# 📄 Replacing Everyday Acrobat Tasks with Stirling PDF

Stirling PDF became the PDF workbench.

It runs as a Docker container on Unraid and is accessed through a browser on the internal network.

For the operations I perform regularly, it covers a surprising amount of Acrobat territory.

### Functions I can now perform in Stirling include:

- merge PDFs;
- split PDFs;
- remove pages;
- reorder pages;
- rotate pages;
- OCR documents;
- compress PDFs;
- redact text;
- sign documents;
- add watermarks;
- modify metadata;
- convert between formats;
- extract content;
- manipulate page structure.

One feature I particularly appreciate is that Stirling allows many common PDF operations to be chained together rather than requiring a separate upload/download cycle for every operation.

That matters in real-world document work.

A typical task might be:

```text
Open PDF
   ↓
Remove unnecessary pages
   ↓
Merge supporting pages
   ↓
Reorder document
   ↓
Sign
   ↓
Save finished PDF
```

That workflow no longer requires Acrobat.

---

# 🛠️ Stirling Is a Toolbench, Not a Repository

This became one of the most important design decisions in the entire project.

I deliberately did **not** make Stirling responsible for storing incoming documents.

The authoritative source copies live on Unraid:

```text
/mnt/user/Documents/
├── Email PDF Intake
└── OSS Document Scanner
```

Stirling is downstream from that archive.

```text
Source Document
      ↓
Local Archive
      ↓
Stirling PDF
      ↓
Processed Document
```

That separation has several advantages.

If Stirling breaks, the documents are still there.

If Stirling is replaced someday, the documents are still there.

If I upgrade or rebuild the container, the documents are still there.

And the source PDF does not need to be automatically rewritten simply because it entered the system.

> [!NOTE]
> Stirling is intentionally treated as a **workbench**, not as a document-management system.

---

# 📱 Replacing Adobe Scan

Once Stirling was working, Adobe Scan became the next obvious dependency.

For that role I chose **OSS Document Scanner**.

The application handles:

```text
Camera capture
     ↓
Page detection
     ↓
Image processing
     ↓
OCR
     ↓
PDF generation
     ↓
Google Drive upload
```

The configuration I settled on favors clean business documents rather than photographic reproduction.

### Image processing

| Setting | Configuration |
|---|---|
| Whitepaper | On |
| Enhance | Off |
| Color processing | Off |
| Brightness | 0 |
| Contrast | 1.00 |
| Filter | Normal |

### OCR

| Setting | Configuration |
|---|---|
| OCR | Enabled |
| Language | English |
| Quality | Best |
| Transparent OCR text | Enabled |

### PDF output

| Setting | Configuration |
|---|---|
| Orientation | Portrait |
| Scaling | Full |
| PDF output | Color |
| Pages per sheet | 1 |
| Margin | 10 |
| Password | None |

The generated PDF includes a searchable OCR text layer.

That means a paper document can become a searchable PDF **before it ever reaches Stirling**.

---

# 📲 Why the Scanner Does Not Connect Directly to Unraid

My first instinct was to ask whether OSS Document Scanner could write directly to the Unraid SMB share.

That would have created a different set of problems.

Direct SMB would require:

- local-network connectivity;
- stored SMB credentials;
- potentially VPN access while away from the office;
- tighter coupling between the phone and the server.

Instead, the phone uploads to Google Drive.

```text
Phone
  ↓
Google Drive
  ↓
rclone
  ↓
Unraid
```

This has an important practical advantage:

**Scanning works the same way whether I am sitting in the office or somewhere else.**

The phone never needs direct access to Unraid.

---

# 📥 Replacing the “Download Email Attachment” Routine

Email attachments turned out to be one of the more interesting parts of the project.

The normal workflow for a PDF arriving through email is tedious:

```text
Open email
   ↓
Download attachment
   ↓
Find Downloads folder
   ↓
Move PDF
   ↓
Find destination
   ↓
Open PDF
```

I wanted that reduced to essentially one action.

So I built a small Gmail Workspace add-on using Google Apps Script.

When I open an email containing a PDF, the add-on presents:

```text
Email PDF Intake
```

with a button:

```text
Send PDFs to Intake
```

Pressing that button:

1. reads the PDF attachment;
2. writes it to the `Email PDF Intake` Google Drive folder;
3. records the attachment to prevent duplicate processing;
4. applies the Gmail label `PDF Processed`;
5. removes `PDF Intake` if that fallback label was present.

The message is only marked processed **after the PDF has successfully been written to Drive**.

---

# ⏱️ A Fallback Intake Path

There is also a second Gmail workflow.

If I apply:

```text
PDF Intake
```

to a Gmail thread, an Apps Script trigger checks for that label every minute.

It then:

```text
Find labeled thread
        ↓
Find PDF attachments
        ↓
Write PDF to Drive
        ↓
Remove PDF Intake
        ↓
Apply PDF Processed
```

So the system supports both:

- **immediate one-click intake**, and
- **label-driven asynchronous intake**.

---

# 🔁 Duplicate Protection

Both Gmail workflows share the same deduplication mechanism.

Each successfully processed attachment creates a Script Property using:

```text
pdf:<MESSAGE_ID>:<ATTACHMENT_ID>
```

Before copying an attachment, the workflow checks whether that key already exists.

That prevents duplicate PDFs when:

- I click the Gmail button twice;
- the polling system sees the same thread repeatedly;
- a document happens to encounter both workflows.

It is a small implementation detail, but it makes the intake system substantially more reliable.

---

# ☁️ Why Google Drive Is Still in the Architecture

At first glance, using Google Drive in a self-hosted document project may seem contradictory.

It isn't.

Google Drive is deliberately treated as a **transport mechanism**, not the archive and not the PDF-processing environment.

For Gmail attachments, the files are already inside Google's infrastructure.

For scanner documents, Drive solves the remote-ingress problem without requiring me to expose an upload service on the local network.

The trust flow looks like this:

```text
Internet-facing application
           ↓
      Google Drive
           ↓
      outbound pull
           ↓
         Unraid
```

Unraid does not accept inbound document uploads from the Internet.

Instead, it initiates the connection and retrieves new documents.

---

# 🔐 “My Files Never Leave the House” — With an Important Qualification

The MakeUseOf article that inspired this project emphasizes the advantage of keeping PDF processing local.

That remains one of Stirling's biggest attractions.

But my architecture cannot make the literal claim that every document **never leaves the house**.

Some documents begin in Gmail.

Scans intentionally pass through Google Drive.

What I can say is more precise:

> **The PDF manipulation layer does not require me to upload working documents to a third-party PDF-processing service.**

That distinction matters.

I am not uploading tax documents, financial statements, contracts, IDs, or other sensitive PDFs to whichever online PDF utility happens to rank first in a search engine.

Stirling processes them on infrastructure I control.

Cloud services are used intentionally and for specific transport functions.

---

# 🔄 Pulling Documents into Unraid with rclone

Unraid retrieves both Google Drive intake folders using `rclone`.

The remote is configured with:

```text
drive.readonly
```

That is deliberate.

The server needs permission to:

```text
Read document
      ↓
Copy document locally
```

It does **not** need permission to:

```text
Modify Drive
Delete Drive files
Rename Drive files
```

This follows a simple least-privilege principle.

---

# 🗄️ Why I Use `rclone copy`, Not `rclone sync`

This distinction is critical.

The transfer jobs use:

```bash
rclone copy
```

rather than:

```bash
rclone sync
```

A synchronization job attempts to make two locations match.

That is not what I want from an archive.

The desired behavior is:

```text
PDF appears in Google Drive
          ↓
PDF copied to Unraid
          ↓
PDF later deleted from Drive
          ↓
Unraid copy remains
```

In other words:

**Cloud deletion should not imply archive deletion.**

Using `copy` instead of `sync` makes the local archive independent from later cleanup in Google Drive.

---

# ⚡ One-Minute Intake

Both rclone jobs run every minute.

```cron
* * * * *
```

That may sound aggressive, but most runs simply compare the remote and local state, discover there is nothing new, and exit.

The result is that the cloud transport layer largely disappears during normal use.

### Email

```text
Open Gmail
    ↓
Send PDFs to Intake
    ↓
Wait briefly
    ↓
PDF appears on Windows
```

### Scanner

```text
Scan document
    ↓
Save
    ↓
Wait briefly
    ↓
PDF appears on Windows
```

I do not need to log into Unraid and manually trigger a transfer.

That was important.

A technically elegant system that adds friction to everyday office work will eventually stop being used.

---

# 💻 Windows Still Feels Like Windows

The local archive is exposed through the existing Unraid `Documents` SMB share.

From the Windows workstation, the user experience is simply:

```text
File Explorer
   ↓
Mapped Documents drive
   ↓
Email PDF Intake
or
OSS Document Scanner
```

The infrastructure behind that drive can involve Docker, rclone, Apps Script, Google APIs, and Unraid.

The person actually working with the document does not need to care.

That is the desired result.

---

# 🔒 Security Model

The project is not built around the claim that every component is perfectly private.

It is built around **explicit trust boundaries**.

### Stirling PDF

```text
Internal network only
Authentication enabled
No public Internet exposure
```

### Apps Script

```text
Gmail permissions required for attachment access and labels
Drive access restricted with drive.file
```

### rclone

```text
Google Drive access: read-only
```

### Unraid

```text
Persistent local archive
No inbound Internet document upload service
```

### Google Drive

```text
Transport layer
Not authoritative archive
```

> [!WARNING]
> The production `rclone.conf` contains OAuth credential material and should never be committed to GitHub.

---

# 🧠 One Unexpected Apps Script Lesson

During development I encountered an attachment-handling issue that is worth documenting.

Coming from the Gmail REST API representation, my first attempt was to decode the attachment with:

```javascript
Utilities.base64DecodeWebSafe(attachmentData.data);
```

That resulted in:

```text
Exception: Could not decode string.
```

Trying to manipulate the value as an ordinary string failed as well.

With the Apps Script Advanced Gmail service used in this project, the working implementation turned out to be:

```javascript
const bytes = attachmentData.data;
```

followed by:

```javascript
const blob = Utilities.newBlob(
  bytes,
  'application/pdf',
  attachment.filename
);
```

It was a useful reminder that the representation returned by an Apps Script advanced service does not always behave exactly like the raw REST response one expects from reading the API documentation.

---

# ⚖️ This Is Not Acrobat Pro

There are still areas where Acrobat Pro is substantially more mature.

That should be stated plainly.

| Capability | This workflow |
|---|---:|
| Mobile scanning | ✅ Replaced |
| Searchable scan OCR | ✅ Replaced |
| Merge PDFs | ✅ Replaced |
| Split PDFs | ✅ Replaced |
| Remove pages | ✅ Replaced |
| Reorder pages | ✅ Replaced |
| Everyday signing | ✅ Replaced |
| Compression | ✅ Replaced |
| Redaction | ✅ Replaced for appropriate PDFs |
| Metadata operations | ✅ Replaced |
| PDF conversion | ✅ Largely replaced |
| Existing-document OCR | ✅ Replaced |
| Advanced PDF text editing | ⚠️ Limited |
| Complex Acrobat forms workflows | ⚠️ Not a project goal |
| Enterprise collaboration | ❌ Not replaced |
| Adobe-specific integrations | ❌ Not replaced |
| Professional print/preflight workflows | ❌ Not replaced |

Stirling's PDF text editor, in particular, is still an evolving area rather than a complete replacement for Acrobat's mature text-editing capabilities.

And redaction of image-only scans still requires OCR first.

Those limitations matter.

But they do not materially affect the workflow I was trying to replace.

---

# 🆚 Adobe-Centered vs. Modular Workflow

The conceptual shift looks like this:

```text
ADOBE-CENTERED WORKFLOW

Adobe Scan
     │
     ▼
Adobe ecosystem
     │
     ▼
Acrobat Pro
     │
     ▼
Finished document
```

versus:

```text
MODULAR WORKFLOW

OSS Document Scanner ──┐
                       │
Gmail + Apps Script ───┼──► Google Drive
                       │         │
                       └─────────┘
                                 │
                              rclone
                                 │
                                 ▼
                              Unraid
                                 │
                                SMB
                                 │
                                 ▼
                           Stirling PDF
                                 │
                                 ▼
                         Finished document
```

The second design is more complicated internally.

But each component is simpler.

And each component can be replaced independently.

---

# 🧱 A More Unix-Like Approach

The project ultimately became an exercise in decomposition.

Instead of asking:

> **What application replaces Acrobat?**

I started asking:

> **What is each application actually doing?**

The answers were much easier to solve.

```text
Scanning        → OSS Document Scanner
Email intake    → Gmail + Apps Script
Transport       → Google Drive
Retrieval       → rclone
Archival        → Unraid
Workstation I/O → SMB
PDF operations  → Stirling
```

That is closer to the traditional Unix philosophy:

**small tools, narrow responsibilities, predictable interfaces.**

Stirling does not need to know how the PDF arrived.

OSS Document Scanner does not need to know where the permanent archive lives.

rclone does not need to understand PDFs.

Unraid does not need to process them.

Each component does one job.

---

# 🛡️ Failure Becomes Easier to Understand

That modularity also makes troubleshooting much easier.

If a scanned PDF never reaches Google Drive:

```text
Problem: scanner side
```

If the PDF is in Drive but not on Unraid:

```text
Problem: rclone / scheduling
```

If the file exists on Unraid but not Windows:

```text
Problem: SMB
```

If the file is available locally but cannot be manipulated:

```text
Problem: Stirling
```

A failure in Stirling does not stop document intake.

A failure in Gmail intake does not affect scanning.

A failure in Google Drive does not make already archived local documents disappear.

That separation has operational value beyond the original goal of replacing Acrobat.

---

# 📁 Source Documents Stay Independent

Another benefit of this design is that the original intake PDF exists independently of the application used to manipulate it.

I do not automatically:

- OCR every incoming PDF again;
- compress every PDF;
- rewrite every PDF;
- convert every PDF;
- pass every document through Stirling.

Instead:

```text
Document arrives
      ↓
Archive source PDF
      ↓
Process only if needed
```

That is exactly how I want a document system to behave.

---

# 🚧 What I Am Not Trying to Build

This project is **not** intended to become:

- a full document-management system;
- an enterprise collaboration platform;
- an Acrobat clone;
- an electronic-signature platform;
- a Dropbox replacement;
- a Google Drive replacement;
- an all-in-one office suite.

That restraint matters.

Trying to force every document-related function into Stirling would make the architecture worse, not better.

---

# ✅ What the Project Replaces for Me

For my actual daily workflow, the following Adobe-dependent tasks no longer require Acrobat or Adobe Scan:

### Paper document intake

```text
OSS Document Scanner
→ OCR
→ Drive
→ Unraid
```

### Email PDF intake

```text
Gmail
→ Send PDFs to Intake
→ Drive
→ Unraid
```

### PDF manipulation

```text
Unraid / SMB
→ Stirling
→ Finished PDF
```

### Typical document operations

```text
Merge
Split
Remove pages
Reorder
OCR
Compress
Sign
Redact
Convert
Extract
```

For those operations, Acrobat has moved from **required infrastructure** to **optional application**.

That was the objective.

---

# 🏁 The Result

The MakeUseOf article introduced me to Stirling PDF as a self-hosted alternative to everyday online and Acrobat-based PDF tools.

What began as:

```text
Install Stirling PDF
```

turned into:

```text
Replace the document workflow surrounding Acrobat
```

The final system is not entirely open source.

It is not entirely cloud-free.

It is not a feature-for-feature recreation of Adobe Acrobat Pro.

But it does something more useful for me:

**It moves the core document workflow onto systems and tools whose roles I understand and control.**

The scanner scans.

Gmail receives.

Drive transports.

rclone retrieves.

Unraid archives.

SMB exposes.

Stirling manipulates.

And none of those components has to become the center of the entire document system.

---

> **I didn't replace Acrobat with one application.**
>
> **I replaced an Adobe-centered workflow with a collection of smaller tools, each doing one job.**

That turned out to be the more interesting project.

---

# 📚 Project Documentation

Additional implementation details are available in this repository:

- [`README.md`](README.md) — overall project documentation
- [`docs/architecture.md`](docs/architecture.md) — architecture and trust boundaries
- [`docs/oss-document-scanner.md`](docs/oss-document-scanner.md) — OSS Document Scanner configuration
- [`docs/recovery.md`](docs/recovery.md) — recovery and troubleshooting guide
- [`apps-script/Code.gs`](apps-script/Code.gs) — Gmail intake Apps Script
- [`apps-script/appsscript.json`](apps-script/appsscript.json) — Apps Script manifest
- [`unraid/pull-email-pdf-intake.sh`](unraid/pull-email-pdf-intake.sh) — Gmail intake rclone job
- [`unraid/pull-oss-scanner.sh`](unraid/pull-oss-scanner.sh) — scanner rclone job

---

## Inspiration

This project was initially inspired by:

**Tashreef Shareef, “55+ PDF tools fit inside this Docker container — my files never leave the house,” MakeUseOf, August 30, 2026.**

https://www.makeuseof.com/stirling-pdf-docker-self-hosted/

Stirling PDF:

https://github.com/Stirling-Tools/Stirling-PDF
