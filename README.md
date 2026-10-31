# Vocabulary Quest

An offline-first, colorful English vocabulary adventure for Android.

## What is included

- 15 illustrated topic worlds and 150 carefully written starter words
- Flip-card lessons with pronunciation, definitions and examples
- Multiple-choice challenges, spelling challenges and matching pairs
- Smart review scheduling, favorites, daily goals, streaks, XP and badges
- Local progress saved on the device; no account or internet required
- Responsive web preview using the same assets as the native Android app

> **Content recovery note:** This is a new, working starter library. The original
> 5,400-word collection and original illustrations from the earlier interrupted
> conversation were not present in the GitHub repository. They have not been
> silently reconstructed or claimed as recovered.

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

## Development checks

With Node.js 20 or later:

```sh
npm test
```

The tests validate the vocabulary collection, challenge options and review
scheduling. The app requires no npm packages at runtime.

## Extending the word library

Edit `app/src/main/assets/data.js`. Every lesson has an ID, title, theme and a
`words` list with `[term, meaning, example]` entries. Word IDs are generated
from the lesson ID and term. Keep those stable so users retain their progress.

## Privacy

The app collects no personal data, does not run analytics, and does not contact
an external server. The Android shell only allows its bundled `file://` content.
