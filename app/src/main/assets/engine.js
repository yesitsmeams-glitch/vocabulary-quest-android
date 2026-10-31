(function (root) {
  "use strict";
  const DAY = 24 * 60 * 60 * 1000;

  function dayKey(time = new Date()) {
    const date = new Date(time);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  function defaultProgress() {
    return { version: 2, name: "Explorer", onboarded: false,
      sound: true, reduceMotion: false, xp: 0, coins: 0, streak: 0,
      lastDay: "", dailyCount: 0, dailyGoal: 10, wordStats: {},
      favorites: [], lessonFinishes: {}, quizzesWon: 0, perfectQuizzes: 0,
      completedMatches: 0, completedSpelling: 0, bossWins: 0,
      dailyHistory: {}, dailyClaims: {}, hintsUsed: 0 };
  }
  function normalizeProgress(value) {
    const base = defaultProgress();
    if (!value || typeof value !== "object" || Array.isArray(value)) return base;
    const state = { ...base, ...value };
    if (!state.wordStats || typeof state.wordStats !== "object") state.wordStats = {};
    if (!Array.isArray(state.favorites)) state.favorites = [];
    if (!state.lessonFinishes || typeof state.lessonFinishes !== "object") state.lessonFinishes = {};
    if (!state.dailyHistory || typeof state.dailyHistory !== "object") state.dailyHistory = {};
    if (!state.dailyClaims || typeof state.dailyClaims !== "object") state.dailyClaims = {};
    if (Object.keys(state.wordStats).length > 0) state.onboarded = true;
    return state;
  }
  function activity(progress, now = new Date()) {
    const key = dayKey(now);
    if (!progress.dailyHistory[key]) progress.dailyHistory[key] = { words: 0, correct: 0, quizzes: 0, favorites: 0 };
    return progress.dailyHistory[key];
  }
  function touchDay(progress, now = new Date()) {
    const key = dayKey(now);
    if (progress.lastDay === key) return progress;
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    progress.streak = progress.lastDay === dayKey(yesterday) ? progress.streak + 1 : 1;
    progress.lastDay = key;
    progress.dailyCount = 0;
    return progress;
  }
  function award(progress, xp) {
    progress.xp += xp;
    progress.coins += Math.max(1, Math.floor(xp / 2));
  }
  function recordWord(progress, wordId, correct, now = new Date()) {
    touchDay(progress, now);
    const old = progress.wordStats[wordId] || { seen: 0, correct: 0, interval: 0, due: 0 };
    const interval = correct ? Math.min(old.interval ? old.interval * 2 : 1, 32) : 0;
    progress.wordStats[wordId] = {
      seen: old.seen + 1,
      correct: old.correct + (correct ? 1 : 0),
      interval,
      due: new Date(now).getTime() + (correct ? interval * DAY : 60 * 1000)
    };
    progress.dailyCount += 1;
    activity(progress, now).words += 1;
    if (correct) activity(progress, now).correct += 1;
    award(progress, correct ? 10 : 2);
    return progress.wordStats[wordId];
  }
  function recordQuiz(progress, score, total, mode, now = new Date()) {
    touchDay(progress, now);
    activity(progress, now).quizzes += 1;
    progress.quizzesWon++;
    if (score === total) progress.perfectQuizzes++;
    if (mode === "spell") progress.completedSpelling++;
    award(progress, 20);
  }
  function recordFavorite(progress, now = new Date()) {
    activity(progress, now).favorites += 1;
  }
  function isMastered(progress, wordId) {
    const stat = progress.wordStats[wordId];
    return Boolean(stat && stat.correct >= 2);
  }
  function dueWords(progress, words, now = new Date()) {
    const time = +new Date(now);
    return words.filter(word => {
      const stat = progress.wordStats[word.id];
      return stat && stat.due <= time;
    });
  }
  function shuffle(list, random = Math.random) {
    const result = [...list];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function makeQuiz(candidates, allWords, count = 10, random = Math.random) {
    const unique = [...new Map(candidates.map(word => [word.id, word])).values()];
    if (!unique.length) return [];
    const pool = [...new Map(allWords.map(word => [word.meaning, word])).values()];
    return shuffle(unique, random).slice(0, count).map(word => {
      // Keep answer languages consistent: Arabic CEFR packs never mix their
      // distractors with the English-definition bonus lessons.
      const sameLevel = pool.filter(item => (item.level || 'bonus') === (word.level || 'bonus'));
      const distractors = sameLevel.length >= 4 ? sameLevel : pool;
      const wrong = shuffle(distractors.filter(item => item.meaning !== word.meaning), random)
        .slice(0, 3).map(item => item.meaning);
      return { word, answer: word.meaning,
        options: shuffle([word.meaning, ...wrong], random) };
    });
  }
  function level(xp) { return Math.floor(Math.sqrt(Math.max(0, xp) / 80)) + 1; }
  function levelInfo(xp) {
    const current = level(xp);
    const start = (current - 1) * (current - 1) * 80;
    const end = current * current * 80;
    return { level: current, earned: xp - start, target: end - start };
  }
  function allWords(lessons) { return lessons.flatMap(lesson => lesson.words); }
  const missions = [
    { id: "scout", icon: "📚", title: "Word Scout", detail: "Practice 8 words today", metric: "words", target: 8, gems: 35 },
    { id: "champion", icon: "🎯", title: "Quiz Champion", detail: "Finish one challenge", metric: "quizzes", target: 1, gems: 45 },
    { id: "collector", icon: "💖", title: "Heart Collector", detail: "Save 3 favorite words", metric: "favorites", target: 3, gems: 25 }
  ];
  function missionState(progress, now = new Date()) {
    const key = dayKey(now);
    const today = progress.dailyHistory[key] || { words: 0, quizzes: 0, favorites: 0 };
    return missions.map(mission => ({
      ...mission,
      current: Math.min(mission.target, today[mission.metric] || 0),
      claimed: Boolean(progress.dailyClaims[`${key}:${mission.id}`])
    }));
  }
  function claimMission(progress, missionId, now = new Date()) {
    const mission = missionState(progress,now).find(m => m.id === missionId);
    if (!mission || mission.claimed || mission.current < mission.target) return false;
    progress.dailyClaims[`${dayKey(now)}:${mission.id}`] = true;
    progress.coins += mission.gems;
    return true;
  }
  function weeklyActivity(progress, now = new Date()) {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - i));
      const key = dayKey(date);
      const data = progress.dailyHistory[key] || { words: 0, correct: 0 };
      return { key, label: date.toLocaleDateString('en-US',{weekday:'short'}), words: data.words || 0, correct: data.correct || 0 };
    });
  }
  function achievements(progress, totalWords) {
    const learned = Object.keys(progress.wordStats).length;
    const mastered = totalWords.filter(word => isMastered(progress, word.id)).length;
    return [
      { icon: "🌟", title: "First Spark", description: "Learn your first word", earned: learned >= 1 },
      { icon: "🔥", title: "On Fire", description: "Reach a 3-day streak", earned: progress.streak >= 3 },
      { icon: "🧠", title: "Brain Power", description: "Master 10 words", earned: mastered >= 10 },
      { icon: "📖", title: "Bookworm", description: "Discover 100 different words", earned: learned >= 100 },
      { icon: "🏅", title: "Quest Champion", description: "Earn 500 XP", earned: progress.xp >= 500 },
      { icon: "🎯", title: "Perfect Run", description: "Complete a perfect quiz", earned: progress.perfectQuizzes >= 1 },
      { icon: "🧩", title: "Puzzle Pro", description: "Win 5 matching games", earned: progress.completedMatches >= 5 },
      { icon: "👑", title: "Boss Slayer", description: "Conquer a Boss Battle", earned: progress.bossWins >= 1 },
      { icon: "💖", title: "Word Keeper", description: "Save 20 favorite words", earned: progress.favorites.length >= 20 },
      { icon: "🗺️", title: "World Traveler", description: "Finish 5 lessons", earned: Object.keys(progress.lessonFinishes).length >= 5 },
      { icon: "🌌", title: "Ultimate Explorer", description: "Complete 36 adventures", earned: Object.keys(progress.lessonFinishes).length >= 36 }
    ];
  }
  const api = { dayKey, defaultProgress, normalizeProgress, touchDay, award,
    activity, recordWord, recordQuiz, recordFavorite, isMastered, dueWords,
    shuffle, makeQuiz, level, levelInfo, allWords, missions,
    missionState, claimMission, weeklyActivity, achievements };
  root.VQEngine = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
