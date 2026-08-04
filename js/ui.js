/**
 * ═══════════════════════════════════════════════════════════
 *  UI Utilities — Toast, Modal, Skeleton, Helpers
 * ═══════════════════════════════════════════════════════════
 */

const UI = (() => {
    // ── Toast ──────────────────────────────────────────
    function getToastContainer() {
        let c = document.querySelector('.toast-container');
        if (!c) {
            c = document.createElement('div');
            c.className = 'toast-container';
            document.body.appendChild(c);
        }
        return c;
    }

    function toast(message, type = 'info', duration = 3500) {
        const icons = { success: '✓', error: '✕', info: 'ℹ' };
        const el = document.createElement('div');
        el.className = `toast toast--${type}`;
        el.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
        getToastContainer().appendChild(el);

        setTimeout(() => {
            el.classList.add('exit');
            setTimeout(() => el.remove(), 300);
        }, duration);
    }

    // ── Confirm Modal ─────────────────────────────────
    function confirm(title, body) {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
        <div class="modal">
          <div class="modal__title">${title}</div>
          <div class="modal__body">${body}</div>
          <div class="modal__actions">
            <button class="btn btn--secondary" data-action="cancel">Cancelar</button>
            <button class="btn btn--primary" data-action="confirm">Confirmar</button>
          </div>
        </div>
      `;
            document.body.appendChild(overlay);

            overlay.addEventListener('click', e => {
                const action = e.target.dataset.action;
                if (action === 'confirm') { resolve(true); overlay.remove(); }
                else if (action === 'cancel' || e.target === overlay) { resolve(false); overlay.remove(); }
            });
        });
    }

    // ── Skeleton Loader ───────────────────────────────
    function skeletonRows(count = 5, cols = 6) {
        return Array(count).fill(0).map(() =>
            `<tr>${Array(cols).fill(0).map(() =>
                `<td><div class="skeleton skeleton--text"></div></td>`
            ).join('')}</tr>`
        ).join('');
    }

    function skeletonCards(count = 4) {
        return Array(count).fill(0).map(() =>
            `<div class="card skeleton skeleton--card"></div>`
        ).join('');
    }

    // ── Helpers ───────────────────────────────────────
    function formatDate(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function daysUntil(dateStr) {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        const now = new Date();
        return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    }

    function expiryBadge(dateStr) {
        const days = daysUntil(dateStr);
        if (days === null) return '';
        if (days < 0) return `<span class="expiry-badge expiry-badge--urgent">Vencida</span>`;
        if (days <= 30) return `<span class="expiry-badge expiry-badge--urgent">${days}d</span>`;
        if (days <= 90) return `<span class="expiry-badge expiry-badge--soon">${days}d</span>`;
        return `<span class="expiry-badge expiry-badge--ok">${days}d</span>`;
    }

    function scoreColor(score) {
        if (score >= 0.85) return 'danger';
        if (score >= 0.5) return 'warning';
        return 'success';
    }

    function scoreBadgeClass(score) {
        if (score >= 0.85) return 'badge--danger';
        if (score >= 0.5) return 'badge--warning';
        return 'badge--success';
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ── File to Base64 ────────────────────────────────
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result.split(',')[1]);
            r.onerror = reject;
            r.readAsDataURL(file);
        });
    }

    return {
        toast, confirm, skeletonRows, skeletonCards,
        formatDate, daysUntil, expiryBadge,
        scoreColor, scoreBadgeClass, escapeHtml, fileToBase64
    };
})();
