const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const lessons = require('../app/src/main/assets/data.js');
const engine = require('../app/src/main/assets/engine.js');

test('app can render every main screen and play learning flows without a browser dependency', () => {
  const listeners = {};
  const appRoot = {innerHTML: ''};
  const results = {innerHTML: ''};
  const fakeInput = {value: 'curious'};
  const fakeMysteryInput = {value:''};
  const store = new Map();
  const fakeDocument = {
    getElementById(id) { if (id === 'app') return appRoot; if (id === 'collection-results') return results; if (id === 'name-field' || id === 'welcome-name') return {value:'Word Wizard'}; return null; },
    querySelector(selector) { if (selector === '[data-role="spell-input"]') return fakeInput; if (selector === '[data-role="mystery-input"]') return fakeMysteryInput; return null; },
    addEventListener(type,fn) { listeners[type] = fn; },
    createElement() { return {textContent:'',className:'',remove(){}}; },
    body: {appendChild() {}}
  };
  const fakeWindow = {VQ_LESSONS:lessons,VQEngine:engine,scrollTo(){}};
  for (const level of ['a1','a2','b1','b2','c1','c2']) {
    const curriculumFile = path.join(__dirname,`../app/src/main/assets/curriculum/curriculum-${level}.js`);
    vm.runInNewContext(fs.readFileSync(curriculumFile,'utf8'),{window:fakeWindow},{filename:curriculumFile});
  }
  const context = {window:fakeWindow,document:fakeDocument,localStorage:{
    getItem(key){return store.get(key) || null;},setItem(key,value){store.set(key,value);}
  },clearTimeout,setTimeout,console};
  const file = path.join(__dirname,'../app/src/main/assets/app.js');
  vm.runInNewContext(fs.readFileSync(file,'utf8'),context,{filename:file});

  const click = (data) => listeners.click({target:{closest:() => ({dataset:data})}});
  assert.match(appRoot.innerHTML,/Every word/);
  click({action:'onboard-goal',count:'15'});
  click({action:'finish-onboard'});
  assert.match(appRoot.innerHTML,/Big dreams/);
  assert.equal(fakeWindow.VQ.getProgress().dailyGoal,15);
  for (const page of ['learn','practice','collection','profile','home']) {
    click({action:'nav',to:page});
    assert.match(appRoot.innerHTML, /<main id="main-content">/);
  }
  click({action:'nav',to:'learn'});
  assert.match(appRoot.innerHTML,/THE LIVING WORLD ATLAS/);
  assert.match(appRoot.innerHTML,/Celestial Library/);
  click({action:'enter-world',level:'A1'});
  assert.match(appRoot.innerHTML,/36 READING ADVENTURES/);
  assert.match(appRoot.innerHTML,/900 words/);
  assert.match(appRoot.innerHTML,/Welcome Gate/);
  click({action:'choose-district',index:'5'});
  assert.match(appRoot.innerHTML,/The Grand Summit/);
  assert.match(appRoot.innerHTML,/Adventures 31–36/);
  click({action:'choose-level',level:'C2'});
  assert.match(appRoot.innerHTML,/C2 · 36 READING ADVENTURES/);
  click({action:'choose-bonus'});
  assert.match(appRoot.innerHTML,/BONUS WORD WORLDS/);
  click({action:'learn-view',view:'grid'});
  assert.match(appRoot.innerHTML,/▦ Cards/);

  click({action:'open-story',id:'a1-set-01'});
  assert.match(appRoot.innerHTML,/The Great Animal Concert/);
  assert.match(appRoot.innerHTML,/What did the cow find/);
  assert.match(appRoot.innerHTML,/reading-hero/);
  assert.match(appRoot.innerHTML,/illustrations\/a1-01.webp/);
  for (let i=0;i<4;i++) listeners.input({target:{dataset:{role:'story-answer',index:String(i)},value:`My answer ${i+1}`}});
  click({action:'finish-story'});
  assert.match(appRoot.innerHTML,/Reading adventure complete/);
  assert.equal(fakeWindow.VQ.getProgress().storyFinishes['a1-set-01'],true);

  click({action:'open-lesson',id:'nature'});
  assert.match(appRoot.innerHTML,/habitat/i);
  click({action:'flip'});
  assert.match(appRoot.innerHTML,/natural home/i);
  click({action:'study',known:'yes'});
  assert.match(appRoot.innerHTML,/canopy/i);
  for (let i=0;i<7;i++) click({action:'study',known:'yes'});
  click({action:'nav',to:'home'});
  assert.match(appRoot.innerHTML,/Daily treasure quests/);
  const gemsBefore = fakeWindow.VQ.getProgress().coins;
  click({action:'claim-mission',id:'scout'});
  assert.equal(fakeWindow.VQ.getProgress().coins,gemsBefore+35);

  click({action:'start-quiz',mode:'choice'});
  assert.match(appRoot.innerHTML,/WHAT DOES THIS WORD MEAN/);
  assert.match(appRoot.innerHTML,/Remove 2 answers/);
  click({action:'quiz-hint'});
  assert.match(appRoot.innerHTML,/Eliminated/);
  click({action:'start-quiz',mode:'choice'});
  click({action:'answer',index:'0'});
  assert.match(appRoot.innerHTML,/Next question|See results/);
  click({action:'next-question'});
  assert.match(appRoot.innerHTML,/WHAT DOES THIS WORD MEAN/);

  click({action:'start-quiz',mode:'spell'});
  assert.match(appRoot.innerHTML,/SPELL THE WORD THAT MEANS/);
  click({action:'check-spelling'});
  assert.match(appRoot.innerHTML,/Correct spelling|Perfect spelling/);
  click({action:'start-quiz',mode:'listen'});
  assert.match(appRoot.innerHTML,/Listening Lab/);
  assert.match(appRoot.innerHTML,/Play slowly/);

  click({action:'start-match'});
  assert.match(appRoot.innerHTML,/Find the perfect pairs/);

  click({action:'start-picture'});
  assert.match(appRoot.innerHTML,/THE PICTURE CASE FILE/);
  assert.match(appRoot.innerHTML,/Picture Detective/);
  for (let i=0;i<8;i++) {
    const match = appRoot.innerHTML.match(/data-action="picture-answer" data-id="([^"]+)"/);
    assert.ok(match);
    click({action:'picture-answer',id:match[1]});
    assert.match(appRoot.innerHTML,/Next picture|See detective results/);
    click({action:'picture-answer',id:match[1]}); // Answer cannot be scored twice.
    click({action:'next-picture'});
  }
  assert.match(appRoot.innerHTML,/Case closed|Master Picture Detective/);
  assert.equal(fakeWindow.VQ.getProgress().pictureWins,1);

  click({action:'start-mystery',level:'A1'});
  assert.match(appRoot.innerHTML,/Decode the note/);
  const mystery = engine.makeDailyMystery(fakeWindow.VQ_CURRICULUM.filter(l=>l.level==='A1').flatMap(l=>l.words),engine.dayKey(),'A1');
  click({action:'mystery-answer',id:mystery.target.id});
  assert.match(appRoot.innerHTML,/first clue is decoded/);
  click({action:'next-mystery'});
  assert.match(appRoot.innerHTML,/Find the picture clue/);
  click({action:'mystery-answer',id:mystery.target.id});
  click({action:'next-mystery'});
  assert.match(appRoot.innerHTML,/Spell the password/);
  fakeMysteryInput.value = mystery.target.term;
  click({action:'mystery-check-spelling'});
  click({action:'next-mystery'});
  assert.match(appRoot.innerHTML,/You cracked the case/);
  assert.ok(fakeWindow.VQ.getProgress().mysteryWins[mystery.key]);
  const xpAfterMystery = fakeWindow.VQ.getProgress().xp;
  click({action:'start-mystery',level:'A1'});
  click({action:'mystery-answer',id:mystery.target.id});
  click({action:'next-mystery'});
  click({action:'mystery-answer',id:mystery.target.id});
  click({action:'next-mystery'});
  click({action:'mystery-check-spelling'});
  click({action:'next-mystery'});
  assert.equal(fakeWindow.VQ.getProgress().xp,xpAfterMystery);

  click({action:'nav',to:'collection'});
  assert.match(appRoot.innerHTML,/5,550 words/);
  assert.match(appRoot.innerHTML,/Showing 60 of 5,550/);
  click({action:'more-words'});
  assert.match(results.innerHTML,/Showing 120 of 5,550/);
  click({action:'collection-level',level:'B2'});
  assert.match(appRoot.innerHTML,/Showing 60 of 900/);
  click({action:'filter',id:'favorites'});
  assert.match(appRoot.innerHTML,/No words found/);
  click({action:'filter',id:'all'});
  click({action:'collection-level',level:'bonus'});
  assert.match(appRoot.innerHTML,/curious/i);

  click({action:'nav',to:'profile'});
  assert.match(appRoot.innerHTML,/Learning momentum/);
  click({action:'save-name'});
  assert.equal(fakeWindow.VQ.getProgress().name,'Word Wizard');
  assert.ok(store.has('vocabulary-quest-progress-v1'));
});
