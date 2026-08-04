/**
 * ═══════════════════════════════════════════════════════════
 *  Export — CSV + Print-friendly export for alertas & cartera
 * ═══════════════════════════════════════════════════════════
 */

const Export = (() => {
    function toCSV(headers, rows) {
        const escape = v => `"${String(v || '').replace(/"/g, '""')}"`;
        const lines = [
            headers.map(escape).join(','),
            ...rows.map(r => r.map(escape).join(','))
        ];
        return lines.join('\n');
    }

    function download(filename, content, type = 'text/csv') {
        const blob = new Blob(['\uFEFF' + content], { type: `${type};charset=utf-8` });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    function exportAlertasCSV(alertas) {
        const headers = ['Score %', 'Marca nueva', 'Clase', 'Tipo', 'Titular', 'Boletín', 'Acta', 'Revisada'];
        const rows = alertas.map(a => [
            Math.round((a.similitud_score || 0) * 100),
            a.denominacion_nueva || '(mixta)',
            a.clase,
            a.tipo_match,
            (a.titular_nuevo || []).map(t => t.nombre).join('; '),
            a.boletin_numero || '',
            a.acta_nueva || '',
            a.revisada ? 'Sí' : 'No'
        ]);

        const date = new Date().toISOString().slice(0, 10);
        const firm = window.APP_CONFIG?.firm?.name || 'export';
        download(`alertas_${firm.replace(/\s+/g, '_')}_${date}.csv`, toCSV(headers, rows));
        UI.toast('CSV de alertas descargado', 'success');
    }

    function exportCarteraCSV(marcas) {
        const headers = ['Marca', 'Clase', 'Tipo', 'Cliente', 'Vencimiento'];
        const rows = marcas.map(m => [
            m.nombre || '(logo sin texto)',
            m.clase,
            m.tipo === 'M' ? 'Mixta' : 'Denominativa',
            m.cliente || '',
            m.fecha_vencimiento || ''
        ]);

        const date = new Date().toISOString().slice(0, 10);
        const firm = window.APP_CONFIG?.firm?.name || 'export';
        download(`cartera_${firm.replace(/\s+/g, '_')}_${date}.csv`, toCSV(headers, rows));
        UI.toast('CSV de cartera descargado', 'success');
    }

    return { exportAlertasCSV, exportCarteraCSV };
})();
