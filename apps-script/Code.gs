function processPdfIntake() {
  const INTAKE_LABEL = 'PDF Intake';
  const PROCESSED_LABEL = 'PDF Processed';
  const DRIVE_FOLDER = 'Email PDF Intake';

  const props = PropertiesService.getScriptProperties();

  // ----- Gmail label IDs -----
  const labels = Gmail.Users.Labels.list('me').labels || [];

  const intakeLabel = labels.find(l => l.name === INTAKE_LABEL);
  const processedLabel = labels.find(l => l.name === PROCESSED_LABEL);

  if (!intakeLabel) {
    throw new Error(`Missing Gmail label: ${INTAKE_LABEL}`);
  }

  if (!processedLabel) {
    throw new Error(`Missing Gmail label: ${PROCESSED_LABEL}`);
  }

  // ----- Drive folder -----
  let folderId = props.getProperty('EMAIL_PDF_INTAKE_FOLDER_ID');

  if (!folderId) {
    const folder = Drive.Files.create({
      name: DRIVE_FOLDER,
      mimeType: 'application/vnd.google-apps.folder'
    });

    folderId = folder.id;
    props.setProperty('EMAIL_PDF_INTAKE_FOLDER_ID', folderId);
  }

  // ----- Find Gmail threads carrying PDF Intake -----
  const result = Gmail.Users.Threads.list('me', {
    labelIds: [intakeLabel.id]
  });

  const threads = result.threads || [];
  let savedCount = 0;

  for (const threadInfo of threads) {
    const thread = Gmail.Users.Threads.get('me', threadInfo.id);

    let foundPdf = false;

    for (const message of thread.messages || []) {
      const attachments = findPdfAttachments(message.payload);

      for (const attachment of attachments) {
        foundPdf = true;

        const uniqueKey =
          `pdf:${message.id}:${attachment.attachmentId}`;

        if (props.getProperty(uniqueKey)) {
          continue;
        }

        const attachmentData =
          Gmail.Users.Messages.Attachments.get(
            'me',
            message.id,
            attachment.attachmentId
          );

        const bytes = attachmentData.data;

        const blob =
          Utilities.newBlob(
            bytes,
            'application/pdf',
            attachment.filename
          );

        Drive.Files.create(
          {
            name: attachment.filename,
            parents: [folderId]
          },
          blob
        );

        props.setProperty(
          uniqueKey,
          new Date().toISOString()
        );

        savedCount++;
      }
    }

    if (foundPdf) {
      Gmail.Users.Threads.modify(
        {
          addLabelIds: [processedLabel.id],
          removeLabelIds: [intakeLabel.id]
        },
        'me',
        thread.id
      );
    }
  }

  console.log(`Saved ${savedCount} PDF attachment(s).`);
}


function findPdfAttachments(part) {
  let results = [];

  if (!part) {
    return results;
  }

  const filename = part.filename || '';
  const mimeType = part.mimeType || '';

  const isPdf =
    mimeType === 'application/pdf' ||
    filename.toLowerCase().endsWith('.pdf');

  if (
    isPdf &&
    filename &&
    part.body &&
    part.body.attachmentId
  ) {
    results.push({
      filename: filename,
      attachmentId: part.body.attachmentId
    });
  }

  for (const child of part.parts || []) {
    results = results.concat(findPdfAttachments(child));
  }

  return results;
}


function onGmailMessageOpen(e) {
  const action = CardService.newAction()
    .setFunctionName('processCurrentMessagePdf')
    .setParameters({
      messageId: e.gmail.messageId,
      threadId: e.gmail.threadId
    });

  const button = CardService.newTextButton()
    .setText('Send PDFs to Intake')
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setOnClickAction(action);

  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('Email PDF Intake')
        .setSubtitle('Send PDF attachments to Drive')
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(button)
    )
    .build();

  return [card];
}


function processCurrentMessagePdf(e) {
  const INTAKE_LABEL = 'PDF Intake';
  const PROCESSED_LABEL = 'PDF Processed';
  const DRIVE_FOLDER = 'Email PDF Intake';

  const props = PropertiesService.getScriptProperties();

  const messageId =
    (e.parameters && e.parameters.messageId) ||
    (e.gmail && e.gmail.messageId);

  const threadId =
    (e.parameters && e.parameters.threadId) ||
    (e.gmail && e.gmail.threadId);

  if (!messageId || !threadId) {
    throw new Error('Missing Gmail message context.');
  }

  // ----- Gmail labels -----
  const labels = Gmail.Users.Labels.list('me').labels || [];

  const intakeLabel =
    labels.find(l => l.name === INTAKE_LABEL);

  const processedLabel =
    labels.find(l => l.name === PROCESSED_LABEL);

  if (!processedLabel) {
    throw new Error(`Missing Gmail label: ${PROCESSED_LABEL}`);
  }

  // ----- Drive folder -----
  let folderId =
    props.getProperty('EMAIL_PDF_INTAKE_FOLDER_ID');

  if (!folderId) {
    const folder = Drive.Files.create({
      name: DRIVE_FOLDER,
      mimeType: 'application/vnd.google-apps.folder'
    });

    folderId = folder.id;

    props.setProperty(
      'EMAIL_PDF_INTAKE_FOLDER_ID',
      folderId
    );
  }

  // ----- Current Gmail message -----
  const message =
    Gmail.Users.Messages.get(
      'me',
      messageId,
      { format: 'full' }
    );

  const attachments =
    findPdfAttachments(message.payload);

  if (attachments.length === 0) {
    return CardService.newActionResponseBuilder()
      .setNotification(
        CardService.newNotification()
          .setText('No PDF attachments found.')
      )
      .build();
  }

  let savedCount = 0;

  for (const attachment of attachments) {
    const uniqueKey =
      `pdf:${messageId}:${attachment.attachmentId}`;

    // Already copied by the polling system or an earlier click.
    if (props.getProperty(uniqueKey)) {
      continue;
    }

    const attachmentData =
      Gmail.Users.Messages.Attachments.get(
        'me',
        messageId,
        attachment.attachmentId
      );

    const bytes = attachmentData.data;

    const blob =
      Utilities.newBlob(
        bytes,
        'application/pdf',
        attachment.filename
      );

    Drive.Files.create(
      {
        name: attachment.filename,
        parents: [folderId]
      },
      blob
    );

    props.setProperty(
      uniqueKey,
      new Date().toISOString()
    );

    savedCount++;
  }

  // Only mark the email/thread processed AFTER the Drive work succeeded.
  const modification = {
    addLabelIds: [processedLabel.id]
  };

  if (intakeLabel) {
    modification.removeLabelIds = [intakeLabel.id];
  }

  Gmail.Users.Threads.modify(
    modification,
    'me',
    threadId
  );

  const messageText =
    savedCount > 0
      ? `Saved ${savedCount} PDF attachment(s) to Intake.`
      : 'PDF attachment(s) already in Intake.';

  return CardService.newActionResponseBuilder()
    .setNotification(
      CardService.newNotification()
        .setText(messageText)
    )
    .setStateChanged(true)
    .build();
}
