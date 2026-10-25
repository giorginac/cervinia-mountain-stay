// Endpoint POST HTTPS del servizio di contatto, da configurare in fase di pubblicazione.
// L'indirizzo email personale resta impostato solo nel servizio lato server.
const CONTACT_FORM_ENDPOINT = 'https://formspree.io/f/xljjgqly';
const propSel=document.getElementById('property'), calendarProp=document.getElementById('calendar-property');
const arrival=document.getElementById('arrival'),departure=document.getElementById('departure');
const days=document.getElementById('calendar-days'),monthLabel=document.getElementById('month-label');
const today=new Date(); today.setHours(0,0,0,0);
let view=new Date(today.getFullYear(),today.getMonth(),1);
let firstDate='',secondDate='';
let calendarData=null;
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const dateFromISO=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const offset=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const datesBlocked=(property)=>calendarData?.properties?.[property]?.blocked||[];
const blocked=(property,date)=>datesBlocked(property).includes(date);
const hasBlockedBetween=(start,end)=>{for(let day=dateFromISO(start);iso(day)<end;day=offset(day,1)){if(blocked(calendarProp.value,iso(day)))return true}return false};
function render(){
 monthLabel.textContent=new Intl.DateTimeFormat('it-IT',{month:'long',year:'numeric'}).format(view);
 const prev=document.getElementById('prev-month');prev.disabled=view.getFullYear()===today.getFullYear()&&view.getMonth()===today.getMonth();
 days.replaceChildren();const pad=(view.getDay()+6)%7;
 for(let n=0;n<pad;n++){const spacer=document.createElement('span');spacer.className='day empty';days.appendChild(spacer)}
 const monthDays=new Date(view.getFullYear(),view.getMonth()+1,0).getDate();
 for(let n=1;n<=monthDays;n++){
  const day=new Date(view.getFullYear(),view.getMonth(),n),key=iso(day);
  const b=document.createElement('button');b.type='button';b.textContent=String(n);b.dataset.date=key;b.className='day unknown';
  const past=day<today,isBlocked=blocked(calendarProp.value,key);
  if(past||isBlocked){b.disabled=true;b.className='day '+(past?'past':'blocked')}
  else if(key===firstDate||key===secondDate)b.className='day selected';
  else if(firstDate&&secondDate&&key>firstDate&&key<secondDate)b.className='day inrange';
  b.setAttribute('aria-label',`${n} ${monthLabel.textContent}${isBlocked?' occupato':''}`);
  b.addEventListener('click',()=>selectDate(key));days.appendChild(b);
 }
}
function selectDate(key){
 if(!firstDate||secondDate||key<=firstDate){firstDate=key;secondDate=''}
 else if(hasBlockedBetween(firstDate,key)){firstDate=key;secondDate='';document.getElementById('calendar-status').textContent='L’intervallo attraversa una data occupata: scegli un altro periodo.'}
 else{secondDate=key}
 arrival.value=firstDate;departure.value=secondDate;render();
}
function changeProperty(value){calendarProp.value=value;propSel.value=value;firstDate='';secondDate='';arrival.value='';departure.value='';render()}
calendarProp.addEventListener('change',()=>changeProperty(calendarProp.value));propSel.addEventListener('change',()=>changeProperty(propSel.value));
document.querySelectorAll('[data-property]').forEach(el=>el.addEventListener('click',()=>changeProperty(el.dataset.property)));
document.getElementById('prev-month').addEventListener('click',()=>{view=new Date(view.getFullYear(),view.getMonth()-1,1);render()});
document.getElementById('next-month').addEventListener('click',()=>{view=new Date(view.getFullYear(),view.getMonth()+1,1);render()});
for(const el of [arrival,departure]){el.min=iso(today);el.addEventListener('change',()=>{firstDate=arrival.value;secondDate=departure.value; if(firstDate){view=new Date(dateFromISO(firstDate).getFullYear(),dateFromISO(firstDate).getMonth(),1)}render()})}
fetch('availability.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('not found');return r.json()}).then(d=>{
 calendarData=d;
 const status=document.getElementById('calendar-status');
 if(d.connected===true&&d.updated_at){status.textContent=`Date occupate aggiornate al ${new Date(d.updated_at).toLocaleString('it-IT')}. Le date non segnate come occupate vanno comunque confermate.`;status.classList.add('live')}
 else{status.textContent='Calendario non aggiornato: la sincronizzazione Airbnb non è ancora attiva o ha avuto un errore. Le date restano soggette a conferma, anche se non appaiono occupate.'}
 render();
}).catch(()=>{document.getElementById('calendar-status').textContent='Calendario dimostrativo: sincronizzazione Airbnb non attiva. Le date future sono da verificare.';render()});
render();
const requestForm=document.getElementById('request');
const requestStatus=document.getElementById('formstatus');
function showRequestStatus(message,kind='info'){
 requestStatus.hidden=false;
 requestStatus.className='form-feedback form-feedback--'+kind;
 requestStatus.textContent=message;
 requestStatus.scrollIntoView({block:'nearest',behavior:'smooth'});
}
requestForm.addEventListener('invalid',event=>{
 showRequestStatus('Controlla i campi obbligatori: completa quelli mancanti o non validi. Nessuna richiesta è stata inviata.','error');
},true);
requestForm.addEventListener('submit',async e=>{
 e.preventDefault();
 const get=id=>document.getElementById(id).value.trim();
 const submitButton=e.currentTarget.querySelector('button[type="submit"]');
 const property=get('property'),start=get('arrival'),end=get('departure');
 if(!start||!end||end<=start){showRequestStatus('Verifica le date: la partenza deve essere successiva all’arrivo.','error');return}
 if(hasBlockedBetween(start,end)){showRequestStatus('Periodo con date occupate: scegli un altro intervallo.','error');return}
 const request={appartamento:property,arrivo:start,partenza:end,numero_ospiti:get('guests'),nome:get('guestname'),email:get('email'),messaggio:get('message'),_subject:'Nuova richiesta – Cervinia Mountain Stay'};
 const oldLabel=submitButton.textContent;
 try{
  submitButton.disabled=true;
  submitButton.textContent='Invio in corso…';
  showRequestStatus('Invio della richiesta in corso…','info');
  const response=await fetch(CONTACT_FORM_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(request)});
  if(!response.ok){
   const details=await response.json().catch(()=>null);
   throw new Error(details?.errors?.map(e=>e.message).join('; ')||'Invio non riuscito');
  }
  showRequestStatus('Richiesta inviata correttamente! Riceverai una risposta per confermare disponibilità e condizioni. Non è ancora una prenotazione confermata.','success');
  e.currentTarget.reset();
  changeProperty('Le Petit Chalet');
 }catch(err){
  showRequestStatus('Richiesta NON inviata. Controlla la connessione o riprova tra poco. Se il problema continua, utilizza il collegamento Airbnb dell’appartamento.','error');
 }finally{
  submitButton.disabled=false;
  submitButton.textContent=oldLabel;
 }
});

// Mobile navigation
const menuToggle=document.querySelector('.menu-toggle');
const mainNav=document.getElementById('main-nav');
if(menuToggle&&mainNav){
 menuToggle.addEventListener('click',()=>{const opened=mainNav.classList.toggle('is-open');menuToggle.setAttribute('aria-expanded',String(opened));menuToggle.setAttribute('aria-label',opened?'Chiudi menu':'Apri menu')});
 mainNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{mainNav.classList.remove('is-open');menuToggle.setAttribute('aria-expanded','false')}));
}

