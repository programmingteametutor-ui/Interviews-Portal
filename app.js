const API='https://script.google.com/macros/s/AKfycbzckT6mRjJgCUhKfIeuHsaPU3uzVMMC5c9RamVojGrQ6m1VgKGUvuN0CoDfcD6-sMY7BQ/exec';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const N='Candidate name',E='Email ID',P='Phone number',IDK={Candidates:'ID',Interviews:'Record ID'};
const CF=[[N],[E],[P],['Location'],['Experience'],['Assigned domains'],['Technical POC','sel'],['Assigned To'],['Date of joining','date'],['First client name'],['First client sector'],['Second client name'],['Second client sector'],['Visa type'],['Visa start date','date'],['Visa end date','date'],['Status','sel']];
let C=[],I=[],IH=[],page={c:0,i:0};
const uid=()=>[...crypto.getRandomValues(new Uint8Array(12))].map(b=>b.toString(16).padStart(2,'0')).join('');
const say=m=>$('#st').textContent=m||'';
const get=async s=>(await fetch(API+'?sheet='+s)).json();
const post=async b=>{const r=await(await fetch(API,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(b,(k,v)=>k[0]==='_'?undefined:v)})).json();if(!r.ok)throw r.error};
// ---- name / duplicate helpers
const tk=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\b(dr|mr|mrs|ms|miss)\b/g,' ').replace(/[^a-z0-9]+/g,' ').split(' ').filter(Boolean).sort();
const mailKey=e=>String(e||'').trim().toLowerCase(),phoneKey=p=>String(p||'').replace(/\D/g,'').slice(-10);
const tidy=s=>s.trim().replace(/\s+/g,' ').toLowerCase().replace(/(^|[\s.'-])([a-z])/g,(_,a,b)=>a+b.toUpperCase());
function lev(a,b){if(Math.abs(a.length-b.length)>1)return 2;let p=[...Array(b.length+1).keys()];for(let i=1;i<=a.length;i++){const c=[i];for(let j=1;j<=b.length;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c}return p[b.length]}
const tokOK=(t,u)=>t===u||(t.length==1&&u[0]===t)||(u.length==1&&t[0]===u)||(t.length>3&&t[0]===u[0]&&lev(t,u)<2);
const sim=(a,b)=>{const[s,l]=a.length<=b.length?[a,b]:[b,a];return s.length>0&&!(s.length==1&&l.length>1)&&s.every(t=>l.some(u=>tokOK(t,u)))}; // initials, 1-letter typos, partial names
const prep=c=>{c._s=CF.map(f=>c[f[0]]).join(' ').toLowerCase();c._t=tk(c[N]);c._k=c._t.join(' ');
  c._keys=[c._k&&'n'+c._k,mailKey(c[E])&&'e'+mailKey(c[E]),phoneKey(c[P]).length>6&&'p'+phoneKey(c[P])].filter(Boolean);return c};
const index=()=>{const m=new Map();C.forEach(c=>c._keys.forEach(k=>m.set(k,[...(m.get(k)||[]),c])));return m};
const hit=(c,m)=>{for(const k of c._keys){const o=(m.get(k)||[]).find(o=>o.ID!==c.ID);if(o)return[o,{n:'name',e:'email',p:'phone'}[k[0]]]}};
function iprep(r){r._s=IH.map(h=>r[h]).join(' ').toLowerCase();const s=r['Interview Schedule']||'',p=s.split(/\s+--\s+|\s+[—–]\s+/),t=p.slice(3).join(' '),m=s.match(/\(([^()]*)\)\s*$/);
  Object.assign(r,{_n:p[0].trim(),_type:p[1]||'',_client:p[2]||'',_time:(t.match(/\d{1,2}(?:[:.]\d\d)?\s*[ap]m/i)||[''])[0],_dur:(t.match(/(\d+)\s*min/i)||[,''])[1],_round:(t.match(/\d+(?:st|nd|rd|th)\s*Round|Round\s*\d+/i)||[''])[0],_sup:m&&!/round|min|call/i.test(m[1])?m[1]:''});return r}
const cmap=()=>new Map(C.map(c=>[c._k,c])),linked=(r,m)=>m.get(tk(r['Candidate Name']).join(' '))||m.get(tk(r._n).join(' '));
// ---- load + routing
async function load(){if(API.startsWith('PASTE'))return say('Set the API URL in app.js');say('Loading…');
  try{const[a,b]=await Promise.all([get('Candidates'),get('Interviews')]);IH=b.headers;C=a.rows.map(prep);I=b.rows.map(iprep);
    I.sort((x,y)=>(Date.parse(y['Interview Date'])||0)-(Date.parse(x['Interview Date'])||0));say('')}catch(e){say('Could not load: '+e)}render()}
function render(){const h=location.hash.slice(1)||'candidates';document.querySelectorAll('main>section').forEach(s=>s.hidden=s.id!==h);
  document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('on',a.hash==='#'+h));({candidates:rCand,interviews:rInt,datafix:rFix})[h]()}
onhashchange=render;
function pager(el,k,total,size){const n=Math.max(1,Math.ceil(total/size));page[k]=Math.min(page[k],n-1);
  $(el).innerHTML=`<button ${page[k]?'':'disabled'} onclick="pg('${k}',-1)">‹ Prev</button>Page ${page[k]+1} of ${n} · ${total} records<button ${page[k]<n-1?'':'disabled'} onclick="pg('${k}',1)">Next ›</button>`}
const pg=(k,d)=>{page[k]+=d;render()};
const M=h=>{$('#mb').innerHTML=h;$('#md').hidden=false},closeM=()=>$('#md').hidden=true;
// ---- candidates
const ln=(l,v)=>v?`<p><span>${l}:</span> ${esc(v)}</p>`:'';
function rCand(){const sel=$('#cp'),cur=sel.value,pocs=[...new Set(C.map(c=>c['Technical POC']).filter(Boolean))].sort();
  sel.innerHTML='<option value="">All Technical POCs</option>'+pocs.map(p=>`<option ${p===cur?'selected':''}>${esc(p)}</option>`).join('');
  const q=$('#cq').value.toLowerCase(),s=$('#cs').value,L=C.filter(c=>(!q||c._s.includes(q))&&(!cur||c['Technical POC']===cur)&&(!s||c.Status===s)),o=page.c*48;
  $('#cl').innerHTML=L.slice(o,o+48).map(c=>`<div class="card"><h3>${esc(c[N])} <span class="pill ${c.Status==='Active'?'ok':''}">${esc(c.Status)}</span></h3>
  ${ln('Email',c[E])}${ln('Phone',c[P])}${ln('Location',c.Location)}${ln('Experience',c.Experience)}${ln('Domains',c['Assigned domains'])}${ln('Technical POC',c['Technical POC'])}${ln('Assigned To',c['Assigned To'])}${ln('Date of joining',c['Date of joining'])}
  ${ln('First client',c['First client name']&&c['First client name']+(c['First client sector']?` (${c['First client sector']})`:''))}${ln('Second client',c['Second client name']&&c['Second client name']+(c['Second client sector']?` (${c['Second client sector']})`:''))}
  ${ln('Visa',[c['Visa type'],c['Visa start date']&&c['Visa start date']+' → '+c['Visa end date']].filter(Boolean).join(' · '))}
  <div class="acts"><button onclick="vCand('${c.ID}')">View</button><button onclick="form('Candidates','${c.ID}')">Edit</button><button class="del" onclick="del('Candidates','${c.ID}')">Delete</button></div></div>`).join('')||'<p>No candidates match.</p>';
  pager('#cpg','c',L.length,48)}
$('#cq').oninput=$('#cp').onchange=$('#cs').onchange=()=>{page.c=0;render()};$('#iq').oninput=()=>{page.i=0;render()};
const clr=()=>{$('#cq').value=$('#cp').value=$('#cs').value='';page.c=0;render()};
function vCand(id){const c=C.find(x=>x.ID==id),iv=I.filter(r=>[r['Candidate Name'],r._n].some(n=>{const t=tk(n);return t.join(' ')===c._k||sim(t,c._t)}));
  M(`<h2>${esc(c[N])}</h2><dl>${CF.map(f=>`<dt>${f[0]}</dt><dd>${esc(c[f[0]])||'—'}</dd>`).join('')}</dl><h3>Interviews (${iv.length})</h3>${ivTable(iv)}
  <div class="acts"><button onclick="form('Candidates','${id}')">Edit</button><button class="del" onclick="del('Candidates','${id}')">Delete</button></div>`)}
// ---- interviews
const ivTable=(L,full)=>L.length?`<table><tr>${full?'<th>Candidate</th>':''}<th>Date</th><th>Client</th><th>Round</th><th>Handled By</th><th>Feedback</th><th></th></tr>${L.map(r=>{const id=r['Record ID'];return`<tr>${full?`<td>${esc(r['Candidate Name']||r._n)}</td>`:''}<td>${esc(r['Interview Date'])}</td><td>${esc(r._client)}</td><td>${esc(r._round)}</td><td>${esc(r['Handled By'])}</td><td>${esc((r['WhatsApp Feedback']||'—').slice(0,70))}</td><td class="nw"><button onclick="vInt('${id}')">View</button>${full?`<button onclick="form('Interviews','${id}')">Edit</button><button class="del" onclick="del('Interviews','${id}')">Delete</button>`:''}</td></tr>`}).join('')}</table>`:'<p>No interviews found.</p>';
function rInt(){const q=$('#iq').value.toLowerCase(),L=I.filter(r=>!q||r._s.includes(q)),o=page.i*40;$('#il').innerHTML=ivTable(L.slice(o,o+40),1);pager('#ipg','i',L.length,40)}
function vInt(id){const r=I.find(x=>x['Record ID']==id),rows=[['Candidate',r['Candidate Name']||r._n],['Client',r._client],['Date',r['Interview Date']],['Time',r._time],['Duration',r._dur&&r._dur+' Minutes'],['Round',r._round],['Type',r._type],['Support person',r._sup],...IH.filter(h=>h!=='Candidate Name'&&h!=='Interview Date').map(h=>[h,r[h]])];
  M(`<h2>Interview #${esc(id.slice(-6))}</h2><dl>${rows.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)||'—'}</dd>`).join('')}</dl><div class="acts"><button onclick="form('Interviews','${id}')">Edit</button><button class="del" onclick="del('Interviews','${id}')">Delete</button></div>`)}
// ---- add / edit / delete
function form(sh,id){const cand=sh==='Candidates',key=IDK[sh],rec=(cand?C:I).find(x=>x[key]==id)||{},pocs=[...new Set(C.map(c=>c['Technical POC']).filter(Boolean))].sort(),
  fields=cand?CF:IH.filter(h=>h!==key).map(h=>[h,/schedule|details|feedback/i.test(h)?'area':'']);
  const inp=([k,t])=>{const v=esc(rec[k]||''),nm=esc(k);return`<label>${nm}${t==='area'?`<textarea name="${nm}">${v}</textarea>`:t==='sel'?`<select name="${nm}">${[...new Set([...(k==='Status'?['Active','Inactive','Placed']:['',...pocs]),rec[k]].filter(x=>x||k!=='Status'))].map(o=>`<option ${o===rec[k]?'selected':''}>${esc(o)}</option>`).join('')}</select>`:`<input name="${nm}" type="${t||'text'}" value="${v}">`}</label>`};
  M(`<h2>${id?'Edit':'Add'} ${cand?'candidate':'interview'}</h2><form id="f" class="grid" onsubmit="return false">${fields.map(inp).join('')}</form><div class="acts"><button onclick="closeM()">Cancel</button><button class="pri" onclick="save('${sh}','${id||''}')">Save ${cand?'candidate':'interview'}</button></div>`)}
async function save(sh,id){const cand=sh==='Candidates',key=IDK[sh],heads=cand?[key,...CF.map(f=>f[0])]:IH,old=(cand?C:I).find(x=>x[key]==id)||{},row={};
  heads.forEach(h=>row[h]=old[h]??'');new FormData($('#f')).forEach((v,k)=>row[k]=v.trim());row[key]=id||uid();
  if(cand){const c=prep({...row});if(!c[N])return alert('Candidate name is required.');
    const d=hit(c,index());if(d)return alert(`Duplicate: same ${d[1]} as "${d[0][N]}". Not saved.`);
    const s=C.filter(o=>o.ID!==c.ID&&sim(c._t,o._t)).slice(0,5);if(s.length&&!confirm('Similar names already exist:\n'+s.map(o=>o[N]).join('\n')+'\n\nSave anyway?'))return}
  try{await post({sheet:sh,action:'save',rows:[row]});const o=cand?prep(row):iprep(row),L=cand?C:I,i=L.findIndex(x=>x[key]==o[key]);i<0?L.unshift(o):L[i]=o;closeM();render()}catch(e){alert('Save failed: '+e)}}
async function del(sh,...ids){if(!confirm(`Delete ${ids.length} record(s)? This also removes the row from the Google Sheet.`))return;
  try{await post({sheet:sh,action:'delete',ids});const L=sh==='Candidates'?C:I,k=IDK[sh];ids.forEach(id=>{const i=L.findIndex(x=>x[k]==id);if(i>=0)L.splice(i,1)});closeM();render()}catch(e){alert('Delete failed: '+e)}}
// ---- excel import
$('#xl').onchange=async e=>{const file=e.target.files[0];if(!file)return;e.target.value='';
  try{const wb=XLSX.read(await file.arrayBuffer(),{cellDates:true}),rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''}),nk=s=>s.toLowerCase().replace(/[^a-z]/g,''),
    al={name:N,candidatename:N,email:E,emailid:E,phone:P,mobile:P,phonenumber:P};CF.forEach(f=>al[nk(f[0])]=f[0]);
    const m=index(),seen=new Map(),add=[];let ex=0,inf=0,bad=0;
    rows.forEach(r=>{const c={ID:uid()};CF.forEach(f=>c[f[0]]='');
      Object.entries(r).forEach(([k,v])=>{const h=al[nk(k)];if(h)c[h]=v instanceof Date?new Date(v.getTime()+432e5).toISOString().slice(0,10):String(v).trim()});
      if(!c[N])return bad++;prep(c);if(hit(c,m))return ex++;if(hit(c,seen))return inf++;c._keys.forEach(k=>seen.set(k,[c]));add.push(c)});
    if(!add.length)return alert(`Nothing to import. Already in portal: ${ex}, repeated inside file: ${inf}, no name: ${bad}.`);
    if(!confirm(`Import ${add.length} new candidates?\nSkipped: ${ex} already in portal, ${inf} repeated inside the file, ${bad} without a name.`))return;
    say('Importing…');await post({sheet:'Candidates',action:'save',rows:add});C.unshift(...add);say('');render()}catch(e){say('');alert('Import failed: '+e)}};
// ---- find duplicates
function dupes(){const g={},lab={n:'Same name',e:'Same email',p:'Same phone'};C.forEach(c=>c._keys.forEach(k=>(g[k]=g[k]||[]).push(c)));
  const grp=Object.entries(g).filter(([k,v])=>v.length>1),sims=[];
  for(let i=0;i<C.length;i++)for(let j=i+1;j<C.length;j++)if(C[i]._k!==C[j]._k&&sim(C[i]._t,C[j]._t))sims.push([C[i],C[j]]);
  const row=c=>`<div class="r"><span>${esc(c[N])} · ${esc(c[E])} · ${esc(c[P])}</span><button onclick="vCand('${c.ID}')">View</button><button class="del" onclick="del('Candidates','${c.ID}')">Delete</button></div>`;
  M(`<h2>Find duplicates</h2><h3>Same name, email or phone (${grp.length})</h3>${grp.map(([k,v])=>`<div class="grp"><b>${lab[k[0]]}</b>${v.map(row).join('')}</div>`).join('')||'<p>No exact duplicates.</p>'}
  <h3>Similar names to review (${sims.length})</h3>${sims.slice(0,200).map(p=>`<div class="grp">${p.map(row).join('')}</div>`).join('')||'<p>No similar names.</p>'}${sims.length>200?'<p class="note">Showing first 200.</p>':''}`)}
// ---- datafix
async function patch(sh,id,f,v){const L=sh==='Candidates'?C:I,r=L.find(x=>x[IDK[sh]]==id);try{await post({sheet:sh,action:'save',rows:[{...r,[f]:v}]});r[f]=v;sh==='Candidates'?prep(r):iprep(r)}catch(e){alert('Fix failed: '+e)}}
const fix=async id=>{await patch('Interviews',id,'Candidate Name',$('#s_'+id).value);render()};
const tidy1=async(sh,id)=>{const f=sh==='Candidates'?N:'Candidate Name',r=(sh==='Candidates'?C:I).find(x=>x[IDK[sh]]==id);await patch(sh,id,f,tidy(r[f]));render()};
function rFix(){const m=cmap(),bad=I.filter(r=>!linked(r,m)),
  t=[...C.filter(c=>c[N]&&tidy(c[N])!==c[N]).map(c=>['Candidates',c.ID,c[N]]),...I.filter(r=>r['Candidate Name']&&tidy(r['Candidate Name'])!==r['Candidate Name']).map(r=>['Interviews',r['Record ID'],r['Candidate Name']])],
  sug=r=>{const a=tk(r['Candidate Name']),b=tk(r._n);return C.map(c=>[c,Math.max(a.filter(x=>c._t.includes(x)).length,b.filter(x=>c._t.includes(x)).length)+(sim(a,c._t)||sim(b,c._t)?2:0)]).filter(x=>x[1]>1).sort((x,y)=>y[1]-x[1]).slice(0,4).map(x=>x[0])};
  $('#datafix').innerHTML=`<div class="bar"><h1>DataFix</h1><span class="sp"></span><button onclick="dupes()">Run duplicate scan</button></div>
  <p class="note">Duplicates are checked by name (any word order; ignoring case, spaces, punctuation, titles and accents), email, last 10 digits of phone, and similar names (initials, one-letter typos, partial names).</p>
  <h3>Interviews not linked to a candidate (${bad.length})</h3>${bad.length?`<table><tr><th>Date</th><th>Candidate Name</th><th>Name in schedule</th><th>Link to candidate</th><th></th></tr>${bad.slice(0,50).map(r=>{const s=sug(r),id=r['Record ID'];return`<tr><td>${esc(r['Interview Date'])}</td><td>${esc(r['Candidate Name'])}</td><td>${esc(r._n)}</td><td>${s.length?`<select id="s_${id}">${s.map(c=>`<option>${esc(c[N])}</option>`).join('')}</select>`:'No close match — add this person as a candidate'}</td><td>${s.length?`<button onclick="fix('${id}')">Apply</button>`:''}</td></tr>`}).join('')}</table>${bad.length>50?'<p class="note">Showing first 50. Fix these, then the next ones appear.</p>':''}`:'<p>Every interview is linked to a candidate.</p>'}
  <h3>Names to tidy: spacing or capitalisation (${t.length})</h3>${t.length?`<table><tr><th>Where</th><th>Current</th><th>Tidy version</th><th></th></tr>${t.slice(0,100).map(([sh,id,n])=>`<tr><td>${sh}</td><td>${esc(n)}</td><td>${esc(tidy(n))}</td><td><button onclick="tidy1('${sh}','${id}')">Tidy</button></td></tr>`).join('')}</table>`:'<p>All names are tidy.</p>'}`}
load();
