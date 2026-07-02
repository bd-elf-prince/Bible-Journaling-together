import fs from 'node:fs';

const file = process.argv[2] || 'data/bible-kor.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

function fail(message){
  console.error(`MVP data check failed: ${message}`);
  process.exitCode = 1;
}

if(!Array.isArray(data) || !data.length){
  fail('Bible data is empty.');
}else{
  const gen = data.find(book => book.key === 'gen' || book.name === '창세기');
  const chapter = gen?.chapters?.find(item => Number(item.number) === 1);
  const row = chapter?.verses?.find(item => Number(Array.isArray(item) ? item[0] : item.number) === 1);
  const verseNumber = Array.isArray(row) ? row[0] : row?.number;
  const text = Array.isArray(row) ? row[1] : row?.text;
  const id = gen && chapter && verseNumber ? `${gen.key}-${chapter.number}-${verseNumber}` : null;

  if(id !== 'gen-1-1') fail(`expected gen-1-1, got ${id || 'missing'}.`);
  else if(text !== '태초에 하나님이 천지를 창조하시니라') fail(`unexpected Genesis 1:1 text: ${text || 'missing'}`);
  else{
    console.log(JSON.stringify({
      ok:true,
      selectedMvpVerse:{
        id,
        reference:'창세기 1:1',
        text
      }
    }, null, 2));
  }
}
