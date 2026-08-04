/**
 * ═══════════════════════════════════════════════════════════
 *  App Controller — Navigation, Config Loading, Init
 * ═══════════════════════════════════════════════════════════
 */

const App = (() => {

    function applyConfig() {
        const cfg = window.APP_CONFIG;
        if (!cfg) return;

        // Apply brand name
        const brandName = document.getElementById('brand-name');
        const brandTagline = document.getElementById('brand-tagline');
        const headerTitle = document.getElementById('header-title');
        const headerSub = document.getElementById('header-subtitle');

        if (brandName) brandName.textContent = cfg.firm.name;
        if (brandTagline) brandTagline.textContent = cfg.firm.tagline;
        if (headerTitle) headerTitle.textContent = cfg.texts.welcomeTitle;
        if (headerSub) headerSub.textContent = cfg.texts.welcomeSubtitle;

        // Apply logo
        const logoEl = document.getElementById('brand-logo');
        if (logoEl && cfg.firm.logoUrl) {
            logoEl.innerHTML = `<img src="${cfg.firm.logoUrl}" alt="${cfg.firm.name}">`;
        } else if (logoEl) {
            logoEl.textContent = cfg.firm.name.charAt(0).toUpperCase();
        }

        // Apply primary color via CSS custom properties
        if (cfg.firm.primaryColor) {
            const hex = cfg.firm.primaryColor;
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            document.documentElement.style.setProperty('--primary', hex);
            document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
            // Lighter version
            document.documentElement.style.setProperty('--primary-light',
                `rgb(${Math.min(r + 60, 255)}, ${Math.min(g + 60, 255)}, ${Math.min(b + 60, 255)})`);
            document.documentElement.style.setProperty('--primary-dark',
                `rgb(${Math.max(r - 40, 0)}, ${Math.max(g - 40, 0)}, ${Math.max(b - 40, 0)})`);
        }

        if (cfg.firm.accentColor) {
            const hex = cfg.firm.accentColor;
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            document.documentElement.style.setProperty('--accent', hex);
            document.documentElement.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
        }

        // Footer
        const footer = document.getElementById('footer-text');
        if (footer) footer.textContent = cfg.texts.footerText;

        // Page title
        document.title = `${cfg.texts.welcomeTitle} — ${cfg.firm.name}`;
    }

    function navigate(viewName) {
        // Update nav items
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewName);
        });

        // Update views
        document.querySelectorAll('.view').forEach(v => {
            v.classList.toggle('active', v.id === `view-${viewName}`);
        });

        // Update header
        const titles = {
            dashboard: ['Panel de Control', 'Vista general de tu vigilancia de marcas'],
            alertas: ['Alertas', 'Coincidencias detectadas en el Boletín INPI'],
            cartera: ['Mi Cartera', 'Marcas bajo vigilancia activa']
        };
        const [title, sub] = titles[viewName] || ['', ''];
        const headerTitle = document.getElementById('header-title');
        const headerSub = document.getElementById('header-subtitle');
        if (headerTitle) headerTitle.textContent = title;
        if (headerSub) headerSub.textContent = sub;

        // Update alert badge count
        updateAlertBadge();

        // Close mobile sidebar
        document.querySelector('.sidebar')?.classList.remove('open');
        document.querySelector('.mobile-overlay')?.classList.remove('open');
    }

    function updateAlertBadge() {
        const badge = document.getElementById('alertas-badge');
        if (!badge) return;
        const alertas = Alertas.getCache();
        const unreviewed = alertas.filter(a => !a.revisada).length;
        if (unreviewed > 0) {
            badge.textContent = unreviewed;
            badge.style.display = 'inline-flex';
        } else {
            badge.style.display = 'none';
        }
    }

    async function init() {
        applyConfig();

        // Setup nav
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => navigate(btn.dataset.view));
        });

        // Setup hamburger
        const hamburger = document.getElementById('hamburger');
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.mobile-overlay');

        if (hamburger) {
            hamburger.addEventListener('click', () => {
                sidebar?.classList.toggle('open');
                overlay?.classList.toggle('open');
            });
        }

        if (overlay) {
            overlay.addEventListener('click', () => {
                sidebar?.classList.remove('open');
                overlay?.classList.remove('open');
            });
        }

        // Setup form
        const form = document.getElementById('form-alta');
        if (form) {
            form.addEventListener('submit', Cartera.addMarca);
        }

        // Setup tipo toggle for logo field
        const tipoSelect = document.getElementById('f-tipo');
        if (tipoSelect) {
            tipoSelect.addEventListener('change', e => {
                const campoLogo = document.getElementById('campo-logo');
                if (campoLogo) campoLogo.style.display = e.target.value === 'M' ? 'block' : 'none';
            });
        }

        // Alertas filters
        document.getElementById('filtro-tipo')?.addEventListener('change', Alertas.render);
        document.getElementById('filtro-revisada')?.addEventListener('change', Alertas.render);

        // Search
        const searchInput = document.getElementById('search-alertas');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', e => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => Alertas.setSearch(e.target.value), 200);
            });
        }

        // Export buttons
        document.getElementById('btn-export-alertas')?.addEventListener('click', () => {
            Export.exportAlertasCSV(Alertas.getCache());
        });
        document.getElementById('btn-export-cartera')?.addEventListener('click', () => {
            Export.exportCarteraCSV(Cartera.getCache());
        });

        // Load data in parallel
        const [alertas, marcas] = await Promise.all([
            Alertas.load(),
            Cartera.load()
        ]);

        // Render dashboard
        Dashboard.render(alertas, marcas);
        updateAlertBadge();

        // Navigate to dashboard
        navigate('dashboard');
    }

    return { init, navigate, updateAlertBadge };
})();

// Boot
document.addEventListener('DOMContentLoaded', App.init);
