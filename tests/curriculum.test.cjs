const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const starter = require('../app/src/main/assets/data.js');
const engine = require('../app/src/main/assets/engine.js');

const context = {window:{}};
const levels = ['A1','A2','B1','B2','C1','C2'];
for (const level of levels) {
  const file = path.join(__dirname,`../app/src/main/assets/curriculum/curriculum-${level.toLowerCase()}.js`);
  vm.runInNewContext(fs.readFileSync(file,'utf8'),context,{filename:file});
}
const lessons = context.window.VQ_CURRICULUM;
const words = engine.allWords(lessons);

test('PDF-derived curriculum includes exactly 5,400 entries in six complete learning levels', () => {
  assert.equal(lessons.length,216);
  assert.equal(words.length,5400);
  assert.equal(new Set(words.map(w => w.id)).size,5400);
  assert.equal(new Set(lessons.map(l => l.id)).size,216);
  for (const level of levels) {
    const section = lessons.filter(lesson => lesson.level === level);
    assert.equal(section.length,36);
    assert.deepEqual(Array.from(section,lesson => Number(lesson.set)),Array.from({length:36},(_,i)=>i+1));
    for (const lesson of section) {
      assert.equal(lesson.words.length,25);
      assert.ok(lesson.title.length > 3);
      lesson.words.forEach((word,index) => {
        const number = (lesson.set-1)*25+index+1;
        assert.equal(word.id,`${level.toLowerCase()}:${String(number).padStart(3,'0')}`);
        assert.equal(word.lessonId,lesson.id);
        assert.equal(word.number,number);
        assert.equal(word.level,level);
        assert.ok(word.term.trim());
        assert.match(word.meaning,/\p{Script=Arabic}/u);
      });
    }
  }
});

test('example sentences and Arabic translations survive extraction', () => {
  assert.ok(words.filter(w => w.example).length >= 5380);
  const translated = new Map(words.map(w => [w.id,w.meaning]));
  assert.equal(translated.get('a1:001'),'بقرة');
  assert.equal(translated.get('a2:001'),'كهربائي');
  assert.equal(translated.get('b1:001'),'دليل');
  assert.equal(translated.get('b2:002'),'حجة غياب عن مسرح الحادث');
  assert.equal(translated.get('c1:001'),'لا يقبل الجدل');
  assert.equal(translated.get('c2:001'),'يراوغ في الإجابة');
});

test('combined library includes original bonus worlds without clobbering progress IDs', () => {
  const combined = engine.allWords([...lessons,...starter]);
  assert.equal(combined.length,5550);
  assert.equal(new Set(combined.map(w => w.id)).size,5550);
  const quiz = engine.makeQuiz(lessons[0].words,combined,10,()=>.3);
  assert.equal(quiz.length,10);
  for (const question of quiz) {
    assert.equal(question.options.length,4);
    assert.equal(new Set(question.options).size,4);
    assert.ok(question.options.every(option => /\p{Script=Arabic}/u.test(option)));
  }
});
