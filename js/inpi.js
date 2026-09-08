const Inpi = (() => {
  const cfg = () => window.APP_CONFIG.supabase;
  const estadoMap = { C: 'Concedida', R: 'Registrada', T: 'En trámite', D: 'Denegada', V: 'Vencida', A: 'Abandonada', O: 'En oposición', P: 'Publicada', S: 'Solicitada' };
  function parseEstado(s) { return estadoMap[String(s||'').trim().toUpperCase()] || String(s||'').trim() || '—'; }
  function parseVencimiento(v) {
    if (!v) return null;
    if (typeof v === 'string' && v.includes('/Date(')) {
      const ms = parseInt(v.replace(/\D/g,'')); if (!isNaN(ms)) { const d=new Date(ms); if (d.getFullYear()<=2100) return d.toISOString().slice(0,10); }
    }
    if (typeof v === 'string' && v.includes('/')) {
      const p=v.split('/'); if(p.length===3) return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`;
    }
    const d=new Date(v); return isNaN(d.getTime())||d.getFullYear()>2100 ? null : d.toISOString().slice(0,10);
  }
  function isLogoReal(url){ return url && !url.includes('logon.png') && !url.includes('assets/img/logon'); }
  async function acta(acta) {
    const r = await fetch(`${cfg().url}/functions/v1/inpi-detalle`, {method:'POST', headers:{'Content-Type':'application/json', apikey: cfg().anonKey}, body: JSON.stringify({acta})});
    const j = await r.json(); if (!j.ok) throw new Error(j.error||'error inpi-detalle'); return j.data;
  }
  async function grilla(acta) {
    const r = await fetch(`${cfg().url}/functions/v1/inpi-detalle`, {method:'POST', headers:{'Content-Type':'application/json', apikey: cfg().anonKey}, body: JSON.stringify({acta})});
    const j = await r.json(); if (!j.ok) throw new Error(j.error); return j.data.grilla || null;
  }
  async function consultaDenominacion(valor, limit=20) {
    const r = await fetch(`${cfg().url}/functions/v1/inpi-consulta`, {method:'POST', headers:{'Content-Type':'application/json', apikey: cfg().anonKey}, body: JSON.stringify({tipo:'denominacion', valor})});
    const j = await r.json(); if (!j.ok) throw new Error(j.error); return j;
  }
  return { parseEstado, parseVencimiento, isLogoReal, acta, grilla, consultaDenominacion };
})();
