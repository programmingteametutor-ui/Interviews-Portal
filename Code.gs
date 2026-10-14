// Google Sheet backend: Extensions > Apps Script > paste > Deploy > New deployment > Web app
// (Execute as: Me, Who has access: Anyone) and copy the /exec URL into app.js
const KEY={Candidates:'ID',Interviews:'Record ID'};
const HEAD={Candidates:['ID','Candidate name','Email ID','Phone number','Location','Experience','Assigned domains','Technical POC','Assigned To','Date of joining','First client name','First client sector','Second client name','Second client sector','Visa type','Visa start date','Visa end date','Status'],
Interviews:['Interview Date','Interview Schedule','Candidate Name','Candidate + Time','Matched Interview Details','Handled By','Team','WhatsApp Feedback','Feedback Shared By','Feedback Posted At','Record ID']};
function sh(n){const ss=SpreadsheetApp.getActive();let s=ss.getSheetByName(n);if(!s){s=ss.insertSheet(n);s.appendRow(HEAD[n]);}return s;}
function out(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}
function doGet(e){const v=sh(e.parameter.sheet).getDataRange().getDisplayValues(),h=v.shift();
  return out({headers:h,rows:v.filter(r=>r.join('')).map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]])))});}
function doPost(e){const L=LockService.getScriptLock();L.waitLock(30000);
  try{const q=JSON.parse(e.postData.contents),s=sh(q.sheet),k=KEY[q.sheet],lr=s.getLastRow();
    const h=s.getRange(1,1,1,s.getLastColumn()).getValues()[0],ki=h.indexOf(k);
    if(ki<0)throw 'Sheet "'+q.sheet+'" needs a "'+k+'" column';
    const ids=lr>1?s.getRange(2,ki+1,lr-1,1).getValues().map(r=>String(r[0])):[];
    if(q.action==='delete'){q.ids.map(id=>ids.indexOf(String(id))).filter(i=>i>=0).sort((a,b)=>b-a).forEach(i=>s.deleteRow(i+2));}
    else{const add=[];
      q.rows.forEach(r=>{const i=ids.indexOf(String(r[k])),v=h.map(c=>r[c]===undefined?'':r[c]);
        if(i>=0)s.getRange(i+2,1,1,h.length).setNumberFormat('@').setValues([v]);else add.push(v);});
      if(add.length)s.getRange(s.getLastRow()+1,1,add.length,h.length).setNumberFormat('@').setValues(add);}
    return out({ok:true});
  }catch(err){return out({ok:false,error:String(err)});}finally{L.releaseLock();}}
