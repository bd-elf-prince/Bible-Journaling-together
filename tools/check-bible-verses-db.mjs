import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
if(!connectionString){
  console.error('Missing DATABASE_URL.');
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl:{rejectUnauthorized:false}
});

await client.connect();
try{
  const total = await client.query('select count(*)::int as count from public.bible_verses');
  const samples = await client.query(`
    select id, book_key, book_name, chapter, verse
    from public.bible_verses
    where id = any($1)
    order by sort_order
  `, [['gen-1-1','gen-1-2','gen-1-4','gen-1-5','gen-4-1','gen-16-1','ps-23-1','mat-5-1','jhn-3-16','rev-22-21']]);
  console.log(JSON.stringify({
    count:total.rows[0].count,
    samples:samples.rows
  }, null, 2));
}finally{
  await client.end();
}
