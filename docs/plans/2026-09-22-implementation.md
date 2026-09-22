# Daylight implementation plan

Approved scope: implement the local-first diary, insights, and working care tools; deploy on existing GitHub Pages URL. AI and cloud synchronization require external credentials and remain explicitly unavailable.

1. Data layer: create typed entries/sessions, isolated IndexedDB stores, strict backup validation, real daily statistics and rule recommendations. Test date boundaries, missing days, daily means and import errors before implementation.
2. Care: implement actual synthesized audio, breathing/meditation/movement sessions, feedback and resource cleanup. Generated audio is labeled accurately and has no external license dependency.
3. Interface: React/TypeScript responsive sidebar, today dashboard, diary editor/calendar, insights, settings and demo switch. Surface persistence errors; preserve drafts; require confirmation for deletion/import.
4. Verification: domain unit tests, production build, Playwright diary-save-reload-edit-delete, demo isolation, backup validation, navigation, audio and mobile overflow.
5. Release: publish only built files to gh-pages or Actions artifacts, update existing Pages configuration, verify online content and asset responses. Keep main as source and never upload user data or credentials.

Files are split between data layer, care components and main application to avoid overlapping edits. Independent final review follows implementation.
