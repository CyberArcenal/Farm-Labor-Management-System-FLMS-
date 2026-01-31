src/ipc/session/
├── index.ipc.js          (Main handler)
├── create.ipc.js         (Create session)
├── update.ipc.js         (Update session)
├── delete.ipc.js         (Delete session)
├── duplicate.ipc.js      (Duplicate session with bukids/pitaks)
├── close.ipc.js          (Close session - set status to 'closed')
├── archive.ipc.js        (Archive session - set status to 'archived')
└── get/
    ├── all.ipc.js        (Get all sessions)
    ├── by_id.ipc.js      (Get session by ID with relations)
    └── active.ipc.js     (Get only active sessions)