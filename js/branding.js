const Branding = (() => {
  const PRESETS = {
    fons: { label: 'Fons Bordó', primary: '#7A2331', accent: '#8C7126' },
    juridico: { label: 'Azul Jurídico', primary: '#1E3A5F', accent: '#2E86AB' },
    corporativo: { label: 'Verde Corporativo', primary: '#2F5D45', accent: '#7FB069' },
    grafito: { label: 'Grafito', primary: '#2B2D42', accent: '#EF233C' },
    bronce: { label: 'Bronce Clásico', primary: '#4A3728', accent: '#C9A227' },
  };
  let _cache = null;
  let _estudioId = null;

  function firmDefault() {
    const f = window.APP_CONFIG?.firm || {};
    return { name: f.name, tagline: f.tagline, logoUrl: f.logoUrl, primaryColor: f.primaryColor, accentColor: f.accentColor, contactEmail: f.contactEmail, contactPhone: f.contactPhone };
  }
  function applyColors(primary, accent) {
    if (primary) {
      const r = parseInt(primary.slice(1, 3), 16), g = parseInt(primary.slice(3, 5), 16), b = parseInt(primary.slice(5, 7), 16);
      if (!isNaN(r)) {
        document.documentElement.style.setProperty('--primary', primary);
        document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
        document.documentElement.style.setProperty('--primary-light', `rgb(${Math.min(r + 60, 255)}, ${Math.min(g + 60, 255)}, ${Math.min(b + 60, 255)})`);
        document.documentElement.style.setProperty('--primary-dark', `rgb(${Math.max(r - 40, 0)}, ${Math.max(g - 40, 0)}, ${Math.max(b - 40, 0)})`);
      }
    }
    if (accent) {
      const r = parseInt(accent.slice(1, 3), 16), g = parseInt(accent.slice(3, 5), 16), b = parseInt(accent.slice(5, 7), 16);
      if (!isNaN(r)) {
        document.documentElement.style.setProperty('--accent', accent);
        document.documentElement.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
      }
    }
  }
  function applyFirm(firm) {
    const bn = document.getElementById('brand-name'), bt = document.getElementById('brand-tagline'), logo = document.getElementById('brand-logo');
    if (bn) bn.textContent = firm.name;
    if (bt) bt.textContent = firm.tagline || '';
    if (logo) {
      if (firm.logoUrl) logo.innerHTML = `<img src="${firm.logoUrl}" alt="${firm.name}" style="width:100%;height:100%;object-fit:contain;border-radius:8px;">`;
      else logo.textContent = (firm.name || 'F').charAt(0).toUpperCase();
    }
    applyColors(firm.primaryColor, firm.accentColor);
    document.title = `${firm.name} — Vigilancia de Marcas`;
  }
  async function load(estudioId, rol) {
    const params = new URLSearchParams(window.location.search);
    const previewId = params.get('preview_estudio');
    if (rol === 'admin' && !previewId) { _cache = null; _estudioId = null; applyFirm(firmDefault()); return null; }
    const eid = (rol === 'admin' && previewId) ? previewId : estudioId;
    if (!eid) { applyFirm(firmDefault()); return null; }
    _estudioId = eid;
    try {
      const sb = (typeof Auth !== 'undefined' && Auth.sb) ? Auth.sb() : null;
      let cfg = null;
      if (sb) {
        const { data } = await sb.from('estudios_config').select('*').eq('estudio_id', eid).maybeSingle();
        cfg = data;
      }
      if (!cfg) cfg = await API.request(`/rest/v1/estudios_config?estudio_id=eq.${eid}&select=*`).then(r => r[0]).catch(() => null);
      _cache = cfg;
      if (!cfg) { applyFirm(firmDefault()); return null; }
      const preset = PRESETS[cfg.brand_preset_id] || PRESETS.fons;
      const firm = {
        ...firmDefault(),
        name: cfg.brand_nombre_visible || firmDefault().name,
        tagline: cfg.brand_tagline || firmDefault().tagline,
        logoUrl: cfg.brand_logo_url || firmDefault().logoUrl,
        primaryColor: cfg.brand_primary || preset.primary,
        accentColor: cfg.brand_accent || preset.accent,
      };
      applyFirm(firm);
      return cfg;
    } catch (e) { console.warn('Branding load fail', e); applyFirm(firmDefault()); return null; }
  }
  function getFirm() {
    if (!_cache) return firmDefault();
    const preset = PRESETS[_cache.brand_preset_id] || PRESETS.fons;
    const d = firmDefault();
    const contacto = [_cache.telefono || d.contactPhone, _cache.gmail || d.contactEmail, _cache.direccion || ''].filter(Boolean).join('   ');
    return { name: _cache.brand_nombre_visible || d.name, tagline: _cache.brand_tagline || d.tagline, logoUrl: _cache.brand_logo_url || d.logoUrl, primaryColor: _cache.brand_primary || preset.primary, accentColor: _cache.brand_accent || preset.accent, contactEmail: _cache.gmail || d.contactEmail, contactPhone: _cache.telefono || d.contactPhone, contactLine: contacto, direccion: _cache.direccion || '', footer: _cache.footer_pdf || '' };
  }
  return { PRESETS, load, getFirm, applyFirm, firmDefault, get estudioId() { return _estudioId; }, get cache() { return _cache; } };
})();
