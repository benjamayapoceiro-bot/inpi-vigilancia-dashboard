/**
 * ═══════════════════════════════════════════════════════════
 *  Búsqueda Previa — carga manual de resultados + presupuesto + PDF
 * ═══════════════════════════════════════════════════════════
 */

const Busqueda = (() => {
  let resultados = [];      // { marca, clase, titular, riesgo }
  let clasesElegidas = [];  // [{ n, titulo }]

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

    document.getElementById('bq-sugerir-clases')?.addEventListener('click', () => {
      const desc = document.getElementById('bq-descripcion')?.value || '';
      if (!desc.trim()) { UI.toast('Describí el producto/servicio primero', 'error'); return; }
      const sugeridas = NIZA.sugerir(desc);
      const cont = document.getElementById('bq-clases-sugeridas');
      if (!cont) return;
      if (sugeridas.length === 0) {
        cont.innerHTML = `<div style="color:var(--text-tertiary); font-size:0.8125rem;">No encontré clases sugeridas por keyword — elegila manualmente con el selector de abajo.</div>`;
        return;
      }
      cont.innerHTML = `<div style="font-size:0.75rem; color:var(--text-tertiary); margin-bottom:4px;">Click para agregar a "Clases elegidas":</div>` +
        sugeridas.map(c =>
          `<div class="badge badge--info" style="margin-right:6px; margin-bottom:6px; padding:6px 10px; display:inline-block; cursor:pointer; max-width:320px;" onclick="Busqueda.agregarClase(${c.n})" title="${UI.escapeHtml(c.incluye)}">＋ Clase ${c.n} — ${c.titulo}</div>`
        ).join('');
    });

    ['bq-precio-busqueda', 'bq-precio-clase', 'bq-precio-otros'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', actualizarTotal);
    });
    document.getElementById('bq-generar-pdf')?.addEventListener('click', generarPDF);
    document.getElementById('bq-buscar-historico')?.addEventListener('click', buscarEnHistorico);
    document.getElementById('bq-consultar-inpi')?.addEventListener('click', consultarInpiEnVivo);
  }

  let ultimaBusquedaInpi = [];

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

      ultimaBusquedaInpi = data.resultados || [];

      if (panel) {
        panel.style.display = 'block';
        if (!ultimaBusquedaInpi.length) {
          panel.innerHTML = `<div style="color:var(--success)">✓ Sin coincidencias en el INPI para "${UI.escapeHtml(marca)}".</div>`;
        } else {
          panel.innerHTML = `
            <div style="margin-bottom:8px;"><strong>${data.total} coincidencia(s) en el INPI para "${UI.escapeHtml(marca)}":</strong></div>
            <table class="data-table" style="font-size:0.75rem;">
              <thead><tr><th>Acta</th><th>Denominación</th><th>Clase</th><th>Titular</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                ${ultimaBusquedaInpi.map((r, i) => `
                  <tr>
                    <td class="mono">${UI.escapeHtml(r.acta || '—')}</td>
                    <td>${UI.escapeHtml(r.denominacion || '—')} ${r.tipo_marca === 'Mixta' ? '<span class="badge badge--info">Mixta</span>' : ''}</td>
                    <td>${UI.escapeHtml(r.clase || '—')}</td>
                    <td>${UI.escapeHtml((r.titulares || '').replace(/^\d+\s+/, '').replace(/\s+[\d.]+%$/, ''))}</td>
                    <td>${UI.escapeHtml(r.estado || '—')}</td>
                    <td><button class="btn btn--ghost btn--sm" onclick="Busqueda.agregarDesdeInpi(${i})" title="Agregar a coincidencias">＋</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `;
        }
      }
      UI.toast(`${ultimaBusquedaInpi.length} coincidencia(s) del INPI`, 'success');
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
    y += 4;
    doc.setFontSize(10.5);
    doc.setFont(undefined, 'bold');
    doc.text(cliente + ',', MARGEN, y);
    y += 6;
    parrafo(
      `A continuación, te paso toda la información necesaria para la solicitud de una marca en Argentina.\n\n` +
      `El primer paso consiste en proceder a la CLASIFICACIÓN de la marca; lo cual significa establecer en qué rubros se va ` +
      `a proteger. En tal sentido, habrá que encuadrarla dentro de las 34 clases de productos y 11 de servicios que dispone ` +
      `el Instituto Nacional de la Propiedad Industrial. Ello teniendo en cuenta los productos y/o servicios que se ` +
      `comercializan y/o comercializarán bajo el nombre de la marca.`
    );

    parrafo(
      `Teniendo en consideración el uso que se dará a la marca ${marca}, sugerimos para una adecuada protección, ` +
      `solicitar la marca en las siguientes clases:`, { espacioExtra: 4 }
    );

    if (clasesElegidas.length === 0) {
      parrafo('(sin clases elegidas todavía)', { color: 130 });
    } else {
      clasesElegidas.forEach(c => {
        saltoSiNecesario(12);
        doc.setFontSize(9.5);
        doc.setFont(undefined, 'bold');
        const titleLine = doc.splitTextToSize(`• CLASE ${c.n} (${c.titulo})`, ANCHO - 4);
        doc.text(titleLine, MARGEN, y);
        y += titleLine.length * 4.2 + 2;
        doc.setFont(undefined, 'normal');
      });
    }

    y += 4;

    // ═══ RESULTADOS DE LA BÚSQUEDA ═══
    parrafo(
      `Luego, una vez establecidas en qué clase/s se podría solicitar la marca, el segundo paso y no menos importante, es la ` +
      `BÚSQUEDA DE ANTECEDENTES. En esta etapa, efectuamos una exhaustiva búsqueda de antecedentes en nuestras ` +
      `bases, a fin de descartar la existencia de nombres idénticos y/o similares que pudieren ` +
      `obstaculizar el registro de su marca y oponerse a la misma.`, { espacioExtra: 6 }
    );

    if (resultados.length === 0) {
      parrafo(`Habiendo realizado la búsqueda en las clases sugeridas no se encontraron antecedentes idénticos ni similares.`, { bold: true });
    } else {
      const classText = clasesElegidas.map(c => c.n).join(' y ');
      parrafo(
        `Sin embargo, ${classText ? 'en clases ' + classText : ''} se encontraron los siguientes antecedentes que podrían representar riesgo de oposición:`, { bold: true, espacioExtra: 6 }
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
      y += 8;
    }

    // ═══ SUGERENCIAS Y DISCLAIMER ═══
    if (resultados.length > 0) {
      parrafo(`En virtud de los antecedentes encontrados, vemos viable avanzar con la marca ${marca}, pero necesariamente hay que realizar algunos ajustes para disminuir el riesgo de oposiciones:\n` +
        `• sumar un logo\n` +
        `• limitar la cobertura de la marca a los servicios que efectivamente se prestarán`,
        { espacioExtra: 4 }
      );
    }

    parrafo(`Sin perjuicio de las sugerencias efectuadas y en tanto no manejamos voluntades de terceros, no podemos garantizar resultados; es decir no podemos brindar certeza de que la marca no recibirá oposiciones.`,
      { bold: true, espacioExtra: 6 }
    );

    // ═══ PRESUPUESTO Y PLAZOS ═══
    subtitulo('Precios de Presentación');
    const busqueda = parseFloat(document.getElementById('bq-precio-busqueda')?.value || 0);
    const porClase = parseFloat(document.getElementById('bq-precio-clase')?.value || 0);
    const cantClases = clasesElegidas.length || 1;
    const otros = parseFloat(document.getElementById('bq-precio-otros')?.value || 0);
    const totalFinal = busqueda + (porClase * cantClases) + otros;

    parrafo(`Precio unitario......$ ${porClase.toLocaleString('es-AR')} finales POR MARCA Y POR CLASE (honorarios, IVA y tasa de presentación incluidos). En caso de querer avanzar con las ${cantClases} clase${cantClases === 1 ? '' : 's'}, la tarifa total es de $ ${totalFinal.toLocaleString('es-AR')} finales.`);

    y += 4;
    parrafo(
      `Una vez que la marca es concedida, habrá que abonar el servicio de obtención de título, el cual al día de hoy tiene un ` +
      `valor de $ 116.000 más IVA por clase; dicho importe es estimativo, puede variar al momento de la concesión e incluye ` +
      `la custodia de la marca por el primer año de su vigencia.\n\n` +
      `En cuanto a los plazos del procedimiento, desde que la marca es presentada hasta que la misma es concedida, puede ` +
      `variar entre 6-12 meses.\n\n` +
      `Cabe destacar que estos plazos se mantendrán siempre y cuando no existan situaciones que dilaten el proceso (ej. ` +
      `oposiciones de terceros, vistas emitidas por el Instituto, etc.) y que conllevan costos adicionales.`
    );

    y += 6;
    parrafo(`Quedo a disposición.\nSaludos, Muchas Gracias!`, { bold: true });

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
