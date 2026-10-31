const test = require('node:test');
const assert = require('node:assert/strict');
const lessons = require('../app/src/main/assets/data.js');
const engine = require('../app/src/main/assets/engine.js');
const words = engine.allWords(lessons);

test('starter library has 15 themed lessons and 150 unique vocabulary words', () => {
  assert.equal(lessons.length, 15);
  assert.equal(words.length, 150);
  assert.equal(new Set(words.map(word => word.id)).size, 150);
  for (const lesson of lessons) {
    assert.equal(lesson.words.length, 10);
    assert.match(lesson.color, /^#[0-9a-fA-F]{6}$/);
    for (const word of lesson.words) {
      assert.ok(word.term && word.meaning && word.example);
      assert.match(word.example, /[.?!]$/);
    }
  }
});

test('quiz produces correct answers and four different options', () => {
  const quiz = engine.makeQuiz(lessons[0].words, words, 10, () => 0.4);
  assert.equal(quiz.length, 10);
  for (const question of quiz) {
    assert.equal(question.options.length, 4);
    assert.equal(new Set(question.options).size, 4);
    assert.ok(question.options.includes(question.answer));
  }
});

test('review scheduling advances, doubles intervals and resets after mistakes', () => {
  const progress = engine.defaultProgress();
  const t = new Date('2026-10-20T12:00:00Z');
  engine.recordWord(progress, words[0].id, true, t);
  assert.equal(progress.wordStats[words[0].id].interval, 1);
  assert.equal(engine.dueWords(progress, words, t).length, 0);
  const day2 = new Date('2026-10-21T12:00:00Z');
  engine.recordWord(progress, words[0].id, true, day2);
  assert.equal(progress.wordStats[words[0].id].interval, 2);
  assert.equal(engine.isMastered(progress, words[0].id), true);
  const day4 = new Date('2026-10-23T12:00:00Z');
  assert.equal(engine.dueWords(progress, words, day4).length, 1);
  engine.recordWord(progress, words[0].id, false, day4);
  assert.equal(progress.wordStats[words[0].id].interval, 0);
});

test('daily streak survives consecutive days and resets after a missed day', () => {
  const progress = engine.defaultProgress();
  engine.recordWord(progress, words[0].id, true, new Date('2026-10-20T12:00:00Z'));
  engine.recordWord(progress, words[1].id, true, new Date('2026-10-21T12:00:00Z'));
  assert.equal(progress.streak, 2);
  assert.equal(progress.dailyCount, 1);
  engine.recordWord(progress, words[2].id, true, new Date('2026-10-25T12:00:00Z'));
  assert.equal(progress.streak, 1);
});

test('progress normalization repairs invalid storage objects', () => {
  const progress = engine.normalizeProgress({ xp: 35, favorites: null, wordStats: null });
  assert.equal(progress.xp, 35);
  assert.deepEqual(progress.favorites, []);
  assert.deepEqual(progress.wordStats, {});
  assert.deepEqual(progress.storyFinishes, {});
  assert.deepEqual(progress.storyResponses, {});
});

test('reading progress and responses survive an app upgrade', () => {
  const progress = engine.normalizeProgress({onboarded:true,storyFinishes:{'a1-set-01':true},storyResponses:{'a1-set-01':{'0':'A golden bell'}}});
  assert.equal(progress.storyFinishes['a1-set-01'],true);
  assert.equal(progress.storyResponses['a1-set-01']['0'],'A golden bell');
  assert.ok(engine.achievements(progress,words).some(b=>b.title==='Story Starter' && b.earned));
});

test('upgrading progress preserves earlier words and skips onboarding for existing learners', () => {
  const progress = engine.normalizeProgress({xp:200,wordStats:{'nature:habitat':{seen:3,correct:2,interval:2,due:0}}});
  assert.equal(progress.xp,200);
  assert.equal(progress.onboarded,true);
  assert.equal(progress.wordStats['nature:habitat'].correct,2);
  assert.deepEqual(progress.dailyHistory,{});
});

test('daily missions can only be claimed once and reset the following day', () => {
  const progress = engine.defaultProgress();
  const now = new Date('2026-10-20T12:00:00Z');
  for (let i=0;i<8;i++) engine.recordWord(progress, words[i].id,true,now);
  const mission = engine.missionState(progress,now).find(m => m.id === 'scout');
  assert.equal(mission.current,8);
  const before = progress.coins;
  assert.equal(engine.claimMission(progress,'scout',now),true);
  assert.equal(progress.coins,before+35);
  assert.equal(engine.claimMission(progress,'scout',now),false);
  const later = new Date('2026-10-21T12:00:00Z');
  assert.equal(engine.missionState(progress,later).find(m => m.id === 'scout').claimed,false);
});

test('quiz and favorite activity contributes to daily quests and weekly history', () => {
  const progress = engine.defaultProgress();
  const now = new Date('2026-10-20T12:00:00Z');
  engine.recordQuiz(progress,10,10,'choice',now);
  engine.recordFavorite(progress,now);
  assert.equal(progress.quizzesWon,1);
  assert.equal(progress.perfectQuizzes,1);
  assert.equal(engine.missionState(progress,now).find(m => m.id === 'champion').current,1);
  const week = engine.weeklyActivity(progress,now);
  assert.equal(week.length,7);
  assert.equal(week[6].key,'2026-10-20');
});
