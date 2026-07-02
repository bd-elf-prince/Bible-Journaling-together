import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
const partsDir = process.argv[2] || 'supabase/bible-verses-registry-parts';

if(!connectionString){
  console.error('Missing DATABASE_URL.');
  process.exit(1);
}

function splitSql(sql){
  const statements = [];
  let current = '';
  let inSingle = false;
  for(let i = 0; i < sql.length; i += 1){
    const char = sql[i];
    const next = sql[i + 1];
    current += char;
    if(char === "'" && inSingle && next === "'"){
      current += next;
      i += 1;
      continue;
    }
    if(char === "'"){
      inSingle = !inSingle;
    }
    if(char === ';' && !inSingle){
      const statement = current.trim();
      if(statement) statements.push(statement);
      current = '';
    }
  }
  const tail = current.trim();
  if(tail) statements.push(tail);
  return statements;
}

async function runFile(client, filePath){
  const sql = fs.readFileSync(filePath, 'utf8');
  for(const statement of splitSql(sql)){
    await client.query(statement);
  }
}

const client = new pg.Client({
  connectionString,
  ssl:{rejectUnauthorized:false}
});

await client.connect();
try{
  const files = fs.readdirSync(partsDir)
    .filter(file => file === '00-setup.sql' || /^part-\d+\.sql$/.test(file) || file === '99-finalize.sql')
    .sort((a, b) => {
      if(a === '00-setup.sql') return -1;
      if(b === '00-setup.sql') return 1;
      if(a === '99-finalize.sql') return 1;
      if(b === '99-finalize.sql') return -1;
      return a.localeCompare(b);
    });

  for(const file of files){
    console.log(`running ${file}`);
    await runFile(client, path.join(partsDir, file));
  }

  const result = await client.query('select count(*)::int as count from public.bible_verses');
  console.log(JSON.stringify({
    ok:result.rows[0].count === 31101,
    bibleVerses:result.rows[0].count,
    expected:31101
  }, null, 2));
}finally{
  await client.end();
}
