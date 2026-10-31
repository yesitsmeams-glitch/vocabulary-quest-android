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
  const ui = { screen: 'home', lessonId: lessons[0].id, index: 0,
    flipped: false, quiz: null, result: null, match: null,
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
      <div class="sidebar-card"><span class="mascot">🦊</span><strong>Hey, word wizard!</strong><p>Every new word is a little superpower. Keep collecting them!</p><button class="btn btn-primary btn-full" data-action="start-quiz" data-mode="choice">Quick challenge ⚡</button></div>
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
  function home() {
    const learned = Object.keys(progress.wordStats).length;
    const daily = Math.min(todayCount(), progress.dailyGoal);
    const next = lessons.find(l => countSeen(l) < l.words.length) || lessons[0];
    const featured = [...lessons].sort((a,b) => (countSeen(b) > 0 ? 1 : 0) - (countSeen(a) > 0 ? 1 : 0)).slice(0,6);
    return `<section class="hero"><div class="hero-copy"><span class="hero-tag">✨ YOUR DAILY ADVENTURE</span><h2>Unlock a world<br>of wonderful words!</h2><p>Turn tiny discoveries into big achievements. Your next quest is ready.</p><button class="btn btn-white" data-action="open-lesson" data-id="${next.id}">Continue learning <span>→</span></button></div>
      <div class="hero-art" aria-hidden="true"><div class="hero-orb">📚</div><span class="spark one">⭐</span><span class="spark two">💫</span><span class="spark three">✨</span></div></section>
      <div class="content-grid"><div class="surface"><div class="goal-intro"><strong>🎯 Today's word mission</strong><span>${daily} / ${progress.dailyGoal} words</span></div>
        ${progressBar(daily, progress.dailyGoal)}<p class="daily-motivation">${daily >= progress.dailyGoal ? 'Amazing! You completed your daily mission. 🎉' : `${progress.dailyGoal - daily} more discoveries to complete your mission!`}</p>
        <div class="mini-grid"><div class="mini-stat"><span>📖</span><strong>${learned}</strong><small>DISCOVERED</small></div><div class="mini-stat"><span>⭐</span><strong>${progress.xp}</strong><small>TOTAL XP</small></div><div class="mini-stat"><span>🏆</span><strong>${mastered()}</strong><small>MASTERED</small></div></div>
        </div><div class="surface challenge-card"><span class="eyebrow" style="color:#e18c29">DAILY BOOST</span><h3>Brain training,<br>but make it fun!</h3><p>${due().length ? `${due().length} words are ready for a smart review.` : 'Try a quick challenge and earn shiny gems.'}</p><button class="btn btn-primary mt-2" data-action="start-quiz" data-mode="${due().length ? 'review':'choice'}">${due().length ? 'Review now' : 'Start a quiz'} →</button></div></div>
      <div class="section-heading"><div><h2>🗺️ Explore your worlds</h2><p>Choose a place to discover new words</p></div><button class="section-link" data-action="nav" data-to="learn">See all worlds →</button></div>
      <div class="lesson-grid">${featured.map(lessonCard).join('')}</div>`;
  }
  function learn() {
    return `<div class="page-heading"><div class="eyebrow">15 WORLDS · ${words.length} WORDS</div><h1>Choose your next adventure 🗺️</h1><p>Tap a world, flip the cards, and grow your vocabulary one discovery at a time.</p></div>
      <div class="lesson-grid">${lessons.map(lessonCard).join('')}</div>`;
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
      </div><div class="section-heading"><div><h2>🎁 Challenge rewards</h2><p>Every attempt helps you learn</p></div></div>
      <div class="surface"><div class="mini-grid"><div class="mini-stat"><span>🏆</span><strong>${progress.quizzesWon}</strong><small>QUIZZES</small></div><div class="mini-stat"><span>🎯</span><strong>${progress.perfectQuizzes}</strong><small>PERFECT</small></div><div class="mini-stat"><span>🧩</span><strong>${progress.completedMatches}</strong><small>MATCHES</small></div></div></div>`;
  }
  function startQuiz(mode, lessonId) {
    const lessonWords = lessonId ? lessonById(lessonId).words : words;
    const candidates = mode === 'review' ? (engine.dueWords(progress, lessonWords).length ? engine.dueWords(progress,lessonWords) : lessonWords.filter(w => wordSeen(w.id))) : lessonWords;
    const source = candidates.length ? candidates : lessonWords;
    const questions = mode === 'spell' ? engine.shuffle(source).slice(0, 8).map(word => ({word,answer:word.term})) : engine.makeQuiz(source, words, 10);
    ui.quiz = { mode, questions, index: 0, score: 0, answered: null, response: '' };
    ui.screen = mode === 'spell' ? 'spell' : 'quiz';
    render(true);
  }
  function quiz() {
    const q = ui.quiz, question = q.questions[q.index];
    const answered = q.answered !== null;
    const correct = q.answered === question.answer;
    return `<div class="lesson-stage">${stageHeader(q.mode === 'review' ? 'Smart Review' : 'Quick Quiz', `⭐ ${q.score} correct so far`, q.index + 1, q.questions.length)}
      <div class="quiz-prompt"><span class="small">WHAT DOES THIS WORD MEAN?</span><h2>${esc(question.word.term)}</h2><button class="speaker" data-action="speak" data-id="${esc(question.word.id)}" aria-label="Hear the word">🔊</button></div>
      <div class="quiz-options">${question.options.map((option,i) => `<button class="answer ${answered ? (option === question.answer ? 'correct' : (option === q.answered ? 'wrong' : '')) : ''}" data-action="answer" data-index="${i}" ${answered ? 'disabled' : ''}><span style="color:#b5a9e3;margin-right:8px">${'ABCD'[i]}.</span>${esc(option)}</button>`).join('')}</div>
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
      ${answered ? `<div class="feedback ${correct ? '' : 'wrong'}">${correct ? '🎉 Perfect spelling!' : `💡 Correct spelling: ${esc(question.answer)}`}${nextQuestionButton(q)}</div>` : '<button class="btn btn-primary btn-full btn-large mt-3" data-action="check-spelling">Check spelling ✓</button>'}</div>`;
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
    return `<div class="page-heading"><div class="eyebrow">THE EXPLORER'S CORNER</div><h1>My Adventure Profile 👤</h1><p>Every step forward deserves to be celebrated.</p></div>
      <div class="level-banner"><div><span class="hero-tag">LEVEL ${engine.level(progress.xp)} EXPLORER</span><h2>You've earned ${progress.xp} XP!</h2><p>${mastered()} words mastered · ${currentStreak()} day streak · ${progress.coins} gems</p></div><div class="level-art">🏆</div></div>
      <div class="section-heading"><div><h2>✨ Your achievements</h2><p>${badges.filter(b => b.earned).length} of ${badges.length} badges unlocked</p></div></div><div class="badge-grid">${badges.map(b => `<div class="badge-card ${b.earned ? '' : 'locked'}"><span class="big">${b.icon}</span><h3>${esc(b.title)}</h3><p>${esc(b.description)}</p></div>`).join('')}</div>
      <div class="section-heading"><h2>⚙️ My settings</h2></div><div class="surface"><label class="strong" for="name-field">Explorer name</label><div class="section-tools mt-2 mb-0"><input id="name-field" class="search" style="flex:1;min-width:0" maxlength="24" value="${esc(progress.name)}" /><button class="btn btn-primary" data-action="save-name">Save</button></div><p class="small muted mt-3 mb-0">Your name and learning progress stay on this device. No account required.</p></div>`;
  }
  function render(scroll = false) {
    const screens = {home,learn,lesson,'lesson-finish':lessonFinish,practice,quiz,spell:spelling,match, result, collection, profile};
    root.innerHTML = `<div class="shell">${sidebar()}<div class="workspace">${topbar()}<main id="main-content">${(screens[ui.screen] || home)()}</main></div></div>${bottomnav()}`;
    if (scroll) window.scrollTo({top:0,behavior:'instant'});
  }
  function go(name) { ui.screen = name; render(true); }
  function openLesson(id) { ui.lessonId = id; ui.index = 0; ui.flipped = false; go('lesson'); }
  function study(known) {
    const selected = lessonById(ui.lessonId), word = selected.words[ui.index];
    engine.recordWord(progress,word.id,known); save();
    if (ui.index < selected.words.length - 1) { ui.index++; ui.flipped = false; render(); }
    else {
      if (!progress.lessonFinishes[selected.id]) { progress.lessonFinishes[selected.id] = true; engine.award(progress,30); save(); }
      go('lesson-finish');
    }
  }
  function answer(optionIndex) {
    const q = ui.quiz; if (!q || q.answered !== null) return;
    const question = q.questions[q.index]; const value = question.options[optionIndex];
    if (value === undefined) return;
    q.answered = value; const correct = value === question.answer;
    if (correct) q.score++;
    engine.recordWord(progress,question.word.id,correct); save(); render();
  }
  function checkSpelling() {
    const q = ui.quiz; if (!q || q.answered !== null) return;
    const input = document.querySelector('[data-role="spell-input"]');
    const typed = input ? input.value.trim() : q.response.trim();
    if (!typed) { toast('Try typing a word first ✏️'); return; }
    q.response = typed; q.answered = typed.toLowerCase() === q.questions[q.index].answer.toLowerCase() ? q.questions[q.index].answer : typed;
    const correct = q.answered === q.questions[q.index].answer;
    if (correct) q.score++;
    engine.recordWord(progress,q.questions[q.index].word.id,correct); save(); render();
  }
  function nextQuestion() {
    const q = ui.quiz; if (!q || q.answered === null) return;
    if (q.index < q.questions.length - 1) { q.index++; q.answered = null; q.response = ''; render(true); }
    else {
      progress.quizzesWon++;
      if (q.score === q.questions.length) progress.perfectQuizzes++;
      if (q.mode === 'spell') progress.completedSpelling++;
      engine.award(progress,20); save();
      ui.result = {title:q.score === q.questions.length ? 'A perfect quest!' : 'Challenge complete!',
        description:`You answered ${q.score} out of ${q.questions.length} correctly. Keep practicing — every word counts!`,
        icon:q.score === q.questions.length ? '🏆' : '🎉',score:q.score,total:q.questions.length,mode:q.mode};
      go('result');
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
          go('result'); return;
        }
      } else toast('Not quite — try another pair! 💪');
      game.selectedTerm = null; game.selectedMeaning = null;
    }
    render();
  }
  function favorite(id) {
    if (!byId.has(id)) return;
    if (progress.favorites.includes(id)) progress.favorites = progress.favorites.filter(x => x !== id);
    else progress.favorites.push(id);
    save(); render();
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
      case 'nav': go(target.dataset.to); break;
      case 'back': back(); break;
      case 'open-lesson': openLesson(id); break;
      case 'flip': ui.flipped = !ui.flipped; render(); break;
      case 'study': study(target.dataset.known === 'yes'); break;
      case 'favorite': favorite(id); break;
      case 'speak': speak(id); break;
      case 'start-quiz': startQuiz(target.dataset.mode, id); break;
      case 'answer': answer(Number(target.dataset.index)); break;
      case 'next-question': nextQuestion(); break;
      case 'check-spelling': checkSpelling(); break;
      case 'start-match': startMatch(); break;
      case 'match-pick': matchPick(target.dataset.side,id); break;
      case 'filter': ui.collectionFilter = id; render(); break;
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
