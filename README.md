# Vocabulary Quest

An offline-first, premium-styled English vocabulary adventure for Android.

## What is included

- Original fox explorer mascot **Lumi**, welcoming onboarding and a colorful quest path
- 216 PDF-derived adventures across A1, A2, B1, B2, C1 and C2
- 5,400 numbered entries (900 per level), with Arabic meanings and example snippets
- 15 additional themed bonus worlds (150 English-definition words)
- 5,550 total lesson entries, offline with no network connection
- Dedicated level selector, flip-card lessons with pronunciation, and examples
- Multiple-choice challenges, spelling challenges and matching pairs
- Smart review scheduling, favorites, adjustable daily goals, streaks, XP and badges
- Daily treasure missions, claimable gems, a Boss Battle and purchasable in-game hints
- Weekly activity charts, level progress, sound effects and motion controls
- Local progress saved on the device; no account or internet required
- Responsive web preview using the same assets as the native Android app

> **Curriculum status:** All six supplied PDFs together cover exactly 5,400
> numbered word entries. The first PDF is labeled **PRE-A1** in its own pages;
> it is presented as the A1 foundation in the app. The bonus 150 words are
> separate and do not count toward the 5,400-entry target. Some terms recur.
> PDF word lists and short example snippets were migrated; original full PDFs,
> stories and illustrated pages are not embedded. The app's fox artwork is new.

## Preview locally

Open `app/src/main/assets/index.html` in a modern desktop browser, or serve
`app/src/main/assets` with any static HTTP server. No dependencies are needed.

## Build the Android app

Open the repository in **Android Studio**. Install Android SDK 35 if prompted,
allow Gradle to sync, and choose **Run** on an Android device or emulator.

- Application ID: `com.vocabularyquest.app`
- Minimum Android version: Android 7.0 (API 24)
- Target Android SDK: 35
- Uses Android WebView and native Text-to-Speech; no network permissions

The Android host loads bundled local assets. Data stays in WebView's local
storage. Browser preview uses the browser's local storage instead.
An existing v1 learner's stored words, favorites, scores and XP are retained.

## Development checks

With Node.js 20 or later:

```sh
npm test
```

The tests validate the full 5,400-entry curriculum, Arabic text, IDs,
challenge options, progress migration, daily missions, review scheduling and
UI navigation. The app requires no npm packages at runtime.

## Extending the word library

Edit `app/src/main/assets/data.js` to adjust the original bonus lesson library.
The A1–C2 curriculum lives in the six JS files in `app/src/main/assets/curriculum`.
To regenerate it from the source PDF attachments, run:

```sh
python3 scripts/extract_vocab_pdfs.py --input-dir ../upload --out-dir app/src/main/assets/curriculum
```

The extraction script checks all 36 sets and 900 entries per level. It never
commits the source PDFs. Keep vocabulary IDs stable to retain existing learner
progress.

## Privacy

The app collects no personal data, does not run analytics, and does not contact
an external server. The Android shell only allows its bundled `file://` content.
