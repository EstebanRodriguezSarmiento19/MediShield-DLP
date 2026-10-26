export const roleName={admin:'Administrador',analista:'Analista',usuario:'Usuario'};
export const initials=name=>String(name||'?').trim().split(/\s+/).slice(0,2).map(p=>p[0]?.toUpperCase()).join('')||'?';
