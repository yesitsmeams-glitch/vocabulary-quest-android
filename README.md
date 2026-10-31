# Vocabulary Quest

An offline-first, premium-styled English vocabulary adventure for Android.

## What is included

- Original fox explorer mascot **Lumi**, welcoming onboarding and a colorful quest path
- **v5 Living World Atlas:** six illustrated regions, 36 interactive districts, level progress and themed adventure paths
- **Picture Detective:** eight-round illustrated word-identification game using the original PDF artwork
- **Daily Mystery:** an offline, date-stable three-clue puzzle (word meaning, picture identification and spelling), with one 70-XP treasure per level per day
- **v5.1 HD Artwork Upgrade:** 5,400 transparent-cutout illustrations in 216 high-resolution 1200×1200 WebP atlases, extracted from the original PDF image streams instead of reduced screenshots
- A premium AI-remastered 25-animal picture set showcases the new 3D storybook illustration style
- 216 PDF-derived adventures across A1, A2, B1, B2, C1 and C2
- 5,400 numbered entries (900 per level), with Arabic meanings and complete context examples
- All 216 original reading stories, with 864 open-response comprehension prompts
- 5,400 original word illustrations packed into 216 lazy-loaded WebP atlases
- Retina-ready 240px picture tiles in the new HD atlas pack, displayed larger in flashcards and Picture Detective
- 15 additional themed bonus worlds (150 English-definition words)
- 5,550 total lesson entries, offline with no network connection
- Interactive world and district selectors, illustrated flip-cards and full-page reading activities
- Tap-to-translate words in stories, native read-aloud and slow pronunciation
- Multiple-choice challenges, spelling, listening dictation and matching pairs
- Reading answer saving and first-completion XP rewards (answers are not auto-graded)
- Smart review scheduling, favorites, adjustable daily goals, streaks, XP and badges, including mystery and detective achievements
- Daily treasure missions, claimable gems, a Boss Battle and purchasable in-game hints
- Weekly activity charts, level progress, sound effects and motion controls
- Local progress saved on the device; no account or internet required
- Responsive web preview using the same assets as the native Android app

> **Curriculum status:** All six supplied PDFs together cover exactly 5,400
> numbered word entries. The first PDF is labeled **PRE-A1** in its own pages;
> it is presented as the A1 foundation in the app. The bonus 150 words are
> separate and do not count toward the 5,400-entry target. Some terms recur.
> The source PDFs are not embedded. Their stories, questions and individual word
> illustrations are extracted into compact offline app assets. The workbooks
> are credited to their original designer, Ahmed Maher. Lumi's fox artwork is new.
> Translations and source text should still receive human proofreading before
> any commercial publication.

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

The tests validate the full 5,400-entry curriculum, 216 stories, 864 questions,
illustration atlas files, Arabic meanings, IDs, challenge options, reading
progress migration, daily missions, review scheduling, deterministic daily mysteries,
picture-detective rounds, repeat-reward prevention and UI navigation.
The app requires no npm packages at runtime.

## Extending the word library

Edit `app/src/main/assets/data.js` to adjust the original bonus lesson library.
The A1–C2 curriculum lives in the six JS files in `app/src/main/assets/curriculum`.
To regenerate it from the source PDF attachments, run:

```sh
python3 scripts/extract_vocab_pdfs.py --input-dir ../upload --out-dir app/src/main/assets/curriculum
python3 scripts/extract_word_art.py --input-dir ../upload --out-dir app/src/main/assets/illustrations
python3 scripts/extract_word_art_hd.py --input-dir ../upload --out-dir app/src/main/assets/illustrations-hd
```

The extraction script checks all 36 sets and 900 entries per level. It never
commits the source PDFs. Keep vocabulary IDs stable to retain existing learner
progress.

The HD extractor preserves the embedded PDF artwork's original transparency;
it does not manufacture new full-resolution detail beyond the source images.
The optional `--premium-sheet` parameter selects an AI-remastered transparent
5×5 animal sheet for A1 set 01. The other 5,375 images are clean native PDF
extractions, not AI reillustrations. Future artwork packs can replace these
atlases without changing lesson or word IDs.

## Privacy

The app collects no personal data, does not run analytics, and does not contact
an external server. The Android shell only allows its bundled `file://` content.
Android's locally installed Text-to-Speech engine provides pronunciation and
story reading; availability depends on that engine and installed voice data.

## Release signing

The GitHub Actions workflow currently builds a **debug-signed APK** for testing.
A production release requires a stable signing key managed securely outside the
repository, real-device QA, and an appropriate distribution process. Debug APKs
from different CI runs may have different signing certificates; do not uninstall
an earlier install without backing up any important progress.
