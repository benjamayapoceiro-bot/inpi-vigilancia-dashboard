/**
 * ═══════════════════════════════════════════════════════════
 *  Dashboard View — Analytics & Overview
 * ═══════════════════════════════════════════════════════════
 */

const Dashboard = (() => {
    function render(alertas, marcas) {
        const view = document.getElementById('view-dashboard');
        if (!view) return;

        const totalAlertas = alertas.length;
        const alertasAltas = alertas.filter(a => (a.similitud_score || 0) >= 0.85).length;
        const alertasMedias = alertas.filter(a => {
            const s = a.similitud_score || 0;
            return s >= 0.5 && s < 0.85;
        }).length;
        const totalMarcas = marcas.length;
        const noRevisadas = alertas.filter(a => !a.revisada).length;

        // Count expiring brands
        const expiringCount = marcas.filter(m => {
            if (!m.fecha_vencimiento) return false;
            const days = UI.daysUntil(m.fecha_vencimiento);
            return days !== null && days >= 0 && days <= 90;
        }).length;

        view.innerHTML = `
      <!-- Stats Grid -->
      <div class="stat-grid stagger-enter">
        <div class="card card--stat hover-lift">
          <div class="stat-icon purple">🔍</div>
          <div class="stat-value">${totalMarcas}</div>
          <div class="stat-label">Marcas vigiladas</div>
        </div>
        <div class="card card--stat hover-lift">
          <div class="stat-icon cyan">🔔</div>
          <div class="stat-value">${totalAlertas}</div>
          <div class="stat-label">Alertas totales</div>
        </div>
        <div class="card card--stat hover-lift">
          <div class="stat-icon red">⚠️</div>
          <div class="stat-value">${alertasAltas}</div>
          <div class="stat-label">Requieren oposición (&gt;85%)</div>
        </div>
        <div class="card card--stat hover-lift">
          <div class="stat-icon green">📋</div>
          <div class="stat-value">${noRevisadas}</div>
          <div class="stat-label">Sin revisar</div>
        </div>
      </div>

      <!-- Two column layout -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-lg);">
        <!-- Severity Distribution -->
        <div class="card">
          <h3 style="margin-bottom: var(--space-lg); font-size: 0.9375rem;">Distribución por severidad</h3>
          ${renderSeverityChart(alertasAltas, alertasMedias, totalAlertas - alertasAltas - alertasMedias, totalAlertas)}
        </div>

        <!-- Quick Info -->
        <div class="card">
          <h3 style="margin-bottom: var(--space-lg); font-size: 0.9375rem;">Resumen rápido</h3>
          <div class="quick-info-list">
            ${renderInfoItem('Próximo escaneo', 'Jueves automático', '🗓️')}
            ${renderInfoItem('Marcas por vencer (90d)', expiringCount.toString(), '⏰')}
            ${renderInfoItem('Alertas de texto', alertas.filter(a => a.tipo_match === 'texto').length.toString(), '📝')}
            ${renderInfoItem('Alertas de logo', alertas.filter(a => a.tipo_match === 'logo').length.toString(), '🖼️')}
          </div>
        </div>
      </div>

      ${totalAlertas > 0 ? `
      <!-- Recent Alerts -->
      <div class="card" style="margin-top: var(--space-lg);">
        <div class="section-header" style="margin-bottom: var(--space-md);">
          <h3 style="font-size: 0.9375rem;">Últimas alertas</h3>
          <button class="btn btn--ghost btn--sm" onclick="App.navigate('alertas')">Ver todas →</button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Score</th>
              <th>Marca</th>
              <th>Clase</th>
              <th>Titular</th>
            </tr>
          </thead>
          <tbody>
            ${alertas.slice(0, 5).map(a => {
            const pct = Math.round((a.similitud_score || 0) * 100);
            const colorClass = UI.scoreColor(a.similitud_score || 0);
            const titulares = (a.titular_nuevo || []).map(t => t.nombre).join(', ') || '—';
            return `
                <tr>
                  <td>
                    <div class="score-bar">
                      <div class="score-bar__track">
                        <div class="score-bar__fill score-bar__fill--${colorClass}" style="width: ${pct}%"></div>
                      </div>
                      <span class="score-bar__value" style="color: var(--${colorClass})">${pct}%</span>
                    </div>
                  </td>
                  <td class="marca-name">${UI.escapeHtml(a.denominacion_nueva) || '(mixta)'}</td>
                  <td>${a.clase || '—'}</td>
                  <td>${UI.escapeHtml(titulares)}</td>
                </tr>
              `;
        }).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
    `;
    }

    function renderSeverityChart(alta, media, baja, total) {
        if (total === 0) {
            return `<div class="empty-state">
        <div class="empty-state__icon">📊</div>
        <div class="empty-state__title">Sin alertas aún</div>
        <div class="empty-state__desc">Cuando el sistema detecte coincidencias, aparecerán aquí.</div>
      </div>`;
        }

        const pctAlta = total > 0 ? Math.round((alta / total) * 100) : 0;
        const pctMedia = total > 0 ? Math.round((media / total) * 100) : 0;
        const pctBaja = total > 0 ? 100 - pctAlta - pctMedia : 0;

        return `
      <div class="severity-chart">
        <!-- Stacked bar -->
        <div style="height: 12px; border-radius: 6px; overflow: hidden; display: flex; background: var(--bg-elevated); margin-bottom: var(--space-lg);">
          ${pctAlta > 0 ? `<div style="width: ${pctAlta}%; background: var(--danger); transition: width 0.6s ease;"></div>` : ''}
          ${pctMedia > 0 ? `<div style="width: ${pctMedia}%; background: var(--warning); transition: width 0.6s ease;"></div>` : ''}
          ${pctBaja > 0 ? `<div style="width: ${pctBaja}%; background: var(--success); transition: width 0.6s ease;"></div>` : ''}
        </div>
        <!-- Legend -->
        <div style="display: flex; flex-direction: column; gap: var(--space-sm);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: var(--space-sm);">
              <div style="width: 10px; height: 10px; border-radius: 3px; background: var(--danger);"></div>
              <span style="font-size: 0.8125rem; color: var(--text-secondary);">Alta (&gt;85%)</span>
            </div>
            <span style="font-family: var(--font-mono); font-size: 0.8125rem; font-weight: 600; color: var(--danger);">${alta}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: var(--space-sm);">
              <div style="width: 10px; height: 10px; border-radius: 3px; background: var(--warning);"></div>
              <span style="font-size: 0.8125rem; color: var(--text-secondary);">Media (50-85%)</span>
            </div>
            <span style="font-family: var(--font-mono); font-size: 0.8125rem; font-weight: 600; color: var(--warning);">${media}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: var(--space-sm);">
              <div style="width: 10px; height: 10px; border-radius: 3px; background: var(--success);"></div>
              <span style="font-size: 0.8125rem; color: var(--text-secondary);">Baja (&lt;50%)</span>
            </div>
            <span style="font-family: var(--font-mono); font-size: 0.8125rem; font-weight: 600; color: var(--success);">${baja}</span>
          </div>
        </div>
      </div>
    `;
    }

    function renderInfoItem(label, value, icon) {
        return `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-sm) 0; border-bottom: 1px solid var(--border);">
        <div style="display: flex; align-items: center; gap: var(--space-sm);">
          <span>${icon}</span>
          <span style="font-size: 0.8125rem; color: var(--text-secondary);">${label}</span>
        </div>
        <span style="font-family: var(--font-mono); font-size: 0.8125rem; font-weight: 600;">${value}</span>
      </div>
    `;
    }

    return { render };
})();
