const CarterasAdmin = (() => {
  let cache = [];
  async function load() {
    const tbody = document.getElementById('tbody-carteras-admin');
    if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:var(--text-tertiary)">Cargando...</td></tr>';
    try {
      const data = await API.getMarcasTodas();
      cache = Array.isArray(data) ? data : [];
    } catch(e){
      cache = [];
      UI.toast('Error cargando todas las carteras', 'error');
    }
    render();
  }
  function render() {
    const tbody = document.getElementById('tbody-carteras-admin');
    const empty = document.getElementById('empty-carteras-admin');
    const count = document.getElementById('carteras-admin-count');
    const filtro = (document.getElementById('carteras-admin-search')?.value || '').toLowerCase();
    let filtradas = cache;
    if (filtro) {
      filtradas = cache.filter(m => {
        const est = (m.estudios?.nombre || m.estudio_nombre || '').toLowerCase();
        const nom = (m.nombre || '').toLowerCase();
        const cli = (m.cliente || '').toLowerCase();
        return est.includes(filtro) || nom.includes(filtro) || cli.includes(filtro);
      });
    }
    if (count) count.textContent = filtradas.length === cache.length ? `${cache.length} marcas totales` : `${filtradas.length} de ${cache.length}`;
    if (!filtradas.length) {
      if (tbody) tbody.innerHTML = '';
      if (empty) empty.style.display = 'flex';
      return;
    }
    if (empty) empty.style.display = 'none';
    if (tbody) {
      tbody.innerHTML = filtradas.map(m => {
        const estudio = m.estudios?.nombre || m.estudio_nombre || m.estudio_id || '—';
        return `<tr>
          <td><span class="badge badge--info">${UI.escapeHtml(estudio)}</span></td>
          <td>${UI.escapeHtml(m.nombre||'(sin nombre)')} ${m.numero_acta ? `<span style="font-size:0.7rem; color:var(--text-tertiary);">· Acta ${UI.escapeHtml(m.numero_acta)}</span>` : ''}</td>
          <td><span class="badge badge--primary">${m.clase||'—'}</span></td>
          <td>${UI.escapeHtml(m.tipo||'—')}</td>
          <td>${UI.escapeHtml(m.cliente||'—')}</td>
          <td>${UI.escapeHtml(m.estado||'—')}</td>
          <td>${m.fecha_vencimiento ? UI.escapeHtml(m.fecha_vencimiento) : '—'}</td>
          <td>${m.numero_acta ? `<button class="btn btn--ghost btn--sm" style="font-size:0.7rem; padding:2px 6px;" onclick="Detalle.abrir('${m.numero_acta}')">Ver INPI ↗</button>` : '—'}</td>
        </tr>`;
      }).join('');
    }
  }
  function init() {
    document.getElementById('carteras-admin-search')?.addEventListener('input', () => render());
  }
  return { load, render, init };
})();
