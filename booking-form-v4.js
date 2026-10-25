/* Formspree prenotazioni: indipendente da calendario e gallerie. */
(function(){
'use strict';
const form=document.getElementById('request');
if(!form)return;
const feedback=document.getElementById('formstatus');
const button=form.querySelector('button[type="submit"]');
const endpoint='https://formspree.io/f/xljjgqly';
function note(message,type){
 if(!feedback)return;
 feedback.hidden=false;
 feedback.className='form-feedback form-feedback--'+type;
 feedback.textContent=message;
 feedback.setAttribute('role','status');
 feedback.scrollIntoView({block:'nearest',behavior:'smooth'});
}
form.addEventListener('invalid',function(){
 note('Controlla i campi obbligatori evidenziati. Nessuna richiesta è stata inviata.','error');
},true);
form.addEventListener('submit',async function(event){
 event.preventDefault();
 const data=new FormData(form);
 const arrival=String(data.get('arrivo')||'');
 const departure=String(data.get('partenza')||'');
 if(!arrival||!departure||departure<=arrival){
  note('Controlla le date: la partenza deve essere dopo l’arrivo.','error');
  return;
 }
 button.disabled=true;
 const original=button.textContent;
 button.textContent='Invio in corso…';
 note('Invio della richiesta in corso…','info');
 try{
  data.append('_subject','Nuova richiesta – Cervinia Mountain Stay');
  const response=await fetch(endpoint,{method:'POST',body:data,headers:{'Accept':'application/json'}});
  if(!response.ok){
   let description='';
   try{
    const result=await response.json();
    description=Array.isArray(result.errors)?result.errors.map(e=>e.message).filter(Boolean).join('; '):String(result.error||'');
   }catch(ignore){}
   throw Error('Formspree HTTP '+response.status+(description?': '+description:''));
  }
  note('Richiesta inviata correttamente! Ti risponderemo per confermare disponibilità e condizioni. La prenotazione non è ancora confermata.','success');
  form.reset();
 }catch(error){
  const detail=String(error?.message||'').slice(0,240);
  note('Richiesta NON inviata. '+(detail||'Impossibile contattare Formspree. Verifica la connessione o riprova.')+' — Controlla su Formspree che il modulo sia attivo e l’email destinataria verificata.','error');
 }finally{
  button.disabled=false;
  button.textContent=original;
 }
});
})();