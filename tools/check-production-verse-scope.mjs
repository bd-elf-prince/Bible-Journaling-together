const base = process.env.SUPABASE_URL || 'https://rayvvlerwxumqvmodvsy.supabase.co';
const key = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_k6jRijBWjC4hcEO--pEHEg_zYI7KGUZ';
const headers = { apikey:key, Authorization:`Bearer ${key}` };

async function rowsFor(table, verseId){
  const rows=[];
  for(let offset=0; offset<100000; offset+=1000){
    const url=`${base}/rest/v1/${table}?select=id,verse_id&verse_id=eq.${encodeURIComponent(verseId)}&offset=${offset}&limit=1000`;
    const response=await fetch(url,{headers});
    const text=await response.text();
    if(!response.ok) throw new Error(`${table} ${verseId} HTTP ${response.status}: ${text}`);
    const page=JSON.parse(text);
    rows.push(...page);
    if(page.length<1000)break;
  }
  return rows;
}

const verseIds=['gen-1-1','gen-1-2'];
const report={};
let passed=true;
for(const table of ['comments','verse_reactions']){
  report[table]={};
  for(const verseId of verseIds){
    const rows=await rowsFor(table,verseId);
    const returnedVerseIds=[...new Set(rows.map(row=>row.verse_id))];
    const clean=returnedVerseIds.every(id=>id===verseId);
    report[table][verseId]={count:rows.length,returnedVerseIds,clean};
    passed&&=clean;
  }
}
report.passed=passed;
console.log(JSON.stringify(report,null,2));
if(!passed)process.exitCode=1;

