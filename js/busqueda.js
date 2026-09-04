/**
 * ═══════════════════════════════════════════════════════════
 *  Búsqueda Previa — carga manual de resultados + presupuesto + PDF
 * ═══════════════════════════════════════════════════════════
 */

const INPI_ESTADO_MAP = { C: 'Concedida', R: 'Registrada', T: 'En trámite', D: 'Denegada', V: 'Vencida', A: 'Abandonada', O: 'En oposición', P: 'Publicada', S: 'Solicitada', E: 'En estudio' };
function inpiEstadoLabel(cod) { if (!cod) return '—'; return INPI_ESTADO_MAP[String(cod).trim().toUpperCase()] || String(cod).trim(); }
function inpiLink(acta) { return acta ? `https://portaltramites.inpi.gob.ar/MarcasConsultas/Resultado?acta=${encodeURIComponent(acta)}` : '#'; }

function calcularSimilitudJS(a, b) {
  if (!a || !b) return 0;
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim();
  const ca = norm(a), cb = norm(b);
  if (!ca || !cb) return 0;
  if (ca === cb) return 1;
  // Contención: si uno contiene al otro, bonus
  if (ca.includes(cb) || cb.includes(ca)) {
    const longer = Math.max(ca.length, cb.length), shorter = Math.min(ca.length, cb.length);
    return Math.min(0.99, 0.72 + 0.2 * (shorter/longer));
  }
  // Levenshtein simplificado via difflib-like: ratio de caracteres comunes
  const lev = (s,t) => {
    const m=s.length, n=t.length, d=Array.from({length:m+1},()=>Array(n+1).fill(0));
    for(let i=0;i<=m;i++) d[i][0]=i; for(let j=0;j<=n;j++) d[0][j]=j;
    for(let i=1;i<=m;i++) for(let j=1;j<=n;j++) d[i][j]= s[i-1]===t[j-1] ? d[i-1][j-1] : Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+1);
    return d[m][n];
  };
  const dist = lev(ca, cb);
  const maxLen = Math.max(ca.length, cb.length);
  return Math.max(0, 1 - dist / maxLen);
}
const Busqueda = (() => {
    let resultados = [];
    let clasesElegidas = [];
    let ultimaBusquedaInpi = [];
    let ultimaBusquedaInpiFiltrada = [];

    function render() {
        const view = document.getElementById('view-busqueda');
        if (!view) return;

        view.innerHTML = `
      <div class="card">
        <h3 style="margin-bottom: var(--space-md); font-size: 0.9375rem;">Datos de la consulta</h3>
        <div class="form-alta" style="grid-template-columns: repeat(auto-fit, minmax(180px,1fr));">
          <div class="form-group">
            <label class="form-label" for="bq-cliente">Cliente</label>
            <input type="text" class="form-input" id="bq-cliente" placeholder="Nombre del cliente">
          </div>
          <div class="form-group">
            <label class="form-label" for="bq-marca">Marca a registrar</label>
            <input type="text" class="form-input" id="bq-marca" placeholder="ej. CASA CUMBRE">
          </div>
          <div class="form-group">
            <label class="form-label" for="bq-descripcion">Descripción del producto/servicio</label>
            <input type="text" class="form-input" id="bq-descripcion" placeholder="ej. venta de inmuebles">
          </div>
          <div class="form-group" style="justify-content: flex-end;">
            <button class="btn btn--secondary" id="bq-sugerir-clases" type="button">🔎 Sugerir clases</button>
          </div>
        </div>
        <div id="bq-clases-sugeridas" style="margin-top: var(--space-sm);"></div>

        <div style="margin-top: var(--space-md);">
          <label class="form-label">Clases elegidas para esta solicitud</label>
          <div id="bq-clases-elegidas" style="margin: 6px 0;"></div>
          <div style="display:flex; gap:8px; align-items:center;">
            <select class="form-select" id="bq-clase-manual" style="max-width:280px;"></select>
            <button class="btn btn--secondary btn--sm" id="bq-add-clase" type="button">＋ Agregar clase</button>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top: var(--space-lg);">
        <div class="section-header" style="margin-bottom: var(--space-md);">
          <h3 style="font-size: 0.9375rem;">Resultados de la búsqueda</h3>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button class="btn btn--secondary btn--sm" id="bq-buscar-historico" type="button">🔍 Buscar en histórico</button>
            <button class="btn btn--secondary btn--sm" id="bq-consultar-inpi" type="button">📡 Consultar INPI en vivo</button>
            <button class="btn btn--secondary btn--sm" id="bq-add-resultado" type="button">＋ Agregar manual</button>
          </div>
        </div>
        <div id="bq-historico-nota" style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: var(--space-sm); display:none;"></div>
        <div id="bq-inpi-vivo-resultado" style="display:none; margin-bottom: var(--space-md); padding: var(--space-md); background: var(--bg-main); border: 1px solid var(--border); border-radius: var(--radius-md); font-size: 0.8125rem;"></div>
        <table class="data-table">
          <thead>
            <tr><th>Marca similar encontrada</th><th>Clase</th><th>Titular</th><th>Riesgo</th><th></th></tr>
          </thead>
          <tbody id="bq-tbody-resultados"></tbody>
        </table>
        <div id="bq-empty-resultados" style="padding: var(--space-md) 0; color: var(--text-tertiary); font-size: 0.8125rem;">
          Sin coincidencias cargadas todavía. Usá "Buscar en histórico" para chequear contra actas ya procesadas, o cargá coincidencias a mano. Si la búsqueda dio negativa, dejalo así y va a figurar como "sin antecedentes" en el PDF.
        </div>
      </div>

      <div class="card" style="margin-top: var(--space-lg);">
        <h3 style="margin-bottom: var(--space-md); font-size: 0.9375rem;">Presupuesto</h3>
        <div class="form-alta" style="grid-template-columns: repeat(auto-fit, minmax(160px,1fr));">
          <div class="form-group">
            <label class="form-label">Búsqueda de antecedentes</label>
            <input type="number" class="form-input" id="bq-precio-busqueda" value="0">
          </div>
          <div class="form-group">
            <label class="form-label">Presentación por clase</label>
            <input type="number" class="form-input" id="bq-precio-clase" value="135000">
          </div>
          <div class="form-group">
            <label class="form-label">Clases a presentar</label>
            <input type="number" class="form-input" id="bq-cant-clases" value="0" readonly style="opacity:0.7">
          </div>
          <div class="form-group">
            <label class="form-label">Otros (opcional)</label>
            <input type="number" class="form-input" id="bq-precio-otros" value="0">
          </div>
        </div>
        <div style="text-align:right; margin-top: var(--space-sm); font-size: 1.1rem; font-weight: 600;">
          Total estimado: $<span id="bq-total">0</span>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; margin-top: var(--space-lg); gap: var(--space-sm);">
        <button class="btn btn--primary" id="bq-generar-pdf" type="button">📄 Generar PDF para el cliente</button>
      </div>
    `;

        llenarSelectorClases();
        renderResultados();
        renderClasesElegidas();
        wireEvents();
        actualizarTotal();
    }

    function llenarSelectorClases() {
        const sel = document.getElementById('bq-clase-manual');
        if (!sel) return;
        sel.innerHTML = NIZA.CLASES.map(c => `<option value="${c.n}">Clase ${c.n} — ${c.titulo}</option>`).join('');
    }

    function renderClasesElegidas() {
        const cont = document.getElementById('bq-clases-elegidas');
        const cantInput = document.getElementById('bq-cant-clases');
        if (!cont) return;
        if (clasesElegidas.length === 0) {
            cont.innerHTML = `<span style="color:var(--text-tertiary); font-size:0.8125rem;">Ninguna clase elegida todavía.</span>`;
        } else {
            cont.innerHTML = clasesElegidas.map((c, i) =>
                `<span class="badge badge--primary" style="margin-right:6px; margin-bottom:6px; display:inline-block; cursor:pointer;" onclick="Busqueda.quitarClase(${i})">Clase ${c.n} — ${c.titulo} ✕</span>`
            ).join('');
        }
        if (cantInput) cantInput.value = clasesElegidas.length;
        actualizarTotal();
    }

    function agregarClase(n) {
        n = parseInt(n);
        if (clasesElegidas.some(c => c.n === n)) return;
        const c = NIZA.porNumero(n);
        if (c) clasesElegidas.push(c);
        renderClasesElegidas();
    }

    function quitarClase(i) {
        clasesElegidas.splice(i, 1);
        renderClasesElegidas();
    }

    function renderResultados() {
        const tbody = document.getElementById('bq-tbody-resultados');
        const empty = document.getElementById('bq-empty-resultados');
        if (!tbody) return;
        if (resultados.length === 0) {
            tbody.innerHTML = '';
            if (empty) empty.style.display = 'block';
            return;
        }
        if (empty) empty.style.display = 'none';
        tbody.innerHTML = resultados.map((r, i) => `
      <tr>
        <td><input type="text" class="form-input" value="${UI.escapeHtml(r.marca)}" onchange="Busqueda.editar(${i},'marca',this.value)"></td>
        <td><input type="number" class="form-input" style="width:70px" value="${r.clase}" onchange="Busqueda.editar(${i},'clase',this.value)"></td>
        <td><input type="text" class="form-input" value="${UI.escapeHtml(r.titular)}" onchange="Busqueda.editar(${i},'titular',this.value)"></td>
        <td>
          <select class="form-select" onchange="Busqueda.editar(${i},'riesgo',this.value)">
            <option value="Alto" ${r.riesgo === 'Alto' ? 'selected' : ''}>Alto</option>
            <option value="Medio" ${r.riesgo === 'Medio' ? 'selected' : ''}>Medio</option>
            <option value="Bajo" ${r.riesgo === 'Bajo' ? 'selected' : ''}>Bajo</option>
          </select>
        </td>
        <td><button class="btn btn--danger btn--sm" onclick="Busqueda.borrar(${i})">✕</button></td>
      </tr>
    `).join('');
    }

    function agregar() {
        resultados.push({ marca: '', clase: '', titular: '', riesgo: 'Medio' });
        renderResultados();
    }

    function editar(i, campo, valor) {
        resultados[i][campo] = valor;
    }

    function borrar(i) {
        resultados.splice(i, 1);
        renderResultados();
    }

    function actualizarTotal() {
        const busqueda = parseFloat(document.getElementById('bq-precio-busqueda')?.value || 0);
        const porClase = parseFloat(document.getElementById('bq-precio-clase')?.value || 0);
        const cantClases = clasesElegidas.length;
        const otros = parseFloat(document.getElementById('bq-precio-otros')?.value || 0);
        const total = busqueda + (porClase * cantClases) + otros;
        const totalEl = document.getElementById('bq-total');
        if (totalEl) totalEl.textContent = total.toLocaleString('es-AR');
        return total;
    }

    function wireEvents() {
        document.getElementById('bq-add-resultado')?.addEventListener('click', agregar);

        document.getElementById('bq-add-clase')?.addEventListener('click', () => {
            const sel = document.getElementById('bq-clase-manual');
            if (sel && sel.value) agregarClase(sel.value);
        });

        document.getElementById('bq-sugerir-clases')?.addEventListener('click', async () => {
            const desc = document.getElementById('bq-descripcion')?.value || '';
            if (!desc.trim()) { UI.toast('Describí el producto/servicio primero', 'error'); return; }
            const btn = document.getElementById('bq-sugerir-clases');
            if (btn) { btn.disabled = true; btn.textContent = 'Buscando...'; }
            let sugeridas = null;
            try {
                const rpc = await API.buscarClaseNiza(desc, 6);
                if (Array.isArray(rpc) && rpc.length) {
                    sugeridas = rpc.map(r => ({ n: r.clase, titulo: r.titulo, incluye: r.descripcion || r.incluye, score: r.score }));
                }
            } catch(e) {}
            if (!sugeridas || !sugeridas.length) sugeridas = NIZA.sugerir(desc);
            const cont = document.getElementById('bq-clases-sugeridas');
            if (!cont) { if (btn) { btn.disabled=false; btn.textContent='🔎 Sugerir clases'; } return; }
            if (sugeridas.length === 0) {
                cont.innerHTML = `<div style="color:var(--text-tertiary); font-size:0.8125rem;">No encontré clases sugeridas por keyword — elegila manualmente con el selector de abajo.</div>`;
                if (btn) { btn.disabled=false; btn.textContent='🔎 Sugerir clases'; }
                return;
            }
            const fmtScore = (s) => {
                if (!s) return '';
                const pct = Math.min(100, Math.round(s * 1200));
                if (pct >= 70) return `<span class="badge badge--success" style="margin-left:6px; font-size:0.7rem;">Alta ${pct}%</span>`;
                if (pct >= 35) return `<span class="badge badge--warning" style="margin-left:6px; font-size:0.7rem;">Media ${pct}%</span>`;
                return `<span class="badge badge--info" style="margin-left:6px; font-size:0.7rem;">Baja ${pct}%</span>`;
            };
            cont.innerHTML = `<div style="font-size:0.75rem; color:var(--text-tertiary); margin-bottom:8px;">Click para agregar a "Clases elegidas" ${sugeridas[0].score ? '(vía Supabase FTS)' : '(local)'}:</div>
                <div style="display:flex; flex-wrap:wrap; gap:8px;">
                ` + sugeridas.map(c => `
                    <div class="card" style="flex:1 1 280px; max-width:360px; padding:12px; cursor:pointer; border:1px solid var(--border); transition:all 0.15s; hover:border-color:var(--primary);" onclick="Busqueda.agregarClase(${c.n})" title="${UI.escapeHtml(c.incluye)}">
                        <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
                            <span style="font-weight:600; font-size:0.875rem; color:var(--primary);">Clase ${c.n}</span>
                            ${fmtScore(c.score)}
                        </div>
                        <div style="font-weight:600; font-size:0.875rem; margin-top:4px; line-height:1.3;">${UI.escapeHtml(c.titulo)}</div>
                        <div style="font-size:0.75rem; color:var(--text-tertiary); margin-top:4px; line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${UI.escapeHtml(c.incluye)}</div>
                        <div style="margin-top:8px; font-size:0.75rem; color:var(--primary); font-weight:500;">＋ Agregar</div>
                    </div>
                `).join('') + `</div>`;
            if (btn) { btn.disabled=false; btn.textContent='🔎 Sugerir clases'; }
        });

        ['bq-precio-busqueda', 'bq-precio-clase', 'bq-precio-otros'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', actualizarTotal);
        });
        document.getElementById('bq-generar-pdf')?.addEventListener('click', generarPDF);
        document.getElementById('bq-buscar-historico')?.addEventListener('click', buscarEnHistorico);
        document.getElementById('bq-consultar-inpi')?.addEventListener('click', consultarInpiEnVivo);
    }

    async function consultarInpiEnVivo() {
        const marca = document.getElementById('bq-marca')?.value?.trim();
        if (!marca) { UI.toast('Escribí la marca a buscar primero', 'error'); return; }

        const btn = document.getElementById('bq-consultar-inpi');
        const panel = document.getElementById('bq-inpi-vivo-resultado');
        if (btn) { btn.disabled = true; btn.textContent = 'Consultando...'; }

        try {
            const cfg = window.APP_CONFIG.supabase;
            const resp = await fetch(`${cfg.url}/functions/v1/inpi-consulta`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', apikey: cfg.anonKey },
                body: JSON.stringify({ tipo: 'denominacion', valor: marca }),
            });
            const data = await resp.json();

            if (!data.ok) {
                if (panel) {
                    panel.style.display = 'block';
                    panel.innerHTML = `<strong style="color:var(--danger)">Error consultando INPI:</strong> ${UI.escapeHtml(data.error || 'desconocido')}`;
                }
                UI.toast('Error consultando al INPI', 'error');
                return;
            }

            ultimaBusquedaInpi = (data.resultados || []).map(r => {
                const sim = calcularSimilitudJS(marca, r.denominacion || '');
                return { ...r, _sim: sim, _simCat: sim >= 0.97 ? 'exacto' : sim >= 0.85 ? 'muy' : sim >= 0.65 ? 'medio' : 'poco' };
            }).sort((a,b)=> b._sim - a._sim);
            ultimaBusquedaInpiFiltrada = [...ultimaBusquedaInpi];

            function renderInpiFiltrada() {
                const simFiltro = document.getElementById('filtro-inpi-sim')?.value || '';
                const estadoFiltro = document.getElementById('filtro-inpi-estado')?.value || '';
                const claseFiltro = document.getElementById('filtro-inpi-clase')?.value || '';
                console.log('Filtro INPI', {simFiltro, estadoFiltro, claseFiltro, clasesElegidas: clasesElegidas.map(c=>c.n), total: ultimaBusquedaInpi.length});
                ultimaBusquedaInpiFiltrada = ultimaBusquedaInpi.filter(r => {
                    if (simFiltro) {
                        if (simFiltro === 'exacto' && r._simCat !== 'exacto') return false;
                        if (simFiltro === 'muy' && !['exacto','muy'].includes(r._simCat)) return false;
                        if (simFiltro === 'medio' && r._simCat !== 'medio') return false;
                        if (simFiltro === 'poco' && r._simCat !== 'poco') return false;
                        if (simFiltro === 'muy+medio' && !['exacto','muy','medio'].includes(r._simCat)) return false;
                    }
                    if (estadoFiltro) {
                        const est = String(r.estado||'').trim().toUpperCase();
                        if (estadoFiltro === 'concedidas' && est !== 'C') return false;
                        if (estadoFiltro === 'no-concedidas' && est === 'C') return false;
                        if (estadoFiltro === 'en-tramite' && est !== 'T') return false;
                    }
                    if (claseFiltro) {
                        if (String(r.clase) !== String(claseFiltro)) return false;
                    }
                    return true;
                });
                console.log('Filtrada', ultimaBusquedaInpiFiltrada.length, 'de', ultimaBusquedaInpi.length);
                const tbody = document.getElementById('tbody-inpi-filtrada');
                if (tbody) {
                    tbody.innerHTML = ultimaBusquedaInpiFiltrada.map((r) => {
                        const origIdx = ultimaBusquedaInpi.indexOf(r);
                        const pct = Math.round(r._sim*100);
                        const badge = r._simCat==='exacto' ? 'badge--danger' : r._simCat==='muy' ? 'badge--warning' : r._simCat==='medio' ? 'badge--info' : 'badge--primary';
                        return `<tr>
                    <td><button class="btn btn--ghost btn--sm" style="font-weight:600; padding:2px 6px;" onclick="Detalle.abrir('${r.acta}')">${UI.escapeHtml(r.acta || '—')} 👁️</button> <a href="${inpiLink(r.acta)}" target="_blank" style="font-size:0.7rem; text-decoration:underline;">INPI ↗</a></td>
                    <td>${UI.escapeHtml(r.denominacion || '—')} ${r.tipo_marca === 'Mixta' ? '<span class="badge badge--info">Mixta</span>' : ''}<br><span class="badge ${badge}" style="font-size:0.65rem; margin-top:2px;">${r._simCat==='exacto'?'IDÉNTICA':r._simCat==='muy'?'Muy parecida':r._simCat==='medio'?'Parecida':'Poco parecida'} ${pct}%</span></td>
                    <td><span class="badge badge--primary">${UI.escapeHtml(r.clase || '—')}</span></td>
                    <td>${UI.escapeHtml((r.titulares || '').replace(/^\d+\s+/, '').replace(/\s+[\d.]+%$/, ''))}</td>
                    <td><span class="badge badge--primary" title="${UI.escapeHtml(r.estado||'')}">${UI.escapeHtml(inpiEstadoLabel(r.estado))}</span></td>
                    <td><button class="btn btn--ghost btn--sm" onclick="Busqueda.agregarDesdeInpi(${origIdx})" title="Agregar a coincidencias">＋</button></td>
                  </tr>`;
                    }).join('');
                    document.getElementById('inpi-filtrada-count').textContent = `${ultimaBusquedaInpiFiltrada.length} de ${ultimaBusquedaInpi.length} mostradas`;
                }
            }

            if (panel) {
                panel.style.display = 'block';
                if (!ultimaBusquedaInpi.length) {
                    panel.innerHTML = `<div style="color:var(--success)">✓ Sin coincidencias en el INPI para "${UI.escapeHtml(marca)}".</div>`;
                } else {
                    const clasesOpts = Array.from({length:45},(_,i)=>String(i+1)).map(c=>`<option value="${c}">Clase ${c}</option>`).join('');
                    panel.innerHTML = `
            <div style="margin-bottom:10px; display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
              <strong>${data.total} coincidencia(s) en el INPI para "${UI.escapeHtml(marca)}":</strong>
              <span id="inpi-filtrada-count" style="font-size:0.75rem; color:var(--text-tertiary);"></span>
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px; padding:8px; background:var(--bg-main); border:1px solid var(--border); border-radius:6px;">
              <select class="form-select" id="filtro-inpi-sim" style="max-width:190px;"><option value="">Similitud: Todas</option><option value="exacto">IDÉNTICA (100%)</option><option value="muy">Muy parecida (≥85%)</option><option value="muy+medio">Muy + Parecida</option><option value="medio">Parecida (65-85%)</option><option value="poco">Poco parecida (&lt;65%)</option></select>
              <select class="form-select" id="filtro-inpi-estado" style="max-width:190px;"><option value="">Estado: Todos</option><option value="concedidas">Solo Concedidas</option><option value="no-concedidas">Solo No concedidas</option><option value="en-tramite">Solo En trámite</option></select>
              <select class="form-select" id="filtro-inpi-clase" style="max-width:150px;"><option value="">Clase: Todas</option>${clasesOpts}</select>
              <button class="btn btn--ghost btn--sm" onclick="document.getElementById('filtro-inpi-sim').value='';document.getElementById('filtro-inpi-estado').value='';document.getElementById('filtro-inpi-clase').value=''; renderInpiFiltrada && renderInpiFiltrada();">Limpiar</button>
            </div>
            <table class="data-table" style="font-size:0.75rem;">
              <thead><tr><th>Acta</th><th>Denominación + Similitud</th><th>Clase</th><th>Titular</th><th>Estado</th><th></th></tr></thead>
              <tbody id="tbody-inpi-filtrada"></tbody>
            </table>
          `;
                    // exponer para los onchange
                    window.renderInpiFiltrada = renderInpiFiltrada;
                    document.getElementById('filtro-inpi-sim')?.addEventListener('change', renderInpiFiltrada);
                    document.getElementById('filtro-inpi-estado')?.addEventListener('change', renderInpiFiltrada);
                    document.getElementById('filtro-inpi-clase')?.addEventListener('change', renderInpiFiltrada);
                    renderInpiFiltrada();
                }
            }
            UI.toast(`${ultimaBusquedaInpi.length} coincidencia(s) del INPI (ordenadas por parecido)`, 'success');
        } catch (err) {
            if (panel) {
                panel.style.display = 'block';
                panel.innerHTML = `<strong style="color:var(--danger)">Error de conexión:</strong> ${UI.escapeHtml(err.message)}`;
            }
            UI.toast('Error de conexión con el proxy', 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = '📡 Consultar INPI en vivo'; }
        }
    }

    function agregarDesdeInpi(i) {
        const r = ultimaBusquedaInpi[i];
        if (!r) return;
        const titular = (r.titulares || '').replace(/^\d+\s+/, '').replace(/\s+[\d.]+%$/, '');
        resultados.push({ marca: r.denominacion || '(mixta)', clase: r.clase, titular, riesgo: 'Medio', _acta: r.acta });
        renderResultados();
        UI.toast('Agregada a las coincidencias del informe', 'success');
    }

    // ── Búsqueda automática contra actas_historicas (pg_trgm) ──
    // Umbral bajo a propósito: acá el resultado lo revisa una persona antes
    // de armar el informe, así que preferimos mostrar de más (falsos
    // positivos descartables con un vistazo) a que se escape un antecedente
    // real. No confundir con los umbrales del matcher semanal (0.72/0.80),
    // que sí generan alertas automáticas sin revisión previa.
    async function buscarEnHistorico() {
        const marca = document.getElementById('bq-marca')?.value?.trim();
        if (!marca) { UI.toast('Escribí la marca a buscar primero', 'error'); return; }

        const clase = clasesElegidas.length === 1 ? clasesElegidas[0].n : null;
        const btn = document.getElementById('bq-buscar-historico');
        const nota = document.getElementById('bq-historico-nota');
        if (btn) { btn.disabled = true; btn.textContent = 'Buscando...'; }

        try {
            const encontrados = await API.buscarSimilares(marca, clase, 0.25, 20);
            if (!Array.isArray(encontrados) || encontrados.length === 0) {
                if (nota) {
                    nota.style.display = 'block';
                    nota.textContent = '⚠ Sin coincidencias contra el histórico cargado (o el histórico todavía no tiene datos para esta clase). Revisá igual manualmente en el buscador del INPI.';
                }
                UI.toast('Sin coincidencias en el histórico', 'info');
                return;
            }
            if (nota) nota.style.display = 'none';

            for (const r of encontrados) {
                const sim = r.similitud || 0;
                const riesgo = sim >= 0.5 ? 'Alto' : sim >= 0.35 ? 'Medio' : 'Bajo';
                const titular = (r.titulares || []).map(t => t.nombre).join(', ') || '—';
                // Evitar duplicar si ya estaba cargado (misma acta)
                if (resultados.some(x => x._acta === r.acta)) continue;
                resultados.push({ marca: r.denominacion || '(mixta)', clase: r.clase, titular, riesgo, _acta: r.acta });
            }
            renderResultados();
            UI.toast(`${encontrados.length} coincidencia(s) encontradas en el histórico`, 'success');
        } catch (err) {
            UI.toast('Error buscando en el histórico: ' + err.message, 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = '🔍 Buscar en histórico'; }
        }
    }

    function generarPDF() {
        const cfg = window.APP_CONFIG;
        const cliente = document.getElementById('bq-cliente')?.value || '(sin nombre)';
        const marca = document.getElementById('bq-marca')?.value || '(sin nombre)';
        const descripcion = document.getElementById('bq-descripcion')?.value || '';
        const total = actualizarTotal();
        const fecha = new Date().toLocaleDateString('es-AR');

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const MARGEN = 14;
        const ANCHO = 182; // 210 - 2*14
        let y = 0;
        let pagina = 1;

        function piePagina() {
            doc.setFontSize(7.5);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(150);
            doc.text(`${cfg.firm.name} — Informe de búsqueda de antecedentes marcarios`, MARGEN, 290);
            doc.text(`Página ${pagina}`, 196, 290, { align: 'right' });
            doc.setTextColor(0);
        }

        function nuevaPagina() {
            piePagina();
            doc.addPage();
            pagina++;
            y = 20;
        }

        function saltoSiNecesario(espacioNecesario) {
            if (y + espacioNecesario > 275) nuevaPagina();
        }

        function parrafo(texto, opciones = {}) {
            const size = opciones.size || 9.5;
            const bold = opciones.bold || false;
            const color = opciones.color || 0;
            doc.setFontSize(size);
            doc.setFont(undefined, bold ? 'bold' : 'normal');
            doc.setTextColor(color);
            const lineas = doc.splitTextToSize(texto, opciones.ancho || ANCHO);
            saltoSiNecesario(lineas.length * (size / 2) + 4);
            doc.text(lineas, opciones.x || MARGEN, y);
            y += lineas.length * (size / 2.2) + (opciones.espacioExtra ?? 4);
            doc.setTextColor(0);
        }

        function subtitulo(texto) {
            saltoSiNecesario(14);
            y += 3;
            doc.setDrawColor(cfg.firm.primaryColor || '#6C5CE7');
            doc.setLineWidth(0.6);
            doc.line(MARGEN, y, MARGEN + 8, y);
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(30);
            doc.text(texto, MARGEN + 12, y + 1.5);
            y += 8;
            doc.setTextColor(0);
        }

        // ═══ ENCABEZADO / PORTADA ═══
        y = 22;
        doc.setFontSize(19);
        doc.setFont(undefined, 'bold');
        doc.text(cfg.firm.name, MARGEN, y);
        y += 7;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100);
        doc.text(cfg.firm.tagline || '', MARGEN, y);
        y += 5;
        doc.setFontSize(8.5);
        doc.text(`${cfg.firm.contactEmail || ''}   ${cfg.firm.contactPhone || ''}`, MARGEN, y);
        doc.setTextColor(0);
        y += 6;
        doc.setDrawColor(180);
        doc.setLineWidth(0.3);
        doc.line(MARGEN, y, 196, y);
        y += 14;

        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Informe de Búsqueda de Antecedentes Marcarios', MARGEN, y, { maxWidth: ANCHO });
        y += 12;

        // Ficha de datos
        doc.setFillColor(246, 246, 250);
        doc.roundedRect(MARGEN, y - 5, ANCHO, 32, 2, 2, 'F');
        doc.setFontSize(9.5);
        doc.setFont(undefined, 'bold'); doc.text('Fecha del informe:', MARGEN + 4, y + 2);
        doc.setFont(undefined, 'normal'); doc.text(fecha, MARGEN + 45, y + 2);
        doc.setFont(undefined, 'bold'); doc.text('Cliente:', MARGEN + 4, y + 9);
        doc.setFont(undefined, 'normal'); doc.text(cliente, MARGEN + 45, y + 9);
        doc.setFont(undefined, 'bold'); doc.text('Marca solicitada:', MARGEN + 4, y + 16);
        doc.setFont(undefined, 'normal'); doc.text(marca, MARGEN + 45, y + 16);
        if (descripcion) {
            doc.setFont(undefined, 'bold'); doc.text('Actividad:', MARGEN + 4, y + 23);
            const descLineas = doc.splitTextToSize(descripcion, ANCHO - 50);
            doc.setFont(undefined, 'normal'); doc.text(descLineas, MARGEN + 45, y + 23);
        }
        y += 34;

        // ═══ INTRODUCCIÓN ═══
        subtitulo('¿Qué es este informe?');
        parrafo(
            `Una búsqueda de antecedentes marcarios es el primer paso antes de solicitar el registro de una marca ante el ` +
            `Instituto Nacional de la Propiedad Industrial (INPI). Consiste en relevar si existen marcas ya registradas, en ` +
            `trámite o publicadas que puedan resultar idénticas o confundibles con la marca que se pretende registrar, en las ` +
            `mismas clases o clases relacionadas. Detectar esto de forma preventiva permite estimar la probabilidad de éxito ` +
            `del registro y anticipar eventuales oposiciones de terceros, antes de incurrir en los costos de presentación.`
        );

        // ═══ CLASES ═══
        subtitulo('Clases sugeridas (Clasificación de Niza)');
        parrafo(
            'La Clasificación de Niza organiza todos los productos y servicios en 45 clases. El registro de una marca protege ' +
            'únicamente dentro de las clases solicitadas, por lo que elegir bien la cobertura es una decisión estratégica: ' +
            'muy pocas clases dejan la marca desprotegida en actividades conexas, y clases de más generan costos innecesarios.',
            { espacioExtra: 6 }
        );

        if (clasesElegidas.length === 0) {
            parrafo('(sin clases elegidas todavía)', { color: 130 });
        } else {
            clasesElegidas.forEach(c => {
                saltoSiNecesario(16);
                doc.setFontSize(10.5);
                doc.setFont(undefined, 'bold');
                doc.text(`Clase ${c.n} — ${c.titulo}`, MARGEN, y);
                y += 5;
                doc.setFontSize(9);
                doc.setFont(undefined, 'normal');
                doc.setTextColor(90);
                const notaLineas = doc.splitTextToSize(c.incluye || '', ANCHO - 4);
                doc.text(notaLineas, MARGEN + 4, y);
                y += notaLineas.length * 4.2 + 5;
                doc.setTextColor(0);
            });
        }

        // ═══ RESULTADOS DE LA BÚSQUEDA ═══
        subtitulo('Resultado de la búsqueda de antecedentes');

        if (resultados.length === 0) {
            doc.setFillColor(235, 250, 240);
            saltoSiNecesario(20);
            doc.roundedRect(MARGEN, y - 5, ANCHO, 16, 2, 2, 'F');
            doc.setFontSize(9.5);
            doc.setFont(undefined, 'normal');
            doc.text('✓  No se encontraron antecedentes similares que impidan, en principio, el registro de la marca.', MARGEN + 4, y + 4);
            y += 18;
        } else {
            parrafo(
                `Se encontraron ${resultados.length} antecedente(s) que podrían representar un riesgo de confundibilidad. ` +
                `El nivel de riesgo indicado es una evaluación preliminar del estudio y no reemplaza el análisis definitivo ` +
                `que realiza el INPI al momento de examinar la solicitud.`,
                { espacioExtra: 6 }
            );

            const headers = ['Marca similar', 'Clase', 'Titular', 'Riesgo'];
            const colX = [MARGEN, MARGEN + 78, MARGEN + 103, MARGEN + 153];
            saltoSiNecesario(12);
            doc.setFillColor(240, 240, 245);
            doc.rect(MARGEN, y - 5, ANCHO, 7, 'F');
            doc.setFontSize(8.5);
            doc.setFont(undefined, 'bold');
            headers.forEach((h, i) => doc.text(h, colX[i] + 2, y));
            y += 6;
            doc.setFont(undefined, 'normal');

            const colorRiesgo = { Alto: [200, 60, 60], Medio: [190, 140, 30], Bajo: [60, 150, 90] };

            resultados.forEach(r => {
                saltoSiNecesario(8);
                doc.setFontSize(9);
                doc.setTextColor(0);
                doc.text(String(r.marca || '—').slice(0, 34), colX[0] + 2, y);
                doc.text(String(r.clase || '—'), colX[1] + 2, y);
                doc.text(String(r.titular || '—').slice(0, 22), colX[2] + 2, y);
                const [rr, gg, bb] = colorRiesgo[r.riesgo] || [0, 0, 0];
                doc.setTextColor(rr, gg, bb);
                doc.setFont(undefined, 'bold');
                doc.text(String(r.riesgo || '—'), colX[3] + 2, y);
                doc.setFont(undefined, 'normal');
                doc.setTextColor(0);
                y += 6.5;
                doc.setDrawColor(230);
                doc.line(MARGEN, y - 2, MARGEN + ANCHO, y - 2);
            });
            y += 6;
        }

        // ═══ PRESUPUESTO ═══
        subtitulo('Presupuesto estimado');
        const busqueda = parseFloat(document.getElementById('bq-precio-busqueda')?.value || 0);
        const porClase = parseFloat(document.getElementById('bq-precio-clase')?.value || 0);
        const cantClases = clasesElegidas.length;
        const otros = parseFloat(document.getElementById('bq-precio-otros')?.value || 0);

        saltoSiNecesario(40);
        doc.setFillColor(246, 246, 250);
        const alturaCaja = 12 + (otros > 0 ? 7 : 0) + 14;
        doc.roundedRect(MARGEN, y - 5, ANCHO, alturaCaja, 2, 2, 'F');
        doc.setFontSize(9.5);
        doc.setFont(undefined, 'normal');
        doc.text('Búsqueda de antecedentes', MARGEN + 4, y + 2);
        doc.text(busqueda === 0 ? 'Sin cargo' : `$${busqueda.toLocaleString('es-AR')}`, 190, y + 2, { align: 'right' });
        y += 7;
        doc.text(`Presentación ante INPI (${cantClases} clase${cantClases !== 1 ? 's' : ''} × $${porClase.toLocaleString('es-AR')})`, MARGEN + 4, y + 2);
        doc.text(`$${(porClase * cantClases).toLocaleString('es-AR')}`, 190, y + 2, { align: 'right' });
        y += 7;
        if (otros > 0) {
            doc.text('Otros conceptos', MARGEN + 4, y + 2);
            doc.text(`$${otros.toLocaleString('es-AR')}`, 190, y + 2, { align: 'right' });
            y += 7;
        }
        doc.setDrawColor(200);
        doc.line(MARGEN + 4, y, 192, y);
        y += 6;
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('TOTAL', MARGEN + 4, y + 2);
        doc.text(`$${total.toLocaleString('es-AR')}`, 190, y + 2, { align: 'right' });
        y += 14;

        // ═══ PRÓXIMOS PASOS ═══
        subtitulo('Próximos pasos');
        const pasos = [
            'Confirmación del cliente sobre las clases a registrar y aceptación del presupuesto.',
            'Presentación de la solicitud de registro ante el INPI (Trámites a Distancia).',
            'Publicación en el Boletín de Marcas y apertura del plazo de oposición de terceros (30 días hábiles).',
            'Seguimiento del expediente hasta la concesión del registro (proceso administrativo del INPI, de duración variable).',
        ];
        pasos.forEach((p, i) => {
            saltoSiNecesario(10);
            doc.setFontSize(9.5);
            doc.setFont(undefined, 'bold');
            doc.text(`${i + 1}.`, MARGEN, y);
            doc.setFont(undefined, 'normal');
            const lineas = doc.splitTextToSize(p, ANCHO - 8);
            doc.text(lineas, MARGEN + 6, y);
            y += lineas.length * 4.3 + 3;
        });

        // ═══ ACLARACIÓN LEGAL ═══
        y += 4;
        saltoSiNecesario(24);
        doc.setDrawColor(220);
        doc.line(MARGEN, y, 196, y);
        y += 6;
        parrafo(
            'Este informe tiene carácter orientativo y se basa en el relevamiento realizado a la fecha indicada. No constituye ' +
            'garantía de concesión del registro: la resolución final sobre la solicitud, incluyendo la evaluación de similitud ' +
            'con marcas de terceros, es potestad exclusiva del INPI. El presupuesto es estimado y puede variar según cambios ' +
            'normativos en las tasas oficiales o particularidades del expediente.',
            { size: 8, color: 120, espacioExtra: 0 }
        );

        piePagina();
        doc.save(`busqueda-previa-${marca.replace(/\s+/g, '-').toLowerCase()}.pdf`);
        UI.toast('PDF generado', 'success');
    }

    function reset() {
        resultados = [];
        clasesElegidas = [];
    }

    return { render, agregar, editar, borrar, agregarClase, quitarClase, reset, agregarDesdeInpi };
})();
