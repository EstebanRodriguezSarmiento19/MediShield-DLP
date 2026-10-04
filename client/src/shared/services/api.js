const API_BASE_URL=import.meta.env.VITE_API_URL||'/api';
let csrfToken='';
async function request(path,options={}) {
 const response=await fetch(API_BASE_URL+path,{...options,credentials:'include',
  headers:{'Content-Type':'application/json',...(csrfToken?{'X-CSRF-Token':csrfToken}:{}),...options.headers}});
 const payload=await response.json().catch(()=>null);
 if(!response.ok){
  if(response.status===401&&!path.startsWith('/auth/login')) window.dispatchEvent(new Event('session-expired'));
  const error=new Error(payload?.error?.message||'No se pudo completar la solicitud.');
  error.status=response.status;throw error;
 }
 return payload;
}
export default {get:path=>request(path),post:(path,body)=>request(path,{method:'POST',body:JSON.stringify(body)}),
 patch:(path,body)=>request(path,{method:'PATCH',body:JSON.stringify(body)}),setCsrf:value=>{csrfToken=value;}};
