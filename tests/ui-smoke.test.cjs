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
  const store = new Map();
  const fakeDocument = {
    getElementById(id) { if (id === 'app') return appRoot; if (id === 'collection-results') return results; if (id === 'name-field') return {value:'Word Wizard'}; return null; },
    querySelector(selector) { if (selector === '[data-role="spell-input"]') return fakeInput; return null; },
    addEventListener(type,fn) { listeners[type] = fn; },
    createElement() { return {textContent:'',className:'',remove(){}}; },
    body: {appendChild() {}}
  };
  const fakeWindow = {VQ_LESSONS:lessons,VQEngine:engine,scrollTo(){}};
  const context = {window:fakeWindow,document:fakeDocument,localStorage:{
    getItem(key){return store.get(key) || null;},setItem(key,value){store.set(key,value);}
  },clearTimeout,setTimeout,console};
  const file = path.join(__dirname,'../app/src/main/assets/app.js');
  vm.runInNewContext(fs.readFileSync(file,'utf8'),context,{filename:file});

  const click = (data) => listeners.click({target:{closest:() => ({dataset:data})}});
  assert.match(appRoot.innerHTML,/Unlock a world/);
  for (const page of ['learn','practice','collection','profile','home']) {
    click({action:'nav',to:page});
    assert.match(appRoot.innerHTML, /<main id="main-content">/);
  }

  click({action:'open-lesson',id:'nature'});
  assert.match(appRoot.innerHTML,/habitat/i);
  click({action:'flip'});
  assert.match(appRoot.innerHTML,/natural home/i);
  click({action:'study',known:'yes'});
  assert.match(appRoot.innerHTML,/canopy/i);

  click({action:'start-quiz',mode:'choice'});
  assert.match(appRoot.innerHTML,/WHAT DOES THIS WORD MEAN/);
  click({action:'answer',index:'0'});
  assert.match(appRoot.innerHTML,/Next question|See results/);
  click({action:'next-question'});
  assert.match(appRoot.innerHTML,/WHAT DOES THIS WORD MEAN/);

  click({action:'start-quiz',mode:'spell'});
  assert.match(appRoot.innerHTML,/SPELL THE WORD THAT MEANS/);
  click({action:'check-spelling'});
  assert.match(appRoot.innerHTML,/Correct spelling|Perfect spelling/);

  click({action:'start-match'});
  assert.match(appRoot.innerHTML,/Find the perfect pairs/);

  click({action:'nav',to:'collection'});
  click({action:'filter',id:'favorites'});
  assert.match(appRoot.innerHTML,/No words found/);
  click({action:'filter',id:'all'});
  assert.match(appRoot.innerHTML,/curious/i);

  click({action:'nav',to:'profile'});
  click({action:'save-name'});
  assert.equal(fakeWindow.VQ.getProgress().name,'Word Wizard');
  assert.ok(store.has('vocabulary-quest-progress-v1'));
});
