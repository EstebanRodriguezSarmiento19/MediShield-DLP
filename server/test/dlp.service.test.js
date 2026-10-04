import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeTransfer,evaluateRecipient,validateTransfer} from '../src/features/dlp/dlp.service.js';
import {eventHash,verifyRows,canonical} from '../src/features/audit/audit.service.js';
const context=(address,count=0,total=0,allowed=true)=>({recipient:evaluateRecipient(address,{autorizado:allowed,version:1},count,total)});
const safe={recipient:'laboratorio@hospital.local',subject:'Reunión',body:'Agenda administrativa.'};
test('permite contenido administrativo a un destinatario interno autorizado',()=>{
 const r=analyzeTransfer(safe,context(safe.recipient));assert.equal(r.decision,'PERMITIR');assert.equal(r.risk.score,25);
});
test('un destinatario desconocido nunca queda autorizado por defecto',()=>{
 const r=analyzeTransfer(safe);assert.equal(r.decision,'BLOQUEAR');assert.equal(r.recipient.authorized,false);
});
test('advierte sobre destino externo autorizado sin historial',()=>{
 const p={...safe,recipient:'auditoria@partner.test'};assert.equal(analyzeTransfer(p,context(p.recipient)).decision,'ALERTAR');
});
test('bloquea datos clínicos identificables incluso con destinatario externo habitual',()=>{
 const p={...safe,recipient:'auditoria@partner.test',body:'HC-482910 CC 1012345678'};
 assert.equal(analyzeTransfer(p,context(p.recipient,100,100)).decision,'BLOQUEAR');
});
test('normaliza acentos, caracteres de ancho completo y separadores invisibles',()=>{
 const p={...safe,body:'ＨＣ-482910 C\u200bC 1012345678 diagnóstico'};
 const r=analyzeTransfer(p,context(p.recipient));assert.equal(r.content.matches.length,3);assert.equal(r.decision,'BLOQUEAR');
});
test('no expone texto sensible en la respuesta',()=>{
 const p={...safe,body:'HC-999999 CC 1000000000'};const r=analyzeTransfer(p,context(p.recipient));assert.ok(!JSON.stringify(r).includes(p.body));assert.equal(r.content.contentHash.length,64);
});
test('rechaza campos de decisión, remitente y puntuación manipulados',()=>{
 for(const field of ['decision','senderId','score','authorized']) assert.throws(()=>validateTransfer({...safe,[field]:'PERMITIR'}),/campos no permitidos/);
});
test('rechaza destinatarios malformados e inyección de cabeceras',()=>{
 for(const recipient of ['x@','@hospital.local','a@hospital.local\r\nBcc: x@y.test']) assert.throws(()=>validateTransfer({...safe,recipient}));
});
test('rechaza payloads vacíos, arrays y tipos inesperados',()=>{
 for(const p of [null,[],{}, {...safe,body:{}},{...safe,body:'x'.repeat(20001)}]) assert.throws(()=>validateTransfer(p));
});
test('un subdominio engañoso se clasifica como externo',()=>{
 assert.equal(evaluateRecipient('x@hospital.local.evil.test',{autorizado:true}).type,'EXTERNO');
});
test('habitualidad usa la proporción de envíos confirmados del usuario',()=>{
 assert.equal(evaluateRecipient(safe.recipient,{autorizado:true},3,4).habituality,75);
 assert.equal(evaluateRecipient(safe.recipient,{autorizado:true},0,0).hasHistory,false);
});
test('cadena HMAC detecta modificación, eliminación, reordenamiento y truncamiento',()=>{
 const key='a'.repeat(64);let prev='0'.repeat(64);
 const rows=[1,2,3].map(seq=>{const payload=canonical({sequence:seq,action:'TEST'}),hash=eventHash(prev,payload,key);
 const row={sequence_no:seq,payload,previous_hash:prev,event_hash:hash};prev=hash;return row;});
 const head={sequence_no:3,event_hash:prev};
 assert.equal(verifyRows(rows,head,key).valid,true);
 const altered=structuredClone(rows);altered[1].payload='{}';
 for(const variant of [altered,[rows[0],rows[2]],[rows[1],rows[0],rows[2]],rows.slice(0,2)]) assert.equal(verifyRows(variant,head,key).valid,false);
});
