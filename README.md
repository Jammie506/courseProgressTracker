<table>
	<tr>
		<td width="72" valign="middle">
			<img src="assets/images/sortedLogo.png" alt="Sorted logo" width="64" height="64" />
		</td>
		<td valign="middle">
			<h1>Sorted</h1>
		</td>
	</tr>
</table>

Beta desktop app (Electron) for tracking progress through courses, modules, tasks, and planner schedules.

## Status

`v2.0.0-beta`  
March 2026  
Not for general distribution.

This build is for internal testing and feedback.

## Overview

Sorted lets learners:

- Create and manage multiple courses
- Add, edit, and delete modules
- Add, edit, and delete tasks
- Mark modules and tasks as complete
- Track weighted progress across modules and tasks
- Plan weekly classes with editable timetable templates
- Color-link class names with reusable class tags
- Track important dates and auto-surface due dates from coursework
- Edit activities/tasks after creation (name, weight, due date)
- Save progress locally between sessions

Sample course data is included on first launch, and planner defaults are preloaded.

## What's New Since v1.0.1-beta

- App renamed to Sorted (window title, build product name, Windows executable/shortcuts)
- New planner improvements:
	- Group preset selection with reset-to-defaults option
	- Fixed-size timetable cells with wrapped class text
	- Centered, bold class cell text for readability
	- Class tag auto-matching supports partial names (for example, "IT Skills - G4" -> "IT Skills")
- Course management improvements:
	- In-place edit flow for activities and tasks using existing modals
	- Editable name, weight, and due date after creation
	- Due dates feed into planner important dates automatically
- Data tools improvements:
	- Backup export and restore flows retained and synced with planner reload
- Packaging updates:
	- Windows app icon switched to `sortedLogo.ico`
	- Windows outputs now use stable filenames:
		- Installer: `Sorted-Setup.exe`
		- Portable: `Sorted.exe`

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

Current artifact names:

- `Sorted-Setup.exe`
- `Sorted.exe`

## Known Limitations

- No cloud sync
- No macOS or Linux builds in this beta
- No user authentication or multi-user support
- UI/design still in progress
- No auto-update support

## Testing Focus

If you are testing this beta, please focus on:

- Progress calculation accuracy
- Add/edit/delete behavior for courses, modules, and tasks
- Planner behavior (presets, tag matching, reset defaults, important dates)
- Data persistence after app restart
- Crashes, errors, or unexpected behavior

## License

See `LICENSE` for license details.

---

Pre-release build. Not for general distribution.  
© 2026 Jamie McCarthy
