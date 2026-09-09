const Tour = (() => {
  const STORAGE_KEY = 'tour-completado';
  const pasos = [
    { view: 'dashboard', selector: '#header-title', titulo: 'Panel de Control', texto: 'Acá ves el panorama: alertas, vencimientos y próximos escaneos. El botón 🌙/☀️ cambia a modo oscuro.' },
    { view: 'dashboard', selector: '.stats-grid', titulo: 'Stats', texto: '4 tarjetas con total de marcas, alertas sin revisar, plazos por vencer y cartera por cliente.' },
    { view: 'alertas', selector: '#alertas-filtros', titulo: 'Filtros de Alertas', texto: 'Filtrá por Similitud (IDÉNTICA/Muy/Parecida), Estado (Concedidas/No) y Clase 1..45. Todo ordenado por riesgo.' },
    { view: 'alertas', selector: '#tbody-alertas', titulo: 'Alertas', texto: 'Cada fila es una marca nueva parecida a la tuya. El % y el badge Riesgo te dicen qué tan grave. El 📄 es el borrador de oposición — siempre revisalo, nunca se manda solo.' },
    { view: 'alertas', selector: '#btn-export-alertas', titulo: 'Exportar', texto: 'Botón para bajar las alertas a CSV y mandar al cliente.' },
    { view: 'cartera', selector: '#form-alta', titulo: 'Alta de marca', texto: 'Cargá nombre, clase, tipo (D/M/F), cliente, estado, N° Acta con 🔍 que autocompleta desde INPI, vencimiento, logo y notas. Respetá el límite de tu plan.' },
    { view: 'cartera', selector: '#table-cartera', titulo: 'Tu cartera', texto: 'Tu lista con logo, nombre, clase, tipo, cliente, estado, vencimiento y botones Ver grilla 👁️ / INPI ↗. Filtrá por texto/estado.' },
    { view: 'cartera', selector: '#btn-exportar-cartera', titulo: 'Importar/Exportar', texto: 'Para estudios grandes: Exportar CSV con toda la cartera y volver a importar (ideal para migrar clientes).' },
    { view: 'busqueda', selector: '#bq-marca', titulo: 'Búsqueda Previa', texto: 'Acá armás el informe para el cliente: Cliente, Marca a registrar, Descripción. Te sugerimos clases con Supabase FTS.' },
    { view: 'busqueda', selector: '#bq-sugerir-clases', titulo: 'Sugerir clases', texto: 'Escribí la descripción y dale a Sugerir clases: te trae Clase 30 para panes con 77% (vía Niza FTS con weights).' },
    { view: 'busqueda', selector: '#btn-buscar-historico', titulo: 'Histórico', texto: 'Buscá en las 44k actas ya procesadas localmente (rápido, con Niza).' },
    { view: 'busqueda', selector: '#bq-consultar-inpi', titulo: 'INPI en vivo', texto: 'Consultá directo al INPI en vivo (consulta real, no histórico) con filtros por similitud fonética (zuria↔suria) y paginación.' },
    { view: 'busqueda', selector: '#btn-generar-pdf', titulo: 'Generar PDF', texto: 'Con las coincidencias armás el informe PDF con el membrete de tu estudio (logo, teléfono, gmail del panel Configuración).' },
    { view: 'crm', selector: '#crm-board', titulo: 'CRM Kanban', texto: 'Tus marcas por estado (Solicitada, En trámite, Registrada...). Arrastrá o cambiá el estado y queda el historial.' },
    { view: 'crm', selector: '#crm-filtro-cliente', titulo: 'Filtro Cliente + WhatsApp', texto: 'Filtrá por cliente y dale al botón WhatsApp para mandarle el recordatorio (solo link wa.me).' },
    { view: 'presentar', selector: '#form-presentar', titulo: 'Presentar Marca', texto: 'Form con CUIT/Clave INPI por envío (no se guarda), poder y docs múltiples (base64), preview del XML y doble confirmación antes de mandar.' },
    { view: 'admin', selector: '#view-admin', titulo: 'Admin (solo vos)', texto: 'Creás estudios/usuarios con o sin correo (demo), editás límite/plan/INPI/Presentar/Alertas por estudio, y guardás la bóveda CUIT/Clave cifrada con Vault.' },
    { view: 'carteras-admin', selector: '#table-carteras-admin', titulo: 'Todas las carteras', texto: 'Auditoría: todas las marcas de todos los estudios con columna Estudio. Solo lectura, no se edita cartera ajena.' },
    { view: 'calendario', selector: '#calendar', titulo: 'Calendario', texto: 'Vista de plazos legales (vencimientos, renovaciones, contestaciones) + eventos manuales que creás vos. Todo filtrado por estudio.' },
  ];
  let idx = 0;
  let overlay = null;
  let card = null;
  function isAdmin() {
    try { const p = JSON.parse(localStorage.getItem('sb-oomczohvjqycpuhhmotv-auth-token')||'{}'); return false; } catch { return false; }
  }
  async function esAdminReal() {
    try {
      const sb = (typeof Auth !== 'undefined' && Auth.sb) ? Auth.sb() : null;
      if (!sb) return false;
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return false;
      const { data } = await sb.from('perfiles').select('rol').eq('id', user.id).maybeSingle();
      return data && data.rol === 'admin';
    } catch { return false; }
  }
  function getPasosFiltrados(esAdmin) {
    return pasos.filter(p => !p.adminOnly || esAdmin);
  }
  function crearOverlay() {
    overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:9998;';
    overlay.addEventListener('click', () => saltar());
    document.body.appendChild(overlay);
  }
  function crearCard() {
    card = document.createElement('div');
    card.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:16px 20px; max-width:420px; width:90%; z-index:9999; box-shadow:0 10px 30px rgba(0,0,0,0.2);';
    document.body.appendChild(card);
  }
  function resaltar(selector) {
    const el = document.querySelector(selector);
    if (!el) return;
    if (!el.dataset.tourOrigPosition) el.dataset.tourOrigPosition = el.style.position;
    el.style.position = 'relative';
    el.style.zIndex = '9999';
    el.style.boxShadow = '0 0 0 3px #0f3a5f, 0 0 20px rgba(15,58,95,0.5)';
    el.style.borderRadius = '6px';
    el.classList.add('tour-highlight');
    setTimeout(()=> { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
  }
  function quitarResaltado() {
    document.querySelectorAll('[style*="box-shadow: 0 0 0 3px"]').forEach(el => {
      el.style.boxShadow = '';
      el.style.zIndex = '';
      if (el.dataset.tourOrigPosition !== undefined) {
        el.style.position = el.dataset.tourOrigPosition;
        delete el.dataset.tourOrigPosition;
      } else {
        el.style.position = '';
      }
      el.classList.remove('tour-highlight');
    });
    // Acomodar panel: quitar blur del app-shell si quedó
    const appShell = document.querySelector('.app-shell');
    if (appShell) appShell.style.filter = 'none';
  }
  async function mostrarPaso(i) {
    const esAdmin = await esAdminReal();
    const lista = getPasosFiltrados(esAdmin);
    if (i < 0 || i >= lista.length) { terminar(); return; }
    idx = i;
    const paso = lista[idx];
    quitarResaltado();
    App.navigate(paso.view);
    setTimeout(() => {
      resaltar(paso.selector);
      if (!card) crearCard();
      card.innerHTML = `
        <div style="font-size:0.75rem; color:var(--text-tertiary);">Paso ${idx+1} de ${lista.length}</div>
        <div style="font-weight:700; margin:6px 0;">${paso.titulo}</div>
        <div style="font-size:0.875rem; color:var(--text-secondary); line-height:1.4;">${paso.texto}</div>
        <div style="display:flex; gap:8px; margin-top:12px; justify-content:space-between;">
          <button class="btn btn--ghost btn--sm" id="tour-saltar">Saltar tutorial</button>
          <div style="display:flex; gap:8px;">
            <button class="btn btn--ghost btn--sm" id="tour-anterior" ${idx===0?'disabled':''}>Anterior</button>
            <button class="btn btn--primary btn--sm" id="tour-siguiente">${idx===lista.length-1?'Terminar':'Siguiente'}</button>
          </div>
        </div>
      `;
      document.getElementById('tour-saltar')?.addEventListener('click', saltar);
      document.getElementById('tour-anterior')?.addEventListener('click', () => mostrarPaso(idx-1));
      document.getElementById('tour-siguiente')?.addEventListener('click', () => {
        if (idx === lista.length-1) terminar();
        else mostrarPaso(idx+1);
      });
    }, 300);
  }
  function saltar() {
    quitarResaltado();
    if (overlay) overlay.remove(); overlay=null;
    if (card) card.remove(); card=null;
    localStorage.setItem(STORAGE_KEY, '1');
  }
  function terminar() {
    saltar();
    localStorage.setItem(STORAGE_KEY, '1');
    UI.toast('¡Tour completado! Podés relanzarlo con ❓ Tutorial', 'success');
  }
  function iniciar() {
    if (!overlay) crearOverlay();
    if (!card) crearCard();
    mostrarPaso(0);
  }
  function debeMostrarAuto() {
    return !localStorage.getItem(STORAGE_KEY);
  }
  return { iniciar, debeMostrarAuto, saltar };
})();
