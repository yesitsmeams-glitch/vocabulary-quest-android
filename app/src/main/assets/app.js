(function () {
  'use strict';
  const bonusLessons = window.VQ_LESSONS;
  const curriculumLessons = window.VQ_CURRICULUM || [];
  const lessons = [...curriculumLessons, ...bonusLessons];
  const levels = ['A1','A2','B1','B2','C1','C2'];
  const worldMeta = {
    A1:{name:'Sunny Village',subtitle:'Where every adventure begins',icon:'🏡',colors:['#ffbb65','#f57773'],landmark:'🌻'},
    A2:{name:'Emerald Forest',subtitle:'A thousand little discoveries',icon:'🌳',colors:['#69d7aa','#1bafa2'],landmark:'🦋'},
    B1:{name:'Discovery City',subtitle:'A world full of curious minds',icon:'🏙️',colors:['#8cc8ff','#6883ee'],landmark:'🚀'},
    B2:{name:'Mystery Isles',subtitle:'Brave words for bold explorers',icon:'🏝️',colors:['#c2a3ff','#9065d9'],landmark:'🧜'},
    C1:{name:'Idea Observatory',subtitle:'Look beyond the ordinary',icon:'🔭',colors:['#ffc77d','#e78b83'],landmark:'🌠'},
    C2:{name:'Celestial Library',subtitle:'Unlock the universe of language',icon:'🌌',colors:['#ac95f2','#6f6ccf'],landmark:'🪐'}
  };
  const districtNames = ['Welcome Gate','Wonder Gardens','Puzzle Plaza','Story Harbor','Skyward Trail','The Grand Summit'];
  const engine = window.VQEngine;
  const words = engine.allWords(lessons);
  const byId = new Map(words.map(word => [word.id, word]));
  const lessonMap = new Map(lessons.map(lesson => [lesson.id, lesson]));
  const storageKey = 'vocabulary-quest-progress-v1';
  const root = document.getElementById('app');
  let progress;
  try { progress = engine.normalizeProgress(JSON.parse(localStorage.getItem(storageKey))); }
  catch (_) { progress = engine.defaultProgress(); }
  const ui = { screen: progress.onboarded ? 'home' : 'welcome', lessonId: lessons[0].id, index: 0,
    flipped: false, quiz: null, result: null, match: null, picture: null, mystery: null, storyRevealed: true,
    learnView: 'path', exploreMode: 'worlds', curriculumLevel: 'A1', district: 0,
    onboardGoal: 10, onboardName: '',
    collectionQuery: '', collectionFilter: 'all', collectionLevel: 'all', collectionLimit: 60,
    toast: '', toastTimeout: 0 };
  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(progress)); }
    catch (_) { toast('Your device could not save progress. Check available storage.'); }
  }
  function lessonById(id) { return lessonMap.get(id) || lessons[0]; }
  function wordArt(word, className = 'vocab-art', secret = false) {
    if (!word.level || !word.number) return '';
    const index = (word.number - 1) % 25;
    const set = String(Math.ceil(word.number / 25)).padStart(2,'0');
    return `<span class="${className}" role="img" aria-label="${secret ? 'Hidden picture clue' : `Illustration: ${esc(word.term)}`}" style="background-image:url('illustrations/${word.level.toLowerCase()}-${set}.webp');background-position:-${(index%5)*72}px -${Math.floor(index/5)*72}px"></span>`;
  }
  function storyHighlights(paragraph, lesson) {
    const dictionary = new Map(lesson.words.map(w => [w.term.toLowerCase(),w]));
    const terms = [...dictionary.keys()].sort((a,b)=>b.length-a.length)
      .map(t => t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
    const pattern = new RegExp(`\\b(${terms.join('|')})\\b`,'gi');
    let out = '', position = 0, match;
    while ((match = pattern.exec(paragraph)) !== null) {
      out += esc(paragraph.slice(position,match.index));
      const word = dictionary.get(match[0].toLowerCase());
      out += `<button class="inline-vocab" data-action="show-word" data-id="${esc(word.id)}">${esc(match[0])}</button>`;
      position = match.index + match[0].length;
    }
    return out + esc(paragraph.slice(position));
  }
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
    const active = ui.screen === name || (name === 'learn' && ['lesson','lesson-finish','story','story-finish'].includes(ui.screen)) ||
      (name === 'practice' && ['quiz','spell','match','picture','mystery','result'].includes(ui.screen));
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
      const active = ui.screen === name || (name === 'learn' && ['lesson','lesson-finish','story','story-finish'].includes(ui.screen)) || (name === 'practice' && ['quiz','spell','match','picture','mystery','result'].includes(ui.screen));
      return `<button aria-label="${label}" ${active ? 'aria-current="page"' : ''} class="${active ? 'active':''}" data-action="nav" data-to="${name}"><span>${icon}</span>${label}</button>`;
    }).join('')}</nav>`;
  }
  function progressBar(n, total, mint = false) { return `<div class="progress-track"><div class="progress-fill ${mint ? 'mint' : ''}" style="width:${percent(n,total)}%"></div></div>`; }
  function lessonCard(lesson) {
    const seen = countSeen(lesson);
    return `<article class="lesson-card" style="--accent:${lesson.color}"><button class="lesson-card-main" data-action="open-lesson" data-id="${lesson.id}" aria-label="Study words: ${esc(lesson.title)}">
      <div class="lesson-illustration"><span>${lesson.emoji}</span></div><div class="lesson-card-info"><h3>${esc(lesson.title)}</h3><p>${esc(lesson.subtitle)}</p>
      <div class="lesson-footer"><span>${lesson.words.length} words</span><strong>${seen === lesson.words.length ? '✓ Complete' : `${seen}/${lesson.words.length} discovered`}</strong></div>
      <div class="lesson-bar"><i style="width:${percent(seen,lesson.words.length)}%"></i></div></div></button>${lesson.story ? `<button class="lesson-read-button" data-action="open-story" data-id="${lesson.id}">📖 ${progress.storyFinishes[lesson.id] ? 'Read again ✓' : 'Read the story'} <span>→</span></button>` : ''}</article>`;
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
      <div class="mystery-spotlight"><div class="mystery-spotlight-icon">🗝️</div><div><span class="eyebrow">A NEW SECRET EVERY DAY</span><h2>${progress.mysteryWins[`${engine.dayKey()}:${ui.curriculumLevel}`] ? 'Another mystery solved! ✨' : 'Lumi found a mysterious clue…'}</h2><p>Three hidden clues. One secret word. ${progress.mysteryWins[`${engine.dayKey()}:${ui.curriculumLevel}`] ? "Replay today's puzzle or explore another level." : 'Unlock your daily treasure for 70 XP!'}</p></div><button class="btn btn-white" data-action="start-mystery">${progress.mysteryWins[`${engine.dayKey()}:${ui.curriculumLevel}`] ? 'Play again ↻' : 'Solve the mystery →'}</button></div>
      <div class="section-heading"><div><h2>🎁 Daily treasure quests</h2><p>Complete little missions and collect gems</p></div><span class="quest-reset">Resets every day ✨</span></div>
      <div class="mission-grid">${engine.missionState(progress).map(m => `<div class="mission-card"><span class="mission-icon">${m.icon}</span><div class="mission-copy"><h3>${esc(m.title)}</h3><p>${esc(m.detail)}</p><div class="mission-line">${progressBar(m.current,m.target,true)}<small>${m.current}/${m.target}</small></div></div><button class="mission-reward ${m.claimed ? 'claimed' : ''}" data-action="claim-mission" data-id="${m.id}" ${m.claimed || m.current < m.target ? 'disabled' : ''}>${m.claimed ? '✓ Claimed' : `💎 ${m.gems}`}</button></div>`).join('')}</div>
      <div class="section-heading"><div><h2>🗺️ Explore your worlds</h2><p>Choose a place to discover new words</p></div><button class="section-link" data-action="worlds-overview">See world atlas →</button></div>
      <div class="lesson-grid">${featured.map(lessonCard).join('')}</div>`;
  }
  function worldAtlas() {
    const seen = Object.keys(progress.wordStats).length;
    return `<div class="atlas-intro"><span class="hero-tag">🗺️ THE LIVING WORLD ATLAS</span><h1>Six incredible worlds.<br>One brilliant explorer.</h1><p>Choose a destination, travel through six districts, and unlock stories and vocabulary treasures. Every illustration comes from your original learning books.</p><div class="atlas-stats"><span>🌍 6 living worlds</span><span>📚 216 adventures</span><span>✨ ${seen.toLocaleString()} words discovered</span></div><img src="lumi-mascot.webp" alt="Lumi the fox points toward your next adventure"></div>
    <div class="world-grid">${levels.map((level,i) => {
      const meta = worldMeta[level], chapters = curriculumLessons.filter(l => l.level === level);
      const seenWords = chapters.reduce((sum,lesson)=>sum+countSeen(lesson),0);
      const completed = chapters.filter(lesson=>progress.lessonFinishes[lesson.id]).length;
      const samples = [chapters[0].words[1],chapters[12].words[9],chapters[27].words[19]];
      return `<button class="world-card" data-action="enter-world" data-level="${level}" style="--world-a:${meta.colors[0]};--world-b:${meta.colors[1]}"><span class="world-card-number">REGION ${String(i+1).padStart(2,'0')} · ${level}</span><span class="world-landmark" aria-hidden="true">${meta.landmark}</span><span class="world-symbol" aria-hidden="true">${meta.icon}</span><span class="world-title">${meta.name}</span><span class="world-subtitle">${meta.subtitle}</span><span class="world-art-row">${samples.map(w=>wordArt(w,'world-tile')).join('')}</span><span class="world-card-bottom"><span>${seenWords} / 900 words · ${completed}/36 adventures</span><strong>${percent(seenWords,900)}% explored ↗</strong></span><span class="world-meter"><i style="width:${percent(seenWords,900)}%"></i></span></button>`;
    }).join('')}</div><div class="atlas-footer"><div><strong>🎁 Bonus Collection</strong><p>15 more themed lessons and 150 extra words.</p></div><button class="btn btn-outline" data-action="choose-bonus">Visit bonus worlds →</button></div>`;
  }
  function learn() {
    if (ui.exploreMode === 'worlds') return worldAtlas();
    const shown = ui.exploreMode === 'bonus' ? bonusLessons : curriculumLessons.filter(l => l.level === ui.curriculumLevel);
    const finished = shown.filter(lesson => progress.lessonFinishes[lesson.id]).length;
    const total = shown.reduce((sum, lesson) => sum + lesson.words.length, 0);
    const world = worldMeta[ui.curriculumLevel];
    const districts = Array.from({length:6},(_,i)=>shown.slice(i*6,i*6+6));
    const visible = ui.exploreMode === 'bonus' ? shown : districts[ui.district];
    return `<button class="atlas-back" data-action="worlds-overview">← Return to World Atlas</button><div class="page-heading"><div class="eyebrow">${curriculumLessons.length} READING ADVENTURES · ${words.length.toLocaleString()} VOCABULARY ENTRIES</div><h1>${ui.exploreMode === 'bonus' ? '🎁 Bonus Adventures' : `${world.icon} ${world.name}`}</h1><p>${ui.exploreMode === 'bonus' ? 'Explore extra themed words beyond the six core worlds.' : `${world.subtitle}. Journey through all six districts, 36 story adventures and 900 illustrated words.`}</p></div>
      <div class="level-picker" role="group" aria-label="Choose English difficulty level">
        ${levels.map(level => `<button class="level-choice ${ui.exploreMode === 'curriculum' && ui.curriculumLevel === level ? 'active' : ''}" data-action="choose-level" data-level="${level}"><strong>${level}</strong><small>900 words</small></button>`).join('')}
        <button class="level-choice ${ui.exploreMode === 'bonus' ? 'active' : ''}" data-action="choose-bonus"><strong>🎁 Bonus</strong><small>150 words</small></button>
      </div><div class="missing-level-note">🎉 Complete collection: 5,400 numbered vocabulary entries across six levels. The first source book is labeled “Pre-A1” and serves as the A1 foundation.</div>
      <div class="explore-banner"><div><span class="eyebrow">${ui.exploreMode === 'bonus' ? 'BONUS WORD WORLDS' : `${ui.curriculumLevel} · 36 READING ADVENTURES`}</span><h2>${finished} of ${shown.length} adventures explored</h2><p>${total.toLocaleString()} words in this collection · Arabic meanings and story examples in every level.</p>${progressBar(finished,shown.length)}</div><img src="lumi-mascot.webp" alt="Lumi is excited for your journey" /></div>
      ${ui.exploreMode === 'bonus' ? '' : `<div class="section-heading"><div><h2>🧭 Choose a district</h2><p>Six neighborhoods, each with six story adventures</p></div></div><div class="district-map" role="group" aria-label="Choose world district">${districts.map((district,i)=>{const complete = district.filter(l=>progress.lessonFinishes[l.id]).length;return `<button class="district-stop ${ui.district === i ? 'selected' : ''}" data-action="choose-district" data-index="${i}"><span class="district-number">${['🚪','🌷','🧩','⛵','☁️','🏆'][i]}</span><strong>${districtNames[i]}</strong><small>${complete}/6 stories explored</small></button>`;}).join('')}</div>`}
      <div class="district-toolbar"><h2>${ui.exploreMode === 'bonus' ? 'Bonus collection' : `${districtNames[ui.district]} · Adventures ${ui.district*6+1}–${ui.district*6+6}`}</h2><div class="view-switch" role="group" aria-label="Choose learning view"><button class="${ui.learnView === 'path' ? 'active' : ''}" data-action="learn-view" data-view="path">🧭 Path</button><button class="${ui.learnView === 'grid' ? 'active' : ''}" data-action="learn-view" data-view="grid">▦ Cards</button></div></div>
      ${ui.learnView === 'grid' ? `<div class="lesson-grid">${visible.map(lessonCard).join('')}</div>` : `<div class="quest-path"><div class="quest-trail"></div>${visible.map((lesson,i) => {
        const completed = Boolean(progress.lessonFinishes[lesson.id]);
        const seen = countSeen(lesson);
        return `<div class="path-stop ${i % 2 ? 'right' : 'left'}"><button class="path-orb ${completed ? 'done' : ''}" style="--accent:${lesson.color}" data-action="open-lesson" data-id="${lesson.id}" aria-label="Open ${esc(lesson.title)}"><span>${lesson.emoji}</span>${completed ? '<i>✓</i>' : ''}</button><button class="path-card" data-action="open-lesson" data-id="${lesson.id}"><small>ADVENTURE ${String(ui.exploreMode === 'bonus' ? i+1 : ui.district*6+i+1).padStart(2,'0')} ${completed ? '· COMPLETED ⭐' : seen ? '· IN PROGRESS' : '· READY TO EXPLORE'}</small><strong>${esc(lesson.title)}</strong><span>${esc(lesson.subtitle)}</span><div class="path-card-footer">${seen} / ${lesson.words.length} words <b>${completed ? 'Replay ↻' : 'Explore →'}</b></div></button></div>`;
      }).join('')}</div>`}
      ${ui.exploreMode !== 'bonus' && ui.district < 5 ? `<button class="btn btn-outline btn-full mt-3" data-action="choose-district" data-index="${ui.district+1}">Continue to ${districtNames[ui.district+1]} →</button>` : ''}`;
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
        <span class="card-orb">${word.level ? wordArt(word) : ui.flipped ? '💡' : current.emoji}</span>
        ${ui.flipped ? `<span class="word-type">${word.level ? 'ARABIC MEANING' : 'THE MEANING'}</span><p class="definition" dir="auto">${esc(word.meaning)}</p>${word.example ? `<p class="example" dir="auto">“${esc(word.example)}”</p>` : ''}` : `<h2>${esc(word.term)}</h2><span class="word-type">TAP TO DISCOVER</span>`}
      </button><div class="lesson-actions">
        <button class="btn btn-outline" data-action="speak" data-id="${esc(word.id)}">🔊 Listen</button>
        <button class="btn btn-outline" data-action="speak-slow" data-id="${esc(word.id)}">🐢 Slow pronunciation</button>
      </div><div class="lesson-actions">
        <button class="btn btn-outline" data-action="favorite" data-id="${esc(word.id)}">${fav ? '❤️ Saved' : '🤍 Save word'}</button>
        ${current.story ? `<button class="btn btn-outline" data-action="open-story" data-id="${current.id}">📖 Read the story</button>` : '<span></span>'}
      </div><div class="lesson-actions mt-2">
        <button class="btn btn-soft btn-large" data-action="study" data-known="no">🔁 Practice again</button>
        <button class="btn btn-success btn-large" data-action="study" data-known="yes">Got it! ✓</button>
      </div><p class="center muted small mt-3">+10 XP for every word you know · Your progress saves automatically</p></div>`;
  }
  function lessonFinish() {
    const current = lessonById(ui.lessonId);
    return finish('World explored!', `${current.title} is complete. Your brain just grew a little stronger.`,current.emoji,[
      ['📚',current.words.length,'WORDS'],['🏅','+30','BONUS XP']
    ], `${current.story ? `<button class="btn btn-primary btn-large btn-full" data-action="open-story" data-id="${current.id}">Read the illustrated story 📖</button>` : ''}<button class="btn btn-outline btn-large btn-full mt-2" data-action="start-quiz" data-mode="choice" data-id="${current.id}">Test your knowledge ⚡</button><button class="btn btn-outline btn-large btn-full mt-2" data-action="nav" data-to="learn">Explore another world →</button>`);
  }
  function story() {
    const current = lessonById(ui.lessonId), reading = current.story;
    const responses = progress.storyResponses[current.id] || {};
    const answered = reading.questions.filter((_,i) => (responses[i] || '').trim().length >= 3).length;
    const done = Boolean(progress.storyFinishes[current.id]);
    return `<div class="reading-page">${stageHeader(reading.title,`${current.level} · Reading adventure · ${current.words.length} illustrated words`,answered,4)}
      <div class="reading-hero"><span class="hero-tag">📖 LUMI'S STORY LIBRARY</span><h1>${esc(reading.title)}</h1><p>Read, discover, listen, and tell us what you think.</p></div>
      <div class="reading-toolbar"><button class="btn btn-outline" data-action="speak-story" data-speed="normal">🔊 Listen to story</button><button class="btn btn-outline" data-action="speak-story" data-speed="slow">🐢 Play slower</button><button class="btn btn-outline" data-action="stop-speech">■ Stop</button></div>
      <div class="surface reading-surface"><div class="section-heading"><div><span class="eyebrow">STORY ${String(current.set).padStart(2,'0')}</span><h2>Let's read together</h2><p>Tap highlighted words to see their Arabic meanings.</p></div></div>
        ${reading.paragraphs.map(p => `<p class="story-paragraph">${storyHighlights(p,current)}</p>`).join('')}
        <div class="vocab-preview">${current.words.slice(0,5).map(w => `<button class="vocab-preview-card" data-action="show-word" data-id="${esc(w.id)}">${wordArt(w)}<strong>${esc(w.term)}</strong></button>`).join('')}</div>
      </div>
      <div class="surface story-questions"><span class="eyebrow">READ & RESPOND</span><h2>Think about the story 💭</h2><p class="muted small">Write your own answers. This is a reflection exercise, not an automatically graded test. Your responses save on this device.</p>
        ${reading.questions.map((question,i) => `<label class="story-question" for="story-answer-${i}"><strong><span>${i+1}</span> ${esc(question)}</strong><textarea id="story-answer-${i}" data-role="story-answer" data-index="${i}" rows="2" placeholder="Write your answer here...">${esc(responses[i] || '')}</textarea></label>`).join('')}
        <button class="btn ${done ? 'btn-outline' : 'btn-primary'} btn-large btn-full" data-action="finish-story">${done ? '✓ Story completed · Review answers' : 'Complete story · Earn 40 XP 🌟'}</button>
      </div></div>`;
  }
  function storyFinish() {
    const current = lessonById(ui.lessonId);
    return finish('Reading adventure complete!',`You explored ${current.story.title}, found new words, and reflected on all four questions.`,'📚',[
      ['📖','1','STORY'],['💬','4','RESPONSES'],['✨','+40','XP FIRST TIME']
    ],`<button class="btn btn-primary btn-large btn-full" data-action="start-quiz" data-mode="choice" data-id="${current.id}">Quiz on these words ⚡</button><button class="btn btn-outline btn-large btn-full mt-2" data-action="nav" data-to="learn">Choose another adventure →</button>`);
  }
  function finishStory() {
    const current = lessonById(ui.lessonId);
    if (!current.story) return;
    const responses = progress.storyResponses[current.id] || {};
    if (current.story.questions.some((_,i) => (responses[i] || '').trim().length < 3)) {
      toast('Write a short answer to each of the four questions first ✏️'); return;
    }
    if (!progress.storyFinishes[current.id]) {
      progress.storyFinishes[current.id] = true;
      engine.award(progress,40);
      save(); playSound('reward'); celebrate();
    }
    go('story-finish');
  }
  function practice() {
    return `<div class="page-heading"><div class="eyebrow">MAKE KNOWLEDGE STICK</div><h1>The Practice Arcade ⚡</h1><p>Play short challenges, collect XP, and make every word unforgettable.</p></div>
      <div class="practice-grid">
        <button class="mode-card featured-mode" style="--mode-bg:#dff7ff" data-action="start-picture"><span class="mode-icon">🔍</span><span class="new-badge">NEW · IMAGE GAME</span><h3>Picture Detective</h3><p>Spot the right illustration among four clues in eight delightful rounds.</p><span class="arrow">↗</span></button>
        <button class="mode-card featured-mode" style="--mode-bg:#f3e7ff" data-action="start-mystery"><span class="mode-icon">🗝️</span><span class="new-badge">NEW · DAILY STORY</span><h3>Daily Mystery</h3><p>Decode the note, inspect a picture, and unlock the secret word for treasure.</p><span class="arrow">↗</span></button>
        <button class="mode-card" style="--mode-bg:#eee9ff" data-action="start-quiz" data-mode="choice"><span class="mode-icon">🧠</span><h3>Quick Quiz</h3><p>Choose the correct meaning and build your streak.</p><span class="arrow">↗</span></button>
        <button class="mode-card" style="--mode-bg:#e6fbf3" data-action="start-quiz" data-mode="review"><span class="mode-icon">🔁</span><h3>Smart Review</h3><p>${due().length ? `${due().length} words ready to revisit.` : 'A practice session until words are due.'}</p><span class="arrow">↗</span></button>
        <button class="mode-card" style="--mode-bg:#fff0df" data-action="start-quiz" data-mode="spell"><span class="mode-icon">✏️</span><h3>Spelling Bee</h3><p>Turn meanings into correctly spelled words.</p><span class="arrow">↗</span></button>
        <button class="mode-card" style="--mode-bg:#e7f4ff" data-action="start-quiz" data-mode="listen"><span class="mode-icon">🎧</span><h3>Listening Lab</h3><p>Hear a word at normal or slow speed, then type it.</p><span class="arrow">↗</span></button>
        <button class="mode-card" style="--mode-bg:#ffeaf1" data-action="start-match"><span class="mode-icon">🧩</span><h3>Match Mania</h3><p>Pair five words with their meanings as fast as you can.</p><span class="arrow">↗</span></button>
      </div><div class="boss-banner"><div class="boss-crown">👑</div><div><span class="eyebrow">THE ULTIMATE CHALLENGE</span><h2>Boss Battle</h2><p>15 tricky questions. Score 12 or more to claim an 80-gem crown reward!</p><button class="btn btn-white" data-action="start-quiz" data-mode="boss">Face the boss ⚡</button></div><span class="boss-dragon" aria-hidden="true">🐉</span></div>
      <div class="section-heading"><div><h2>🎁 Challenge rewards</h2><p>Every attempt helps you learn</p></div></div>
      <div class="surface"><div class="mini-grid"><div class="mini-stat"><span>🏆</span><strong>${progress.quizzesWon}</strong><small>QUIZZES</small></div><div class="mini-stat"><span>🎯</span><strong>${progress.perfectQuizzes}</strong><small>PERFECT</small></div><div class="mini-stat"><span>🧩</span><strong>${progress.completedMatches}</strong><small>MATCHES</small></div></div></div>`;
  }
  function startQuiz(mode, lessonId) {
    const lessonWords = lessonId ? lessonById(lessonId).words : ui.exploreMode === 'bonus'
      ? bonusLessons.flatMap(lesson => lesson.words)
      : curriculumLessons.filter(lesson => lesson.level === ui.curriculumLevel).flatMap(lesson => lesson.words);
    const candidates = mode === 'review' ? (engine.dueWords(progress, lessonWords).length ? engine.dueWords(progress,lessonWords) : lessonWords.filter(w => wordSeen(w.id))) : lessonWords;
    const source = candidates.length ? candidates : lessonWords;
    const questions = ['spell','listen'].includes(mode) ? engine.shuffle(source).slice(0, 8).map(word => ({word,answer:word.term})) : engine.makeQuiz(source, words, mode === 'boss' ? 15 : 10);
    ui.quiz = { mode, questions, index: 0, score: 0, answered: null, response: '', hintUsed: false, eliminated: [] };
    ui.screen = ['spell','listen'].includes(mode) ? 'spell' : 'quiz';
    render(true);
  }
  function quiz() {
    const q = ui.quiz, question = q.questions[q.index];
    const answered = q.answered !== null;
    const correct = q.answered === question.answer;
    return `<div class="lesson-stage">${stageHeader(q.mode === 'review' ? 'Smart Review' : q.mode === 'boss' ? '👑 Boss Battle' : 'Quick Quiz', `⭐ ${q.score} correct so far`, q.index + 1, q.questions.length)}
      <div class="quiz-prompt"><span class="small">WHAT DOES THIS WORD MEAN?</span><h2>${esc(question.word.term)}</h2><button class="speaker" data-action="speak" data-id="${esc(question.word.id)}" aria-label="Hear the word">🔊</button></div>
      <div class="quiz-options">${question.options.map((option,i) => `<button class="answer ${q.eliminated.includes(option) ? 'eliminated' : ''} ${answered ? (option === question.answer ? 'correct' : (option === q.answered ? 'wrong' : '')) : ''}" data-action="answer" data-index="${i}" ${answered || q.eliminated.includes(option) ? 'disabled' : ''}><span style="color:#b5a9e3;margin-right:8px">${'ABCD'[i]}.</span><bdi>${q.eliminated.includes(option) ? '— Eliminated —' : esc(option)}</bdi></button>`).join('')}</div>
      ${!answered ? `<div class="helper-row"><span>💎 ${progress.coins} gems</span><button class="hint-button" data-action="quiz-hint" ${q.hintUsed || progress.coins < 15 ? 'disabled' : ''}>${q.hintUsed ? '✨ Hint used' : '✨ Remove 2 answers · 15 gems'}</button></div>` : ''}
      ${answered ? `<div class="feedback ${correct ? '' : 'wrong'}">${correct ? '🎉 Brilliant! That is exactly right.' : `💡 Good try! The answer is: ${esc(question.answer)}`}${nextQuestionButton(q)}</div>` : '<p class="center muted small mt-3">Choose your answer. Every try makes you stronger!</p>'}</div>`;
  }
  function nextQuestionButton(q) { return `<button class="btn btn-primary btn-full" data-action="next-question">${q.index === q.questions.length - 1 ? 'See results 🎉' : 'Next question →'}</button>`; }
  function spelling() {
    const q = ui.quiz, question = q.questions[q.index];
    const answered = q.answered !== null;
    const correct = q.answered === question.answer;
    const listening = q.mode === 'listen';
    return `<div class="lesson-stage">${stageHeader(listening ? 'Listening Lab 🎧' : 'Spelling Bee', `✏️ ${q.score} correct so far`,q.index + 1,q.questions.length)}
      ${listening ? `<div class="quiz-prompt"><span class="small">LISTEN & TYPE THE ENGLISH WORD</span><h2>Hear it. Remember it. Spell it.</h2><div class="listen-buttons"><button class="btn btn-primary" data-action="speak" data-id="${esc(question.word.id)}">🔊 Play word</button><button class="btn btn-outline" data-action="speak-slow" data-id="${esc(question.word.id)}">🐢 Play slowly</button></div><p class="muted small">Use the audio buttons as often as you like. Headphones are optional.</p></div>` : `<div class="quiz-prompt"><span class="small">SPELL THE WORD THAT MEANS</span><h2 dir="auto" style="font-size:clamp(23px,4.2vw,33px)">${esc(question.word.meaning)}</h2><p class="muted" style="font-style:italic">${esc((question.word.example || '').replace(new RegExp(question.word.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),'ig'), '______'))}</p></div>`}
      <input type="text" autocapitalize="off" autocomplete="off" spellcheck="false" data-role="spell-input" class="search spelling-input" aria-label="Spell the word" placeholder="Type the word..." value="${esc(q.response)}" ${answered ? 'disabled' : ''}/>
      ${answered ? `<div class="feedback ${correct ? '' : 'wrong'}">${correct ? '🎉 Perfect spelling!' : `💡 Correct spelling: ${esc(question.answer)}`}${nextQuestionButton(q)}</div>` : `<div class="helper-row"><span>${q.hintUsed ? `💡 Starts with “${esc(question.answer[0].toUpperCase())}” · ${question.answer.length} letters` : `💎 ${progress.coins} gems`}</span><button class="hint-button" data-action="spell-hint" ${q.hintUsed || progress.coins < 8 ? 'disabled' : ''}>${q.hintUsed ? 'Hint used' : '✨ Letter hint · 8 gems'}</button></div><button class="btn btn-primary btn-full btn-large mt-3" data-action="check-spelling">Check spelling ✓</button>`}</div>`;
  }
  function startMatch() {
    const candidates = ui.exploreMode === 'bonus' ? bonusLessons.flatMap(l => l.words)
      : curriculumLessons.filter(l => l.level === ui.curriculumLevel).flatMap(l => l.words);
    const seenMeanings = new Set();
    const choices = engine.shuffle(candidates).filter(word => {
      if (seenMeanings.has(word.meaning)) return false;
      seenMeanings.add(word.meaning); return true;
    }).slice(0,5);
    ui.match = { words: choices, terms: engine.shuffle(choices), meanings: engine.shuffle(choices), selectedTerm: null, selectedMeaning: null, matched: [], attempts: 0 };
    ui.screen = 'match'; render(true);
  }
  function match() {
    const game = ui.match;
    const tile = (word, side) => `<button class="match-tile ${game.matched.includes(word.id) ? 'matched' : ''} ${game[side === 'term' ? 'selectedTerm' : 'selectedMeaning'] === word.id ? 'selected' : ''}" data-action="match-pick" data-side="${side}" data-id="${esc(word.id)}" ${game.matched.includes(word.id) ? 'disabled' : ''}><bdi>${esc(side === 'term' ? word.term : word.meaning)}</bdi></button>`;
    return `<div class="lesson-stage">${stageHeader('Match Mania', 'Pair each word with its meaning', game.matched.length, 5)}
      <div class="center"><span style="font-size:57px">🧩</span><h2>Find the perfect pairs</h2><p class="muted small">Select one word and one meaning to connect them!</p></div>
      <div class="match-grid mt-3"><div class="match-column">${game.terms.map(w => tile(w,'term')).join('')}</div><div class="match-column">${game.meanings.map(w => tile(w,'meaning')).join('')}</div></div><p class="center muted small mt-3">${game.matched.length}/5 pairs matched · ${game.attempts} attempts</p></div>`;
  }
  function levelWords(level = ui.curriculumLevel) {
    return curriculumLessons.filter(lesson => lesson.level === level).flatMap(lesson => lesson.words);
  }
  function startPicture() {
    const questions = engine.makePictureQuiz(levelWords(),8);
    if (!questions.length) { toast('Picture challenges are available in the six illustrated worlds.'); return; }
    ui.picture = {questions,index:0,score:0,answered:null}; go('picture');
  }
  function picture() {
    const game = ui.picture, q = game.questions[game.index];
    return `<div class="detective-stage">${stageHeader('🔍 Picture Detective',`${ui.curriculumLevel} · Find the matching artwork`,game.index+1,game.questions.length)}
      <div class="detective-head"><span class="eyebrow">THE PICTURE CASE FILE</span><h1>Which picture shows…</h1><strong>${esc(q.word.term)}</strong><p dir="auto">${esc(q.word.meaning)}</p><button class="speaker" data-action="speak" data-id="${esc(q.word.id)}" aria-label="Hear the mystery word">🔊 Hear the word</button></div>
      <div class="picture-grid">${q.options.map((option,i) => `<button class="picture-choice ${game.answered !== null ? option.id === q.word.id ? 'correct' : option.id === game.answered ? 'wrong' : 'dimmed' : ''}" data-action="picture-answer" data-id="${esc(option.id)}" aria-label="Picture ${'ABCD'[i]}${game.answered !== null ? `, ${esc(option.term)}` : ''}" ${game.answered !== null ? 'disabled' : ''}><span class="picture-letter">${'ABCD'[i]}</span>${wordArt(option,'detective-art',game.answered === null)}${game.answered !== null ? `<span class="picture-caption">${esc(option.term)}</span>` : '<span class="picture-caption">Mystery picture</span>'}${game.answered !== null && option.id === q.word.id ? '<span class="picture-check">✓</span>' : ''}</button>`).join('')}</div>
      ${game.answered !== null ? `<div class="feedback ${game.answered === q.word.id ? '' : 'wrong'}">${game.answered === q.word.id ? '✨ Excellent detective work! You found the clue.' : `💡 The correct picture represents “${esc(q.word.term)}”.`}<button class="btn btn-primary btn-full" data-action="next-picture">${game.index === game.questions.length-1 ? 'See detective results 🏆' : 'Next picture →'}</button></div>` : `<p class="center muted small mt-3">Look closely at each picture. Choose your answer to reveal the clue.</p>`}</div>`;
  }
  function pictureAnswer(id) {
    const game = ui.picture; if (!game || game.answered !== null) return;
    const q = game.questions[game.index];
    if (!q.options.some(option => option.id === id)) return;
    game.answered = id;
    const correct = id === q.word.id;
    if (correct) game.score++;
    engine.recordWord(progress,q.word.id,correct); save(); playSound(correct ? 'success' : 'wrong'); render();
  }
  function nextPicture() {
    const game = ui.picture; if (!game || game.answered === null) return;
    if (game.index < game.questions.length-1) { game.index++; game.answered = null; render(true); return; }
    engine.recordQuiz(progress,game.score,game.questions.length,'picture');
    progress.pictureWins++; save();
    ui.result = {title:game.score === game.questions.length ? 'Master Picture Detective!' : 'Case closed, Detective!',
      description:`You identified ${game.score} of ${game.questions.length} pictures. Each round makes your visual memory stronger.`,
      icon:'🔍',score:game.score,total:game.questions.length,mode:'picture'};
    go('result'); celebrate(); playSound('reward');
  }
  function startMystery(level = ui.curriculumLevel) {
    if (!levels.includes(level)) return;
    const puzzle = engine.makeDailyMystery(levelWords(level),engine.dayKey(),level);
    if (!puzzle) { toast('The daily mystery will be available soon.'); return; }
    ui.mystery = {puzzle,step:0,answered:false,selected:null,response:'',feedback:'',finished:false,rewarded:false,misses:0};
    go('mystery');
  }
  function mystery() {
    const game = ui.mystery, puzzle = game.puzzle, target = puzzle.target;
    const names = ['Decode the note','Inspect the picture','Unlock the chest'];
    if (game.finished) return `<div class="mystery-finale"><span class="mystery-finale-stars">✨ 🌟 ✨</span><span class="mystery-finale-icon">${puzzle.tale.icon}</span><span class="hero-tag">MYSTERY UNLOCKED · ${esc(puzzle.difficulty)}</span><h1>You cracked the case!</h1><p>In ${esc(puzzle.tale.place)}, you discovered the secret word:</p><div class="mystery-secret">${wordArt(target)}<div><strong>${esc(target.term)}</strong><span dir="auto">${esc(target.meaning)}</span></div></div><div class="mystery-prize">${game.rewarded ? '🏆 +70 XP · Treasure claimed!' : '🏆 Mystery replay complete · Treasure already claimed today'}</div><button class="btn btn-white btn-large btn-full" data-action="start-mystery" data-level="${puzzle.difficulty}">Replay this mystery ↻</button><button class="btn btn-outline btn-large btn-full mt-2" data-action="nav" data-to="practice">Back to the Arcade →</button></div>`;
    const clue = game.step === 0 ? `<span class="clue-illustration">📜</span><h2>A coded note appears!</h2><p>Which English word matches this secret meaning?</p><div class="mystery-translation" dir="auto">${esc(target.meaning)}</div><div class="mystery-text-options">${puzzle.options.map((w,i)=>`<button class="mystery-text-option ${game.answered && w.id===target.id ? 'correct' : ''}" data-action="mystery-answer" data-id="${esc(w.id)}" ${game.answered ? 'disabled' : ''}><span>${'ABCD'[i]}</span>${esc(w.term)}</button>`).join('')}</div>`
      : game.step === 1 ? `<span class="clue-illustration">🖼️</span><h2>Find the picture clue</h2><p>Lumi found four illustrations in ${esc(puzzle.tale.place)}. Which picture represents <strong>${esc(target.term)}</strong>?</p><div class="picture-grid mystery-picture-grid">${puzzle.options.map((w,i)=>`<button class="picture-choice ${game.answered ? w.id === target.id ? 'correct' : 'dimmed' : ''}" aria-label="Picture ${'ABCD'[i]}${game.answered ? `, ${esc(w.term)}` : ''}" data-action="mystery-answer" data-id="${esc(w.id)}" ${game.answered ? 'disabled' : ''}><span class="picture-letter">${'ABCD'[i]}</span>${wordArt(w,'detective-art',!game.answered)}<span class="picture-caption">${game.answered ? esc(w.term) : 'Inspect clue'}</span></button>`).join('')}</div>`
      : `<span class="clue-illustration">🔐</span><h2>Spell the password</h2><p>The treasure chest needs the secret English word. Can you remember it?</p><div class="mystery-translation" dir="auto">${esc(target.meaning)}</div><p class="mystery-context">${esc(target.example ? target.example.replace(new RegExp(target.term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'ig'),'________') : `The secret word has ${target.term.length} letters.`)}</p><input type="text" data-role="mystery-input" class="search spelling-input" placeholder="Type the secret word" aria-label="Secret word password" autocapitalize="off" spellcheck="false" autocomplete="off" value="${esc(game.response)}" ${game.answered ? 'disabled' : ''}/>${game.answered ? '' : '<button class="btn btn-primary btn-large btn-full mt-3" data-action="mystery-check-spelling">Unlock treasure →</button>'}`;
    return `<div class="mystery-stage">${stageHeader('🗝️ Daily Mystery',`${puzzle.date} · A fresh puzzle each day`,game.step+1,3)}<div class="mystery-hero"><span class="eyebrow">LUMI'S DAILY DETECTIVE CLUB</span><span class="mystery-hero-icon">${puzzle.tale.icon}</span><h1>${esc(puzzle.tale.title)}</h1><p>Follow three clues through ${esc(puzzle.tale.place)} to unlock today's treasure.</p><div class="mystery-levels" role="group" aria-label="Mystery difficulty">${levels.map(level=>`<button data-action="start-mystery" data-level="${level}" class="${level===puzzle.difficulty ? 'active' : ''}" ${level===puzzle.difficulty ? 'aria-current="true"' : ''}>${level}</button>`).join('')}</div></div>
      <div class="mystery-steps">${names.map((name,i)=>`<div class="mystery-step ${i===game.step ? 'current' : i<game.step ? 'complete' : ''}"><span>${i<game.step ? '✓' : i+1}</span><strong>${name}</strong></div>`).join('')}</div>
      <div class="mystery-clue">${clue}${game.feedback ? `<div class="mystery-feedback ${game.answered ? 'correct' : 'try-again'}">${esc(game.feedback)}</div>` : ''}${game.answered ? `<button class="btn btn-primary btn-large btn-full mt-3" data-action="next-mystery">${game.step === 2 ? 'Open the treasure chest 🎁' : 'Follow the next clue →'}</button>` : ''}</div>
      <p class="center muted small mt-3">${progress.mysteryWins[puzzle.key] ? '✓ You already earned today’s mystery treasure at this level. Replay for fun!' : '🎁 Solve all three clues to earn 70 XP · One reward per level each day'}</p></div>`;
  }
  function mysteryAnswer(id) {
    const game = ui.mystery; if (!game || game.answered || game.step === 2) return;
    if (!game.puzzle.options.some(option=>option.id === id)) return;
    if (id === game.puzzle.target.id) { game.answered = true; game.feedback = game.step === 0 ? 'Brilliant! The first clue is decoded.' : 'Sharp eyes! You found the matching picture.'; playSound('success'); }
    else { game.feedback = 'Not this clue! Try another one. You can do it.'; game.misses++; playSound('wrong'); }
    render();
  }
  function mysteryCheckSpelling() {
    const game = ui.mystery; if (!game || game.answered || game.step !== 2) return;
    const input = document.querySelector('[data-role="mystery-input"]');
    const typed = input ? input.value.trim() : game.response.trim();
    if (!typed) { toast('Type the secret word to open the chest 🔐'); return; }
    game.response = typed;
    if (typed.replace(/\s+/g,' ').toLowerCase() === game.puzzle.target.term.trim().replace(/\s+/g,' ').toLowerCase()) {
      game.answered = true; game.feedback = 'Password accepted! The treasure chest is glowing!'; playSound('success');
    } else { game.feedback = `Almost there! Think of the word from your first two clues. It starts with “${game.puzzle.target.term[0].toUpperCase()}”.`; game.misses++; playSound('wrong'); }
    render();
  }
  function nextMystery() {
    const game = ui.mystery; if (!game || !game.answered) return;
    if (game.step < 2) { game.step++; game.answered = false; game.selected = null; game.feedback = ''; render(true); return; }
    engine.touchDay(progress);
    game.rewarded = engine.claimMystery(progress,game.puzzle.key);
    if (game.rewarded) engine.activity(progress).quizzes++;
    game.finished = true; save(); go('mystery'); celebrate(); playSound('reward');
  }
  function finish(title, description, icon, stats, actions) {
    return `<div class="surface finish"><span class="big-celebrate">${icon}</span><span class="eyebrow">QUEST COMPLETE</span><h1>${esc(title)}</h1><p>${esc(description)}</p>
      <div class="finish-stats">${stats.map(([emoji,value,label]) => `<div class="mini-stat"><span>${emoji}</span><strong>${value}</strong><small>${label}</small></div>`).join('')}</div>${actions}</div>`;
  }
  function result() {
    const x = ui.result;
    return finish(x.title,x.description,x.icon,[['🎯',x.score, 'CORRECT'],['⭐',x.total,'QUESTIONS']],`<button class="btn btn-primary btn-large btn-full" data-action="${x.mode === 'match' ? 'start-match' : x.mode === 'picture' ? 'start-picture' : 'start-quiz'}" ${['match','picture'].includes(x.mode) ? '' : `data-mode="${x.mode}"`}>Play again ↻</button><button class="btn btn-outline btn-large btn-full mt-2" data-action="nav" data-to="practice">Back to arcade →</button>`);
  }
  function filteredWords() {
    const term = ui.collectionQuery.trim().toLowerCase();
    return words.filter(w => (ui.collectionFilter === 'favorites' ? progress.favorites.includes(w.id) : ui.collectionFilter === 'learned' ? wordSeen(w.id) : true) &&
      (ui.collectionLevel === 'all' || (ui.collectionLevel === 'bonus' ? !w.level : w.level === ui.collectionLevel)) &&
      (!term || `${w.term} ${w.meaning} ${lessonById(w.lessonId).title}`.toLowerCase().includes(term)));
  }
  function collectionRows() {
    const result = filteredWords();
    const visible = result.slice(0,ui.collectionLimit);
    return result.length ? `<p class="collection-count">Showing ${visible.length.toLocaleString()} of ${result.length.toLocaleString()} matching words</p><div class="collection-grid">${visible.map(w => `<div class="word-row"><span class="word-emoji">${wordArt(w) || lessonById(w.lessonId).emoji}</span><div class="copy"><h3>${esc(w.term)} ${engine.isMastered(progress,w.id) ? '🌟' : ''}</h3><p dir="auto">${esc(w.meaning)}</p><small>${esc(lessonById(w.lessonId).title)} · ${wordSeen(w.id) ? 'Discovered' : 'New'}</small></div><button class="heart-btn" data-action="favorite" data-id="${esc(w.id)}" aria-label="${progress.favorites.includes(w.id) ? 'Unsave' : 'Save'} ${esc(w.term)}">${progress.favorites.includes(w.id) ? '❤️' : '🤍'}</button></div>`).join('')}</div>${visible.length < result.length ? `<button class="btn btn-outline btn-full mt-3" data-action="more-words">Load 60 more words ↓</button>` : ''}` : `<div class="empty"><span class="big">🔎</span><h3>No words found</h3><p>Try a different search, or discover a new word in the lessons.</p></div>`;
  }
  function collection() {
    return `<div class="page-heading"><div class="eyebrow">YOUR PERSONAL WORD BANK</div><h1>My Word Collection 📖</h1><p>Search ${words.length.toLocaleString()} words, save favorites, and revisit your discoveries.</p></div>
      <div class="section-tools"><input type="search" class="search" id="collection-search" placeholder="🔎 Search words or meanings..." value="${esc(ui.collectionQuery)}" aria-label="Search words" /></div>
      <div class="section-tools">${[['all','All words'],['learned','Discovered'],['favorites','❤️ Favorites']].map(([id,label]) => `<button class="filter-btn ${ui.collectionFilter === id ? 'active' : ''}" data-action="filter" data-id="${id}">${label}</button>`).join('')}</div>
      <div class="level-filter" role="group" aria-label="Filter vocabulary by level">${[['all','All levels'],...levels.map(level => [level,level]),['bonus','Bonus']].map(([id,label]) => `<button class="filter-btn ${ui.collectionLevel === id ? 'active' : ''}" data-action="collection-level" data-level="${id}">${label}</button>`).join('')}</div>
      <div id="collection-results">${collectionRows()}</div>`;
  }
  function profile() {
    const badges = engine.achievements(progress,words);
    const level = engine.levelInfo(progress.xp);
    const week = engine.weeklyActivity(progress);
    const maxActivity = Math.max(10,...week.map(d=>d.words));
    const accuracy = week.reduce((sum,d)=>sum+d.words,0) ? Math.round(week.reduce((sum,d)=>sum+d.correct,0) / week.reduce((sum,d)=>sum+d.words,0) * 100) : 0;
    return `<div class="page-heading"><div class="eyebrow">THE EXPLORER'S CORNER</div><h1>My Adventure Profile 👤</h1><p>Every step forward deserves to be celebrated.</p></div>
      <div class="level-banner"><div style="flex:1"><span class="hero-tag">LEVEL ${level.level} EXPLORER</span><h2>You've earned ${progress.xp} XP!</h2><p>${mastered()} words mastered · ${Object.keys(progress.storyFinishes).length} stories completed · ${progress.pictureWins || 0} picture cases · ${Object.keys(progress.mysteryWins).length} mysteries solved · ${currentStreak()} day streak · ${progress.coins} gems</p><div class="level-progress">${progressBar(level.earned,level.target)}<small>${level.earned} / ${level.target} XP to next level</small></div></div><img class="profile-lumi" src="lumi-mascot.webp" alt="Lumi celebrates your progress" /></div>
      <div class="section-heading"><div><h2>📊 Learning momentum</h2><p>Your last seven days at a glance</p></div></div><div class="surface"><div class="weekly-bars">${week.map(d=>`<div class="weekly-day"><div class="weekly-column"><i style="height:${Math.max(7,Math.round(d.words/maxActivity*100))}%" title="${d.words} words"></i></div><strong>${d.label}</strong><small>${d.words}</small></div>`).join('')}</div><div class="weekly-summary"><span>🎯 ${accuracy}% accuracy this week</span><span>📚 ${week.reduce((sum,d)=>sum+d.words,0)} word practices</span></div></div>
      <div class="section-heading"><div><h2>✨ Your achievements</h2><p>${badges.filter(b => b.earned).length} of ${badges.length} badges unlocked</p></div></div><div class="badge-grid">${badges.map(b => `<div class="badge-card ${b.earned ? '' : 'locked'}"><span class="big">${b.icon}</span><h3>${esc(b.title)}</h3><p>${esc(b.description)}</p></div>`).join('')}</div>
      <div class="section-heading"><h2>⚙️ My settings</h2></div><div class="surface"><label class="strong" for="name-field">Explorer name</label><div class="section-tools mt-2 mb-0"><input id="name-field" class="search" style="flex:1;min-width:0" maxlength="24" value="${esc(progress.name)}" /><button class="btn btn-primary" data-action="save-name">Save</button></div>
      <div class="settings-row"><div><strong>🎯 Daily goal</strong><small>Choose your own pace</small></div><div class="tiny-options">${[5,10,15].map(n=>`<button class="${progress.dailyGoal===n ? 'active':''}" data-action="daily-goal" data-count="${n}">${n}</button>`).join('')}</div></div>
      <div class="settings-row"><div><strong>🎵 Reward sounds</strong><small>Happy chimes when you learn</small></div><button class="toggle ${progress.sound ? 'on':''}" data-action="toggle-sound" aria-label="Toggle reward sounds" aria-pressed="${progress.sound}"><i></i></button></div>
      <div class="settings-row"><div><strong>✨ Motion effects</strong><small>Turn off celebrations and motion</small></div><button class="toggle ${!progress.reduceMotion ? 'on':''}" data-action="toggle-motion" aria-label="Toggle motion effects" aria-pressed="${!progress.reduceMotion}"><i></i></button></div>
      <p class="small muted mt-3 mb-0">Your name and learning progress stay on this device. No account required.</p></div>`;
  }
  function render(scroll = false) {
    const screens = {home,learn,lesson,'lesson-finish':lessonFinish,story,'story-finish':storyFinish,practice,quiz,spell:spelling,match,picture,mystery,result,collection,profile};
    root.innerHTML = ui.screen === 'welcome' ? welcome() : `<div class="shell">${sidebar()}<div class="workspace">${topbar()}<main id="main-content">${(screens[ui.screen] || home)()}</main></div></div>${bottomnav()}`;
    if (document.body.classList) document.body.classList.toggle('reduce-motion', progress.reduceMotion);
    if (scroll) window.scrollTo({top:0,behavior:'instant'});
  }
  function go(name) { stopSpeech(); ui.screen = name; render(true); }
  function openLesson(id) { ui.lessonId = id; ui.index = 0; ui.flipped = false; go('lesson'); }
  function openStory(id) {
    const selected = lessonById(id);
    if (!selected.story) { toast('A reading adventure is available for the six curriculum levels.'); return; }
    ui.lessonId = id;
    go('story');
  }
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
  function speakText(text, rate = .85) {
    if (!text) return;
    try {
      if (window.VocabularyNative?.speakText) window.VocabularyNative.speakText(text,rate);
      else if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US'; utterance.rate = rate;
        speechSynthesis.speak(utterance);
      } else toast('Speech is not available on this device.');
    } catch (_) { toast('Speech is not available on this device.'); }
  }
  function speak(id, slow = false) {
    const word = byId.get(id); if (!word) return;
    speakText(word.term,slow ? .62 : .88);
  }
  function speakStory(slow) {
    const current = lessonById(ui.lessonId);
    if (current.story) speakText(current.story.paragraphs.join(' '),slow ? .68 : .92);
  }
  function stopSpeech() {
    try {
      if (window.VocabularyNative?.stopSpeech) window.VocabularyNative.stopSpeech();
      else if ('speechSynthesis' in window) speechSynthesis.cancel();
    } catch (_) { /* Speech is optional. */ }
  }
  function back() {
    stopSpeech();
    if (['lesson','lesson-finish','story','story-finish'].includes(ui.screen)) { go('learn'); return true; }
    if (['quiz','spell','match','picture','mystery','result'].includes(ui.screen)) { go('practice'); return true; }
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
      case 'worlds-overview': ui.exploreMode = 'worlds'; go('learn'); break;
      case 'enter-world': ui.curriculumLevel = target.dataset.level; ui.district = 0; ui.exploreMode = 'curriculum'; go('learn'); break;
      case 'choose-level': ui.exploreMode = 'curriculum'; ui.curriculumLevel = target.dataset.level; ui.district = 0; render(); break;
      case 'choose-district': ui.district = Math.max(0,Math.min(5,Number(target.dataset.index) || 0)); render(true); break;
      case 'choose-bonus': ui.exploreMode = 'bonus'; render(); break;
      case 'open-lesson': openLesson(id); break;
      case 'open-story': openStory(id); break;
      case 'finish-story': finishStory(); break;
      case 'show-word': {
        const word = byId.get(id);
        if (word) toast(`${word.term} · ${word.meaning}`);
        break;
      }
      case 'flip': ui.flipped = !ui.flipped; render(); break;
      case 'study': study(target.dataset.known === 'yes'); break;
      case 'favorite': favorite(id); break;
      case 'speak': speak(id); break;
      case 'speak-slow': speak(id,true); break;
      case 'speak-story': speakStory(target.dataset.speed === 'slow'); break;
      case 'stop-speech': stopSpeech(); break;
      case 'start-quiz': startQuiz(target.dataset.mode, id); break;
      case 'quiz-hint': useHint('choice'); break;
      case 'spell-hint': useHint('spell'); break;
      case 'answer': answer(Number(target.dataset.index)); break;
      case 'next-question': nextQuestion(); break;
      case 'check-spelling': checkSpelling(); break;
      case 'start-match': startMatch(); break;
      case 'match-pick': matchPick(target.dataset.side,id); break;
      case 'start-picture': startPicture(); break;
      case 'picture-answer': pictureAnswer(id); break;
      case 'next-picture': nextPicture(); break;
      case 'start-mystery': startMystery(target.dataset.level || ui.curriculumLevel); break;
      case 'mystery-answer': mysteryAnswer(id); break;
      case 'mystery-check-spelling': mysteryCheckSpelling(); break;
      case 'next-mystery': nextMystery(); break;
      case 'filter': ui.collectionFilter = id; ui.collectionLimit = 60; render(); break;
      case 'collection-level': ui.collectionLevel = target.dataset.level; ui.collectionLimit = 60; render(); break;
      case 'more-words': ui.collectionLimit += 60; document.getElementById('collection-results').innerHTML = collectionRows(); break;
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
      ui.collectionLimit = 60;
      const result = document.getElementById('collection-results');
      if (result) result.innerHTML = collectionRows();
    }
    if (event.target.dataset.role === 'spell-input' && ui.quiz) ui.quiz.response = event.target.value;
    if (event.target.dataset.role === 'mystery-input' && ui.mystery) ui.mystery.response = event.target.value;
    if (event.target.dataset.role === 'story-answer') {
      const selected = lessonById(ui.lessonId);
      progress.storyResponses[selected.id] ||= {};
      progress.storyResponses[selected.id][event.target.dataset.index] = event.target.value;
      save();
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' && event.target.dataset.role === 'spell-input') checkSpelling();
    if (event.key === 'Enter' && event.target.dataset.role === 'mystery-input') mysteryCheckSpelling();
  });
  window.VQ = {back, go, getProgress:() => ({...progress})};
  render();
})();
