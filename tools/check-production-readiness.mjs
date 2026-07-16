const base = process.env.SUPABASE_URL || 'https://rayvvlerwxumqvmodvsy.supabase.co';
const key = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_k6jRijBWjC4hcEO--pEHEg_zYI7KGUZ';
const headers = {apikey:key, Authorization:`Bearer ${key}`};

async function request(path){
  const response = await fetch(`${base}${path}`,{headers});
  return {status:response.status, text:await response.text()};
}

let total = 0;
let first = null;
let last = null;
for(let offset=0; offset<40000; offset+=1000){
  const result = await request(`/rest/v1/bible_verses?select=id,sort_order&order=sort_order.asc&offset=${offset}&limit=1000`);
  if(result.status !== 200) throw new Error(`bible_verses HTTP ${result.status}: ${result.text}`);
  const rows = JSON.parse(result.text);
  if(!rows.length) break;
  first ||= rows[0]; last = rows.at(-1); total += rows.length;
  if(rows.length < 1000) break;
}

const publicTables = ['comments','verse_reactions','comment_reactions'];
const privateTables = ['profiles','bookmarks','verse_notes','highlights','user_preferences'];
const checks = {};
for(const table of [...publicTables,...privateTables]){
  const result = await request(`/rest/v1/${table}?select=*&limit=1`);
  checks[table] = {status:result.status, missing:result.status===404 && result.text.includes('PGRST205')};
}
const auth = await request('/auth/v1/settings');
const authSettings = auth.status===200 ? JSON.parse(auth.text) : {};
const report = {
  projectRef:new URL(base).hostname.split('.')[0],
  bible:{total,first,last,complete:total===31101 && first?.id==='gen-1-1' && last?.id==='rev-22-21'},
  auth:{status:auth.status,emailEnabled:authSettings.external?.email===true},
  tables:checks,
  ready:total===31101 && authSettings.external?.email===true && Object.values(checks).every(x=>!x.missing)
};
console.log(JSON.stringify(report,null,2));
if(!report.ready) process.exitCode=2;
