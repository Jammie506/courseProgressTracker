# Course Progress Tracker

Beta desktop app (Electron) for tracking progress through courses, modules, and tasks.

## Status

`v1.0.1-beta`  
March 2026  
Not for general distribution.

This build is for internal testing and feedback.

## Overview

Course Progress Tracker lets learners:

- Create and manage multiple courses
- Add, edit, and delete modules
- Add, edit, and delete tasks
- Mark modules and tasks as complete
- Track weighted progress across modules and tasks
- Save progress locally between sessions

Sample course data is included on first launch.

## Tech Stack

- Electron
- JavaScript
- Local file-based data storage

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm

### Install

```bash
npm install
```

### Run (Beta)

```bash
npm start
```

### Development Mode

```bash
npm run dev
```

## Build Commands

```bash
npm run build
```

```bash
npm run build-win
```

```bash
npm run build-win-portable
```

Current beta distribution formats:

- Windows installer (`.exe`) via NSIS
- Windows portable build

## Known Limitations

- Temporary placeholder app icon
- No cloud sync or export features
- No macOS or Linux builds in this beta
- No user authentication or multi-user support
- UI/design still in progress
- No auto-update support

## Testing Focus

If you are testing this beta, please focus on:

- Progress calculation accuracy
- Add/edit/delete behavior for courses, modules, and tasks
- Data persistence after app restart
- Crashes, errors, or unexpected behavior

## License

See `LICENSE` for license details.

---

Pre-release build. Not for general distribution.  
© 2026 Jamie McCarthy
