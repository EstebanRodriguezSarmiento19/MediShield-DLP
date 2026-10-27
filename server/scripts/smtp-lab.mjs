import {SMTPServer} from 'smtp-server';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
export async function startSmtpLab({port=1025,directory=fileURLToPath(new URL('../../evidence/mailbox',import.meta.url))}={}) {
 await fs.mkdir(directory,{recursive:true});
 const server=new SMTPServer({authOptional:true,disabledCommands:['AUTH','STARTTLS'],size:1024*1024,
  onData(stream,session,callback){
   const chunks=[];let size=0;
   stream.on('data',chunk=>{size+=chunk.length;if(size<=1024*1024)chunks.push(chunk);});
   stream.on('end',async()=>{
    if(size>1024*1024)return callback(new Error('Límite de laboratorio excedido.'));
    try{
     const id=crypto.randomUUID(),raw=Buffer.concat(chunks);
     await fs.writeFile(path.join(directory,id+'.eml'),raw);
     await fs.writeFile(path.join(directory,id+'.json'),JSON.stringify({id,receivedAt:new Date().toISOString(),from:session.envelope.mailFrom.address,to:session.envelope.rcptTo.map(x=>x.address),bytes:raw.length},null,2));
     callback(null,'Mensaje almacenado en el laboratorio: '+id);
    }catch(e){callback(e);}
   });
  }});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
 return server;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const server=await startSmtpLab();
 console.log('Receptor SMTP local en 127.0.0.1:1025. Archivos .eml en evidence/mailbox. Sin retransmisión externa.');
 process.once('SIGINT',()=>server.close());
}
