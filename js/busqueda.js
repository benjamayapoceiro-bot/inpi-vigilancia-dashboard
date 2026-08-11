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
          <h3 style="font-size: 0.9375rem;">Resultados de la búsqueda (carga manual)</h3>
          <button class="btn btn--secondary btn--sm" id="bq-add-resultado" type="button">＋ Agregar coincidencia</button>
        </div>
        <table class="data-table">
          <thead>
            <tr><th>Marca similar encontrada</th><th>Clase</th><th>Titular</th><th>Riesgo</th><th></th></tr>
          </thead>
          <tbody id="bq-tbody-resultados"></tbody>
        </table>
        <div id="bq-empty-resultados" style="padding: var(--space-md) 0; color: var(--text-tertiary); font-size: 0.8125rem;">
          Sin coincidencias cargadas todavía. Si la búsqueda dio negativa, dejalo así y va a figurar como "sin antecedentes" en el PDF.
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
                    `<span class="badge badge--info" style="margin-right:6px; margin-bottom:6px; display:inline-block; cursor:pointer;" onclick="Busqueda.agregarClase(${c.n})">＋ Clase ${c.n} — ${c.titulo}</span>`
                ).join('');
        });

        ['bq-precio-busqueda', 'bq-precio-clase', 'bq-precio-otros'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', actualizarTotal);
        });
        document.getElementById('bq-generar-pdf')?.addEventListener('click', generarPDF);
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
        let y = 20;

        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text(cfg.firm.name, 14, y);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(cfg.firm.tagline || '', 14, y + 6);
        doc.text(`${cfg.firm.contactEmail || ''}  ${cfg.firm.contactPhone || ''}`, 14, y + 11);
        doc.setDrawColor(200);
        doc.line(14, y + 15, 196, y + 15);
        y += 26;

        doc.setFontSize(13);
        doc.setFont(undefined, 'bold');
        doc.text('Informe de búsqueda de antecedentes marcarios', 14, y);
        y += 8;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Fecha: ${fecha}`, 14, y); y += 6;
        doc.text(`Cliente: ${cliente}`, 14, y); y += 6;
        doc.text(`Marca solicitada: ${marca}`, 14, y); y += 6;
        if (descripcion) { doc.text(`Actividad/producto: ${descripcion}`, 14, y); y += 6; }
        y += 4;

        doc.setFont(undefined, 'bold');
        doc.text('Clases a presentar (Clasificación de Niza):', 14, y); y += 6;
        doc.setFont(undefined, 'normal');
        if (clasesElegidas.length === 0) {
            doc.text('(sin clases elegidas todavía)', 18, y); y += 5;
        } else {
            clasesElegidas.forEach(c => {
                doc.text(`• Clase ${c.n} — ${c.titulo}`, 18, y); y += 5;
            });
        }
        y += 4;

        doc.setFont(undefined, 'bold');
        doc.text('Resultado de la búsqueda de antecedentes:', 14, y); y += 7;
        doc.setFont(undefined, 'normal');

        if (resultados.length === 0) {
            doc.text('No se encontraron antecedentes similares que impidan el registro.', 14, y);
            y += 8;
        } else {
            const headers = ['Marca similar', 'Clase', 'Titular', 'Riesgo'];
            const colX = [14, 90, 115, 165];
            doc.setFont(undefined, 'bold');
            headers.forEach((h, i) => doc.text(h, colX[i], y));
            y += 5;
            doc.setDrawColor(200);
            doc.line(14, y - 2, 196, y - 2);
            doc.setFont(undefined, 'normal');
            resultados.forEach(r => {
                if (y > 270) { doc.addPage(); y = 20; }
                doc.text(String(r.marca || '—').slice(0, 30), colX[0], y);
                doc.text(String(r.clase || '—'), colX[1], y);
                doc.text(String(r.titular || '—').slice(0, 20), colX[2], y);
                doc.text(String(r.riesgo || '—'), colX[3], y);
                y += 6;
            });
            y += 6;
        }

        if (y > 240) { doc.addPage(); y = 20; }

        doc.setFont(undefined, 'bold');
        doc.text('Presupuesto estimado:', 14, y); y += 7;
        doc.setFont(undefined, 'normal');
        const busqueda = parseFloat(document.getElementById('bq-precio-busqueda')?.value || 0);
        const porClase = parseFloat(document.getElementById('bq-precio-clase')?.value || 0);
        const cantClases = clasesElegidas.length;
        const otros = parseFloat(document.getElementById('bq-precio-otros')?.value || 0);
        doc.text(`Búsqueda de antecedentes: ${busqueda === 0 ? 'SIN CARGO' : '$' + busqueda.toLocaleString('es-AR')}`, 18, y); y += 6;
        doc.text(`Presentación (${cantClases} clase${cantClases !== 1 ? 's' : ''} x $${porClase.toLocaleString('es-AR')}): $${(porClase * cantClases).toLocaleString('es-AR')}`, 18, y); y += 6;
        if (otros > 0) { doc.text(`Otros: $${otros.toLocaleString('es-AR')}`, 18, y); y += 6; }
        y += 2;
        doc.setFont(undefined, 'bold');
        doc.text(`TOTAL: $${total.toLocaleString('es-AR')}`, 18, y);
        y += 12;

        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(120);
        doc.text('Este informe es orientativo y no constituye garantía de concesión del registro. La resolución final depende del INPI.', 14, y);

        doc.save(`busqueda-previa-${marca.replace(/\s+/g, '-').toLowerCase()}.pdf`);
        UI.toast('PDF generado', 'success');
    }

    function reset() {
        resultados = [];
        clasesElegidas = [];
    }

    return { render, agregar, editar, borrar, agregarClase, quitarClase, reset };
})();
