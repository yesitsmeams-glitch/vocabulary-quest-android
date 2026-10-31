(function () {
  'use strict';
  const lessons = window.VQ_LESSONS;
  const engine = window.VQEngine;
  const words = engine.allWords(lessons);
  const byId = new Map(words.map(word => [word.id, word]));
  const storageKey = 'vocabulary-quest-progress-v1';
  const root = document.getElementById('app');
  let progress;
  try { progress = engine.normalizeProgress(JSON.parse(localStorage.getItem(storageKey))); }
  catch (_) { progress = engine.defaultProgress(); }
  const ui = { screen: progress.onboarded ? 'home' : 'welcome', lessonId: lessons[0].id, index: 0,
    flipped: false, quiz: null, result: null, match: null,
    learnView: 'path', onboardGoal: 10, onboardName: '',
    collectionQuery: '', collectionFilter: 'all', toast: '', toastTimeout: 0 };
  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(progress)); }
    catch (_) { toast('Your device could not save progress. Check available storage.'); }
  }
  function lessonById(id) { return lessons.find(lesson => lesson.id === id) || lessons[0]; }
  function wordSeen(id) { return Boolean(progress.wordStats[id]); }
  function countSeen(lesson) { return lesson.words.filter(word => wordSeen(word.id)).length; }
  function mastered() { return words.filter(word => engine.isMastered(progress, word.id)).length; }
  function due() { return engine.dueWords(progress, words); }
  function currentStreak() {
    const today = engine.dayKey();
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    return progress.lastDay === today || progress.lastDay === engine.dayKey(yesterday) ? progress.streak : 0;
  }
  function todayCount() { return progress.lastDay === engine.dayKey() ? progress.dailyCount : 0; }
  function percent(number, total) { return total ? Math.min(100,Math.round(number / total * 100)) : 0; }
  function toast(message) {
    ui.toast = message;
    clearTimeout(ui.toastTimeout);
    const old = document.querySelector('.toast'); if (old) old.remove();
    const box = document.createElement('div'); box.className = 'toast'; box.textContent = message;
    document.body.appendChild(box);
    ui.toastTimeout = setTimeout(() => { box.remove(); ui.toast = ''; }, 2300);
  }
  let audioContext;
  function playSound(kind = 'success') {
    if (!progress.sound) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      audioContext ||= new Audio();
      const notes = kind === 'success' ? [523, 659, 784] : kind === 'reward' ? [659, 784, 1047] : [250, 200];
      notes.forEach((frequency, i) => {
        const osc = audioContext.createOscillator(), gain = audioContext.createGain();
        osc.type = 'sine'; osc.frequency.value = frequency;
        const at = audioContext.currentTime + i * .08;
        gain.gain.setValueAtTime(.0001,at);
        gain.gain.exponentialRampToValueAtTime(.09,at+.01);
        gain.gain.exponentialRampToValueAtTime(.0001,at+.23);
        osc.connect(gain); gain.connect(audioContext.destination);
        osc.start(at); osc.stop(at+.24);
      });
    } catch (_) { /* Audio is optional: learning always works silently. */ }
  }
  function celebrate() {
    if (progress.reduceMotion || !document.createElement) return;
    const layer = document.createElement('div'); layer.className = 'confetti-layer';
    const colors = ['#ffcb53','#6a59f5','#30c5a8','#ff7193','#72b7f7'];
    layer.innerHTML = Array.from({length:32},(_,i) => `<i style="--x:${(i*37)%100}%;--d:${(i%6)*.1}s;--rot:${i*41}deg;--c:${colors[i%colors.length]}"></i>`).join('');
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(),2200);
  }
  function nav(name, icon, label) {
    const active = ui.screen === name || (name === 'learn' && ['lesson','lesson-finish'].includes(ui.screen)) ||
      (name === 'practice' && ['quiz','spell','match','result'].includes(ui.screen));
    return `<button type="button" class="nav-link ${active ? 'active' : ''}" data-action="nav" data-to="${name}"><span class="nav-emoji">${icon}</span>${label}</button>`;
  }
  const navItems = [['home','🏠','Home'],['learn','🗺️','Explore'],['practice','⚡','Practice'],['collection','📖','My Words'],['profile','👤','Profile']];
  function sidebar() {
    return `<aside class="sidebar">
      <div class="brand"><div class="brand-mark">📖</div><div>Vocabulary<br>Quest<small>LEARN · PLAY · GROW</small></div></div>
      <nav aria-label="Main navigation" class="side-links">${navItems.map(x => nav(...x)).join('')}</nav>
      <div class="sidebar-card"><img class="sidebar-mascot" src="lumi-mascot.webp" alt="Lumi, your fox explorer" /><strong>Lumi says hello!</strong><p>Every new word is a little superpower. Let's collect some!</p><button class="btn btn-primary btn-full" data-action="start-quiz" data-mode="choice">Quick challenge ⚡</button></div>
    </aside>`;
  }
  function topbar() {
    return `<header class="topbar">
      <div class="mobile-brand"><span class="brand-mark">📖</span>Vocabulary Quest</div>
      <div class="hello"><div class="eyebrow">YOUR LEARNING ADVENTURE</div><h1>${ui.screen === 'home' ? `Hello, ${esc(progress.name)}! 👋` : 'Keep your curiosity glowing ✨'}</h1></div>
      <div class="top-stats"><span class="stat-pill"><span class="emoji">🔥</span>${currentStreak()} day${currentStreak() === 1 ? '' : 's'}</span><span class="stat-pill"><span class="emoji">💎</span>${progress.coins} gems</span><button class="avatar" aria-label="Open profile" data-action="nav" data-to="profile">🧑‍🚀</button></div>
    </header>`;
  }
  function bottomnav() {
    return `<nav class="bottom-nav" aria-label="Mobile navigation">${navItems.map(([name,icon,label]) => {
      const active = ui.screen === name || (name === 'learn' && ['lesson','lesson-finish'].includes(ui.screen)) || (name === 'practice' && ['quiz','spell','match','result'].includes(ui.screen));
      return `<button aria-label="${label}" ${active ? 'aria-current="page"' : ''} class="${active ? 'active':''}" data-action="nav" data-to="${name}"><span>${icon}</span>${label}</button>`;
    }).join('')}</nav>`;
  }
  function progressBar(n, total, mint = false) { return `<div class="progress-track"><div class="progress-fill ${mint ? 'mint' : ''}" style="width:${percent(n,total)}%"></div></div>`; }
  function lessonCard(lesson) {
    const seen = countSeen(lesson);
    return `<button class="lesson-card" data-action="open-lesson" data-id="${lesson.id}" style="--accent:${lesson.color}">
      <div class="lesson-illustration"><span>${lesson.emoji}</span></div><div class="lesson-card-info"><h3>${esc(lesson.title)}</h3><p>${esc(lesson.subtitle)}</p>
      <div class="lesson-footer"><span>${lesson.words.length} words</span><strong>${seen === 10 ? '✓ Complete' : `${seen}/10 discovered`}</strong></div>
      <div class="lesson-bar"><i style="width:${percent(seen,lesson.words.length)}%"></i></div></div></button>`;
  }
  function welcome() {
    return `<main class="welcome-screen"><div class="welcome-glow glow-one"></div><div class="welcome-glow glow-two"></div>
      <div class="welcome-brand">📖 <span>VOCABULARY QUEST</span></div>
      <div class="welcome-panel"><div class="welcome-art"><span class="welcome-spark one">⭐</span><img src="lumi-mascot.webp" alt="Lumi the fox welcomes you to Vocabulary Quest"/><span class="welcome-spark two">✨</span></div>
      <div class="welcome-copy"><span class="hero-tag">YOUR NEXT BIG ADVENTURE</span><h1>Every word<br>is a new world.</h1><p>Hi! I'm <strong>Lumi</strong>, your friendly fox guide. Let's turn learning English into a colorful adventure!</p>
      <label class="welcome-label" for="welcome-name">What should I call you?</label><input id="welcome-name" class="search" maxlength="24" placeholder="Your explorer name" value="${esc(ui.onboardName)}" />
      <div class="welcome-label mt-3">Choose a daily goal</div><div class="goal-options">${[[5,'Easy','5 words'],[10,'Steady','10 words'],[15,'Brave','15 words']].map(([num,label,detail]) => `<button class="goal-option ${ui.onboardGoal === num ? 'active' : ''}" data-action="onboard-goal" data-count="${num}"><strong>${label}</strong><small>${detail}</small></button>`).join('')}</div>
      <button class="btn btn-white btn-large btn-full mt-3" data-action="finish-onboard">Let's begin my quest! 🚀</button><small class="welcome-note">Offline learning · No account · Progress stays on your device</small></div></div>
    </main>`;
  }
  function home() {
    const learned = Object.keys(progress.wordStats).length;
    const daily = Math.min(todayCount(), progress.dailyGoal);
    const next = lessons.find(l => countSeen(l) < l.words.length) || lessons[0];
    const featured = [...lessons].sort((a,b) => (countSeen(b) > 0 ? 1 : 0) - (countSeen(a) > 0 ? 1 : 0)).slice(0,6);
    return `<section class="hero"><div class="hero-copy"><span class="hero-tag">✨ YOUR DAILY ADVENTURE</span><h2>Big dreams.<br>Brilliant words.</h2><p>Lumi is cheering for you! Discover something new and make today's adventure count.</p><button class="btn btn-white" data-action="open-lesson" data-id="${next.id}">Continue my quest <span>→</span></button></div>
      <div class="hero-art" aria-hidden="true"><img class="hero-mascot" src="lumi-mascot.webp" alt="" /><span class="spark one">⭐</span><span class="spark two">💫</span><span class="spark three">✨</span></div></section>
      <div class="content-grid"><div class="surface"><div class="goal-intro"><strong>🎯 Today's word mission</strong><span>${daily} / ${progress.dailyGoal} words</span></div>
        ${progressBar(daily, progress.dailyGoal)}<p class="daily-motivation">${daily >= progress.dailyGoal ? 'Amazing! You completed your daily mission. 🎉' : `${progress.dailyGoal - daily} more discoveries to complete your mission!`}</p>
        <div class="mini-grid"><div class="mini-stat"><span>📖</span><strong>${learned}</strong><small>DISCOVERED</small></div><div class="mini-stat"><span>⭐</span><strong>${progress.xp}</strong><small>TOTAL XP</small></div><div class="mini-stat"><span>🏆</span><strong>${mastered()}</strong><small>MASTERED</small></div></div>
        </div><div class="surface challenge-card"><span class="eyebrow" style="color:#e18c29">DAILY BOOST</span><h3>Brain training,<br>but make it fun!</h3><p>${due().length ? `${due().length} words are ready for a smart review.` : 'Try a quick challenge and earn shiny gems.'}</p><button class="btn btn-primary mt-2" data-action="start-quiz" data-mode="${due().length ? 'review':'choice'}">${due().length ? 'Review now' : 'Start a quiz'} →</button></div></div>
      <div class="section-heading"><div><h2>🎁 Daily treasure quests</h2><p>Complete little missions and collect gems</p></div><span class="quest-reset">Resets every day ✨</span></div>
      <div class="mission-grid">${engine.missionState(progress).map(m => `<div class="mission-card"><span class="mission-icon">${m.icon}</span><div class="mission-copy"><h3>${esc(m.title)}</h3><p>${esc(m.detail)}</p><div class="mission-line">${progressBar(m.current,m.target,true)}<small>${m.current}/${m.target}</small></div></div><button class="mission-reward ${m.claimed ? 'claimed' : ''}" data-action="claim-mission" data-id="${m.id}" ${m.claimed || m.current < m.target ? 'disabled' : ''}>${m.claimed ? '✓ Claimed' : `💎 ${m.gems}`}</button></div>`).join('')}</div>
      <div class="section-heading"><div><h2>🗺️ Explore your worlds</h2><p>Choose a place to discover new words</p></div><button class="section-link" data-action="nav" data-to="learn">See all worlds →</button></div>
      <div class="lesson-grid">${featured.map(lessonCard).join('')}</div>`;
  }
  function learn() {
    const finished = Object.keys(progress.lessonFinishes).length;
    return `<div class="page-heading"><div class="eyebrow">15 WORLDS · ${words.length} WORDS</div><h1>Choose your next adventure 🗺️</h1><p>Follow Lumi's winding trail through colorful worlds, or choose any topic that interests you.</p></div>
      <div class="explore-banner"><div><span class="eyebrow">THE GRAND WORD JOURNEY</span><h2>${finished} of ${lessons.length} worlds explored</h2><p>Every completed world brings you closer to mastery.</p>${progressBar(finished,lessons.length)}</div><img src="lumi-mascot.webp" alt="Lumi is excited for your journey" /></div>
      <div class="view-switch" role="group" aria-label="Choose learning view"><button class="${ui.learnView === 'path' ? 'active' : ''}" data-action="learn-view" data-view="path">🧭 Quest Path</button><button class="${ui.learnView === 'grid' ? 'active' : ''}" data-action="learn-view" data-view="grid">▦ All Worlds</button></div>
      ${ui.learnView === 'grid' ? `<div class="lesson-grid">${lessons.map(lessonCard).join('')}</div>` : `<div class="quest-path"><div class="quest-trail"></div>${lessons.map((lesson,i) => {
        const completed = Boolean(progress.lessonFinishes[lesson.id]);
        const seen = countSeen(lesson);
        return `<div class="path-stop ${i % 2 ? 'right' : 'left'}"><button class="path-orb ${completed ? 'done' : ''}" style="--accent:${lesson.color}" data-action="open-lesson" data-id="${lesson.id}" aria-label="Open ${esc(lesson.title)}"><span>${lesson.emoji}</span>${completed ? '<i>✓</i>' : ''}</button><button class="path-card" data-action="open-lesson" data-id="${lesson.id}"><small>WORLD ${String(i+1).padStart(2,'0')} ${completed ? '· COMPLETED ⭐' : seen ? '· IN PROGRESS' : '· READY TO EXPLORE'}</small><strong>${esc(lesson.title)}</strong><span>${esc(lesson.subtitle)}</span><div class="path-card-footer">${seen} / 10 words <b>${completed ? 'Replay ↻' : 'Explore →'}</b></div></button></div>`;
      }).join('')}</div>`}`;
  }
  function stageHeader(title, subtitle, current, total, mint = true) {
    return `<div class="stage-top"><button class="icon-btn" data-action="back" aria-label="Go back">←</button><div class="stage-title"><strong>${esc(title)}</strong><span>${esc(subtitle)}</span></div><span class="stat-pill">${Math.min(current,total)} / ${total}</span></div><div class="stage-progress">${progressBar(current,total,mint)}</div>`;
  }
  function lesson() {
    const current = lessonById(ui.lessonId);
    const word = current.words[ui.index];
    const fav = progress.favorites.includes(word.id);
    return `<div class="lesson-stage">${stageHeader(current.title, 'Discover · Flip · Remember', ui.index + 1, current.words.length)}
      <p class="flip-help">${ui.flipped ? 'A little knowledge goes a long way 🌟' : 'Tap the card to reveal the meaning ✨'}</p>
      <button class="flashcard ${ui.flipped ? 'flipped' : ''}" data-action="flip" aria-label="Flip vocabulary card">
        <span class="card-orb">${ui.flipped ? '💡' : current.emoji}</span>
        ${ui.flipped ? `<span class="word-type">THE MEANING</span><p class="definition">${esc(word.meaning)}</p><p class="example">“${esc(word.example)}”</p>` : `<h2>${esc(word.term)}</h2><span class="word-type">TAP TO DISCOVER</span>`}
      </button><div class="lesson-actions">
        <button class="btn btn-outline" data-action="speak" data-id="${esc(word.id)}">🔊 Listen</button>
        <button class="btn btn-outline" data-action="favorite" data-id="${esc(word.id)}">${fav ? '❤️ Saved' : '🤍 Save word'}</button>
      </div><div class="lesson-actions mt-2">
        <button class="btn btn-soft btn-large" data-action="study" data-known="no">🔁 Practice again</button>
        <button class="btn btn-success btn-large" data-action="study" data-known="yes">Got it! ✓</button>
      </div><p class="center muted small mt-3">+10 XP for every word you know · Your progress saves automatically</p></div>`;
  }
  function lessonFinish() {
    const current = lessonById(ui.lessonId);
    return finish('World explored!', `${current.title} is complete. Your brain just grew a little stronger.`,current.emoji,[
      ['📚',current.words.length,'WORDS'],['🏅','+30','BONUS XP']
    ], `<button class="btn btn-primary btn-large btn-full" data-action="start-quiz" data-mode="choice" data-id="${current.id}">Test your knowledge ⚡</button><button class="btn btn-outline btn-large btn-full mt-2" data-action="nav" data-to="learn">Explore another world →</button>`);
  }
  function practice() {
    return `<div class="page-heading"><div class="eyebrow">MAKE KNOWLEDGE STICK</div><h1>The Practice Arcade ⚡</h1><p>Play short challenges, collect XP, and make every word unforgettable.</p></div>
      <div class="practice-grid">
        <button class="mode-card" style="--mode-bg:#eee9ff" data-action="start-quiz" data-mode="choice"><span class="mode-icon">🧠</span><h3>Quick Quiz</h3><p>Choose the correct meaning and build your streak.</p><span class="arrow">↗</span></button>
        <button class="mode-card" style="--mode-bg:#e6fbf3" data-action="start-quiz" data-mode="review"><span class="mode-icon">🔁</span><h3>Smart Review</h3><p>${due().length ? `${due().length} words ready to revisit.` : 'A practice session until words are due.'}</p><span class="arrow">↗</span></button>
        <button class="mode-card" style="--mode-bg:#fff0df" data-action="start-quiz" data-mode="spell"><span class="mode-icon">✏️</span><h3>Spelling Bee</h3><p>Turn meanings into correctly spelled words.</p><span class="arrow">↗</span></button>
        <button class="mode-card" style="--mode-bg:#ffeaf1" data-action="start-match"><span class="mode-icon">🧩</span><h3>Match Mania</h3><p>Pair five words with their meanings as fast as you can.</p><span class="arrow">↗</span></button>
      </div><div class="boss-banner"><div class="boss-crown">👑</div><div><span class="eyebrow">THE ULTIMATE CHALLENGE</span><h2>Boss Battle</h2><p>15 tricky questions. Score 12 or more to claim an 80-gem crown reward!</p><button class="btn btn-white" data-action="start-quiz" data-mode="boss">Face the boss ⚡</button></div><span class="boss-dragon" aria-hidden="true">🐉</span></div>
      <div class="section-heading"><div><h2>🎁 Challenge rewards</h2><p>Every attempt helps you learn</p></div></div>
      <div class="surface"><div class="mini-grid"><div class="mini-stat"><span>🏆</span><strong>${progress.quizzesWon}</strong><small>QUIZZES</small></div><div class="mini-stat"><span>🎯</span><strong>${progress.perfectQuizzes}</strong><small>PERFECT</small></div><div class="mini-stat"><span>🧩</span><strong>${progress.completedMatches}</strong><small>MATCHES</small></div></div></div>`;
  }
  function startQuiz(mode, lessonId) {
    const lessonWords = lessonId ? lessonById(lessonId).words : words;
    const candidates = mode === 'review' ? (engine.dueWords(progress, lessonWords).length ? engine.dueWords(progress,lessonWords) : lessonWords.filter(w => wordSeen(w.id))) : lessonWords;
    const source = candidates.length ? candidates : lessonWords;
    const questions = mode === 'spell' ? engine.shuffle(source).slice(0, 8).map(word => ({word,answer:word.term})) : engine.makeQuiz(source, words, mode === 'boss' ? 15 : 10);
    ui.quiz = { mode, questions, index: 0, score: 0, answered: null, response: '', hintUsed: false, eliminated: [] };
    ui.screen = mode === 'spell' ? 'spell' : 'quiz';
    render(true);
  }
  function quiz() {
    const q = ui.quiz, question = q.questions[q.index];
    const answered = q.answered !== null;
    const correct = q.answered === question.answer;
    return `<div class="lesson-stage">${stageHeader(q.mode === 'review' ? 'Smart Review' : q.mode === 'boss' ? '👑 Boss Battle' : 'Quick Quiz', `⭐ ${q.score} correct so far`, q.index + 1, q.questions.length)}
      <div class="quiz-prompt"><span class="small">WHAT DOES THIS WORD MEAN?</span><h2>${esc(question.word.term)}</h2><button class="speaker" data-action="speak" data-id="${esc(question.word.id)}" aria-label="Hear the word">🔊</button></div>
      <div class="quiz-options">${question.options.map((option,i) => `<button class="answer ${q.eliminated.includes(option) ? 'eliminated' : ''} ${answered ? (option === question.answer ? 'correct' : (option === q.answered ? 'wrong' : '')) : ''}" data-action="answer" data-index="${i}" ${answered || q.eliminated.includes(option) ? 'disabled' : ''}><span style="color:#b5a9e3;margin-right:8px">${'ABCD'[i]}.</span>${q.eliminated.includes(option) ? '— Eliminated —' : esc(option)}</button>`).join('')}</div>
      ${!answered ? `<div class="helper-row"><span>💎 ${progress.coins} gems</span><button class="hint-button" data-action="quiz-hint" ${q.hintUsed || progress.coins < 15 ? 'disabled' : ''}>${q.hintUsed ? '✨ Hint used' : '✨ Remove 2 answers · 15 gems'}</button></div>` : ''}
      ${answered ? `<div class="feedback ${correct ? '' : 'wrong'}">${correct ? '🎉 Brilliant! That is exactly right.' : `💡 Good try! The answer is: ${esc(question.answer)}`}${nextQuestionButton(q)}</div>` : '<p class="center muted small mt-3">Choose your answer. Every try makes you stronger!</p>'}</div>`;
  }
  function nextQuestionButton(q) { return `<button class="btn btn-primary btn-full" data-action="next-question">${q.index === q.questions.length - 1 ? 'See results 🎉' : 'Next question →'}</button>`; }
  function spelling() {
    const q = ui.quiz, question = q.questions[q.index];
    const answered = q.answered !== null;
    const correct = q.answered === question.answer;
    return `<div class="lesson-stage">${stageHeader('Spelling Bee', `✏️ ${q.score} correct so far`,q.index + 1,q.questions.length)}
      <div class="quiz-prompt"><span class="small">SPELL THE WORD THAT MEANS</span><h2 style="font-size:clamp(23px,4.2vw,33px)">${esc(question.word.meaning)}</h2><p class="muted" style="font-style:italic">${esc(question.word.example.replace(new RegExp(question.word.term,'ig'), '______'))}</p></div>
      <input type="text" autocapitalize="off" autocomplete="off" spellcheck="false" data-role="spell-input" class="search spelling-input" aria-label="Spell the word" placeholder="Type the word..." value="${esc(q.response)}" ${answered ? 'disabled' : ''}/>
      ${answered ? `<div class="feedback ${correct ? '' : 'wrong'}">${correct ? '🎉 Perfect spelling!' : `💡 Correct spelling: ${esc(question.answer)}`}${nextQuestionButton(q)}</div>` : `<div class="helper-row"><span>${q.hintUsed ? `💡 Starts with “${esc(question.answer[0].toUpperCase())}” · ${question.answer.length} letters` : `💎 ${progress.coins} gems`}</span><button class="hint-button" data-action="spell-hint" ${q.hintUsed || progress.coins < 8 ? 'disabled' : ''}>${q.hintUsed ? 'Hint used' : '✨ Letter hint · 8 gems'}</button></div><button class="btn btn-primary btn-full btn-large mt-3" data-action="check-spelling">Check spelling ✓</button>`}</div>`;
  }
  function startMatch() {
    const choices = engine.shuffle(words).slice(0,5);
    ui.match = { words: choices, terms: engine.shuffle(choices), meanings: engine.shuffle(choices), selectedTerm: null, selectedMeaning: null, matched: [], attempts: 0 };
    ui.screen = 'match'; render(true);
  }
  function match() {
    const game = ui.match;
    const tile = (word, side) => `<button class="match-tile ${game.matched.includes(word.id) ? 'matched' : ''} ${game[side === 'term' ? 'selectedTerm' : 'selectedMeaning'] === word.id ? 'selected' : ''}" data-action="match-pick" data-side="${side}" data-id="${esc(word.id)}" ${game.matched.includes(word.id) ? 'disabled' : ''}>${esc(side === 'term' ? word.term : word.meaning)}</button>`;
    return `<div class="lesson-stage">${stageHeader('Match Mania', 'Pair each word with its meaning', game.matched.length, 5)}
      <div class="center"><span style="font-size:57px">🧩</span><h2>Find the perfect pairs</h2><p class="muted small">Select one word and one meaning to connect them!</p></div>
      <div class="match-grid mt-3"><div class="match-column">${game.terms.map(w => tile(w,'term')).join('')}</div><div class="match-column">${game.meanings.map(w => tile(w,'meaning')).join('')}</div></div><p class="center muted small mt-3">${game.matched.length}/5 pairs matched · ${game.attempts} attempts</p></div>`;
  }
  function finish(title, description, icon, stats, actions) {
    return `<div class="surface finish"><span class="big-celebrate">${icon}</span><span class="eyebrow">QUEST COMPLETE</span><h1>${esc(title)}</h1><p>${esc(description)}</p>
      <div class="finish-stats">${stats.map(([emoji,value,label]) => `<div class="mini-stat"><span>${emoji}</span><strong>${value}</strong><small>${label}</small></div>`).join('')}</div>${actions}</div>`;
  }
  function result() {
    const x = ui.result;
    return finish(x.title,x.description,x.icon,[['🎯',x.score, 'CORRECT'],['⭐',x.total,'QUESTIONS']],`<button class="btn btn-primary btn-large btn-full" data-action="${x.mode === 'match' ? 'start-match':'start-quiz'}" ${x.mode === 'match' ? '' : `data-mode="${x.mode}"`}>Play again ↻</button><button class="btn btn-outline btn-large btn-full mt-2" data-action="nav" data-to="practice">Back to arcade →</button>`);
  }
  function filteredWords() {
    const term = ui.collectionQuery.trim().toLowerCase();
    return words.filter(w => (ui.collectionFilter === 'favorites' ? progress.favorites.includes(w.id) : ui.collectionFilter === 'learned' ? wordSeen(w.id) : true) &&
      (!term || `${w.term} ${w.meaning} ${lessonById(w.lessonId).title}`.toLowerCase().includes(term)));
  }
  function collectionRows() {
    const result = filteredWords();
    return result.length ? `<div class="collection-grid">${result.map(w => `<div class="word-row"><span class="word-emoji">${lessonById(w.lessonId).emoji}</span><div class="copy"><h3>${esc(w.term)} ${engine.isMastered(progress,w.id) ? '🌟' : ''}</h3><p>${esc(w.meaning)}</p><small>${esc(lessonById(w.lessonId).title)} · ${wordSeen(w.id) ? 'Discovered' : 'New'}</small></div><button class="heart-btn" data-action="favorite" data-id="${esc(w.id)}" aria-label="${progress.favorites.includes(w.id) ? 'Unsave' : 'Save'} ${esc(w.term)}">${progress.favorites.includes(w.id) ? '❤️' : '🤍'}</button></div>`).join('')}</div>` : `<div class="empty"><span class="big">🔎</span><h3>No words found</h3><p>Try a different search, or discover a new word in the lessons.</p></div>`;
  }
  function collection() {
    return `<div class="page-heading"><div class="eyebrow">YOUR PERSONAL WORD BANK</div><h1>My Word Collection 📖</h1><p>Search ${words.length} words, save favorites, and revisit your discoveries.</p></div>
      <div class="section-tools"><input type="search" class="search" id="collection-search" placeholder="🔎 Search words or meanings..." value="${esc(ui.collectionQuery)}" aria-label="Search words" /></div>
      <div class="section-tools">${[['all','All words'],['learned','Discovered'],['favorites','❤️ Favorites']].map(([id,label]) => `<button class="filter-btn ${ui.collectionFilter === id ? 'active' : ''}" data-action="filter" data-id="${id}">${label}</button>`).join('')}</div>
      <div id="collection-results">${collectionRows()}</div>`;
  }
  function profile() {
    const badges = engine.achievements(progress,words);
    const level = engine.levelInfo(progress.xp);
    const week = engine.weeklyActivity(progress);
    const maxActivity = Math.max(10,...week.map(d=>d.words));
    const accuracy = week.reduce((sum,d)=>sum+d.words,0) ? Math.round(week.reduce((sum,d)=>sum+d.correct,0) / week.reduce((sum,d)=>sum+d.words,0) * 100) : 0;
    return `<div class="page-heading"><div class="eyebrow">THE EXPLORER'S CORNER</div><h1>My Adventure Profile 👤</h1><p>Every step forward deserves to be celebrated.</p></div>
      <div class="level-banner"><div style="flex:1"><span class="hero-tag">LEVEL ${level.level} EXPLORER</span><h2>You've earned ${progress.xp} XP!</h2><p>${mastered()} words mastered · ${currentStreak()} day streak · ${progress.coins} gems</p><div class="level-progress">${progressBar(level.earned,level.target)}<small>${level.earned} / ${level.target} XP to next level</small></div></div><img class="profile-lumi" src="lumi-mascot.webp" alt="Lumi celebrates your progress" /></div>
      <div class="section-heading"><div><h2>📊 Learning momentum</h2><p>Your last seven days at a glance</p></div></div><div class="surface"><div class="weekly-bars">${week.map(d=>`<div class="weekly-day"><div class="weekly-column"><i style="height:${Math.max(7,Math.round(d.words/maxActivity*100))}%" title="${d.words} words"></i></div><strong>${d.label}</strong><small>${d.words}</small></div>`).join('')}</div><div class="weekly-summary"><span>🎯 ${accuracy}% accuracy this week</span><span>📚 ${week.reduce((sum,d)=>sum+d.words,0)} word practices</span></div></div>
      <div class="section-heading"><div><h2>✨ Your achievements</h2><p>${badges.filter(b => b.earned).length} of ${badges.length} badges unlocked</p></div></div><div class="badge-grid">${badges.map(b => `<div class="badge-card ${b.earned ? '' : 'locked'}"><span class="big">${b.icon}</span><h3>${esc(b.title)}</h3><p>${esc(b.description)}</p></div>`).join('')}</div>
      <div class="section-heading"><h2>⚙️ My settings</h2></div><div class="surface"><label class="strong" for="name-field">Explorer name</label><div class="section-tools mt-2 mb-0"><input id="name-field" class="search" style="flex:1;min-width:0" maxlength="24" value="${esc(progress.name)}" /><button class="btn btn-primary" data-action="save-name">Save</button></div>
      <div class="settings-row"><div><strong>🎯 Daily goal</strong><small>Choose your own pace</small></div><div class="tiny-options">${[5,10,15].map(n=>`<button class="${progress.dailyGoal===n ? 'active':''}" data-action="daily-goal" data-count="${n}">${n}</button>`).join('')}</div></div>
      <div class="settings-row"><div><strong>🎵 Reward sounds</strong><small>Happy chimes when you learn</small></div><button class="toggle ${progress.sound ? 'on':''}" data-action="toggle-sound" aria-label="Toggle reward sounds" aria-pressed="${progress.sound}"><i></i></button></div>
      <div class="settings-row"><div><strong>✨ Motion effects</strong><small>Turn off celebrations and motion</small></div><button class="toggle ${!progress.reduceMotion ? 'on':''}" data-action="toggle-motion" aria-label="Toggle motion effects" aria-pressed="${!progress.reduceMotion}"><i></i></button></div>
      <p class="small muted mt-3 mb-0">Your name and learning progress stay on this device. No account required.</p></div>`;
  }
  function render(scroll = false) {
    const screens = {home,learn,lesson,'lesson-finish':lessonFinish,practice,quiz,spell:spelling,match, result, collection, profile};
    root.innerHTML = ui.screen === 'welcome' ? welcome() : `<div class="shell">${sidebar()}<div class="workspace">${topbar()}<main id="main-content">${(screens[ui.screen] || home)()}</main></div></div>${bottomnav()}`;
    if (document.body.classList) document.body.classList.toggle('reduce-motion', progress.reduceMotion);
    if (scroll) window.scrollTo({top:0,behavior:'instant'});
  }
  function go(name) { ui.screen = name; render(true); }
  function openLesson(id) { ui.lessonId = id; ui.index = 0; ui.flipped = false; go('lesson'); }
  function study(known) {
    const selected = lessonById(ui.lessonId), word = selected.words[ui.index];
    engine.recordWord(progress,word.id,known); save(); playSound(known ? 'success' : 'wrong');
    if (ui.index < selected.words.length - 1) { ui.index++; ui.flipped = false; render(); }
    else {
      if (!progress.lessonFinishes[selected.id]) { progress.lessonFinishes[selected.id] = true; engine.award(progress,30); save(); }
      go('lesson-finish'); celebrate();
    }
  }
  function answer(optionIndex) {
    const q = ui.quiz; if (!q || q.answered !== null) return;
    const question = q.questions[q.index]; const value = question.options[optionIndex];
    if (value === undefined || q.eliminated.includes(value)) return;
    q.answered = value; const correct = value === question.answer;
    if (correct) q.score++;
    engine.recordWord(progress,question.word.id,correct); save(); playSound(correct ? 'success' : 'wrong'); render();
  }
  function checkSpelling() {
    const q = ui.quiz; if (!q || q.answered !== null) return;
    const input = document.querySelector('[data-role="spell-input"]');
    const typed = input ? input.value.trim() : q.response.trim();
    if (!typed) { toast('Try typing a word first ✏️'); return; }
    q.response = typed; q.answered = typed.toLowerCase() === q.questions[q.index].answer.toLowerCase() ? q.questions[q.index].answer : typed;
    const correct = q.answered === q.questions[q.index].answer;
    if (correct) q.score++;
    engine.recordWord(progress,q.questions[q.index].word.id,correct); save(); playSound(correct ? 'success' : 'wrong'); render();
  }
  function nextQuestion() {
    const q = ui.quiz; if (!q || q.answered === null) return;
    if (q.index < q.questions.length - 1) { q.index++; q.answered = null; q.response = ''; q.hintUsed = false; q.eliminated = []; render(true); }
    else {
      engine.recordQuiz(progress,q.score,q.questions.length,q.mode);
      if (q.mode === 'boss' && q.score >= 12) { progress.bossWins++; progress.coins += 80; }
      save();
      ui.result = {title:q.score === q.questions.length ? 'A perfect quest!' : 'Challenge complete!',
        description:q.mode === 'boss' && q.score >= 12 ? `You defeated the word boss and earned 80 bonus gems!` : `You answered ${q.score} out of ${q.questions.length} correctly. Keep practicing — every word counts!`,
        icon:q.mode === 'boss' && q.score >= 12 ? '👑' : q.score === q.questions.length ? '🏆' : '🎉',score:q.score,total:q.questions.length,mode:q.mode};
      go('result'); celebrate(); playSound('reward');
    }
  }
  function matchPick(side,id) {
    const game = ui.match; if (!game || game.matched.includes(id)) return;
    if (side === 'term') game.selectedTerm = id; else game.selectedMeaning = id;
    if (game.selectedTerm && game.selectedMeaning) {
      game.attempts++;
      if (game.selectedTerm === game.selectedMeaning) {
        game.matched.push(id);
        engine.recordWord(progress,id,true); save();
        if (game.matched.length === 5) {
          progress.completedMatches++; engine.award(progress,30); save();
          ui.result = { title:'Perfectly paired!',description:'You found all five pairs. Your memory is getting sharper!',icon:'🧩',score:5,total:5,mode:'match' };
          go('result'); celebrate(); playSound('reward'); return;
        }
      } else toast('Not quite — try another pair! 💪');
      game.selectedTerm = null; game.selectedMeaning = null;
    }
    render();
  }
  function favorite(id) {
    if (!byId.has(id)) return;
    if (progress.favorites.includes(id)) progress.favorites = progress.favorites.filter(x => x !== id);
    else { progress.favorites.push(id); engine.recordFavorite(progress); playSound('success'); }
    save(); render();
  }
  function useHint(type) {
    const q = ui.quiz;
    if (!q || q.answered !== null || q.hintUsed) return;
    const cost = type === 'spell' ? 8 : 15;
    if (progress.coins < cost) { toast('Collect more gems from your daily quests!'); return; }
    progress.coins -= cost; progress.hintsUsed++;
    q.hintUsed = true;
    if (type === 'choice') {
      const question = q.questions[q.index];
      q.eliminated = question.options.filter(option => option !== question.answer).slice(0,2);
    }
    save(); playSound('success'); render();
  }
  function speak(id) {
    const word = byId.get(id); if (!word) return;
    try {
      if (window.VocabularyNative?.speak) window.VocabularyNative.speak(word.term);
      else if ('speechSynthesis' in window) { speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(word.term); utterance.lang = 'en-US'; utterance.rate = .85; speechSynthesis.speak(utterance); }
      else toast('Speech is not available on this device.');
    } catch (_) { toast('Speech is not available on this device.'); }
  }
  function back() {
    if (['lesson','lesson-finish'].includes(ui.screen)) { go('learn'); return true; }
    if (['quiz','spell','match','result'].includes(ui.screen)) { go('practice'); return true; }
    if (ui.screen !== 'home') { go('home'); return true; }
    return false;
  }
  document.addEventListener('click', event => {
    const target = event.target.closest('[data-action]'); if (!target) return;
    const action = target.dataset.action, id = target.dataset.id;
    switch (action) {
      case 'onboard-goal': {
        ui.onboardName = document.getElementById('welcome-name')?.value || ui.onboardName;
        ui.onboardGoal = Number(target.dataset.count); render(); break;
      }
      case 'finish-onboard': {
        const name = document.getElementById('welcome-name')?.value.trim();
        if (!name) { toast('Lumi needs to know your explorer name! 🦊'); return; }
        progress.name = name.slice(0,24); progress.dailyGoal = ui.onboardGoal;
        progress.onboarded = true; save(); go('home'); celebrate(); playSound('reward'); break;
      }
      case 'nav': go(target.dataset.to); break;
      case 'back': back(); break;
      case 'learn-view': ui.learnView = target.dataset.view; render(); break;
      case 'open-lesson': openLesson(id); break;
      case 'flip': ui.flipped = !ui.flipped; render(); break;
      case 'study': study(target.dataset.known === 'yes'); break;
      case 'favorite': favorite(id); break;
      case 'speak': speak(id); break;
      case 'start-quiz': startQuiz(target.dataset.mode, id); break;
      case 'quiz-hint': useHint('choice'); break;
      case 'spell-hint': useHint('spell'); break;
      case 'answer': answer(Number(target.dataset.index)); break;
      case 'next-question': nextQuestion(); break;
      case 'check-spelling': checkSpelling(); break;
      case 'start-match': startMatch(); break;
      case 'match-pick': matchPick(target.dataset.side,id); break;
      case 'filter': ui.collectionFilter = id; render(); break;
      case 'claim-mission': {
        if (engine.claimMission(progress,id)) { save(); render(); celebrate(); playSound('reward'); toast('Treasure claimed! 💎'); }
        break;
      }
      case 'daily-goal': progress.dailyGoal = Number(target.dataset.count); save(); render(); break;
      case 'toggle-sound': progress.sound = !progress.sound; save(); render(); break;
      case 'toggle-motion': progress.reduceMotion = !progress.reduceMotion; save(); render(); break;
      case 'save-name': {
        const input = document.getElementById('name-field');
        const name = input?.value.trim().slice(0,24);
        if (!name) { toast('Please enter a name.'); return; }
        progress.name = name; save(); render(); toast('Name saved! ✨'); break;
      }
      default: break;
    }
  });
  document.addEventListener('input', event => {
    if (event.target.id === 'welcome-name') ui.onboardName = event.target.value;
    if (event.target.id === 'collection-search') {
      ui.collectionQuery = event.target.value;
      const result = document.getElementById('collection-results');
      if (result) result.innerHTML = collectionRows();
    }
    if (event.target.dataset.role === 'spell-input' && ui.quiz) ui.quiz.response = event.target.value;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' && event.target.dataset.role === 'spell-input') checkSpelling();
  });
  window.VQ = {back, go, getProgress:() => ({...progress})};
  render();
})();
