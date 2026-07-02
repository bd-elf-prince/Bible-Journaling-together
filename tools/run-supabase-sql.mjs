import fs from 'node:fs';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
const sqlFile = process.argv[2] || 'supabase/bible-verses-registry.sql';

if(!connectionString){
  console.error('Missing DATABASE_URL.');
  process.exit(1);
}

const sql = fs.readFileSync(sqlFile, 'utf8');
const client = new pg.Client({
  connectionString,
  ssl:{rejectUnauthorized:false}
});

await client.connect();
try{
  console.log(`running ${sqlFile}`);
  await client.query(sql);
  const result = await client.query('select count(*)::int as count from public.bible_verses');
  console.log(JSON.stringify({
    ok:result.rows[0].count === 31101,
    bibleVerses:result.rows[0].count,
    expected:31101
  }, null, 2));
}finally{
  await client.end();
}
