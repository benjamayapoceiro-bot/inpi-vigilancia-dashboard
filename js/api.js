/**
 * ═══════════════════════════════════════════════════════════
 *  API Layer — Supabase abstraction
 *  Reads credentials from window.APP_CONFIG
 * ═══════════════════════════════════════════════════════════
 */

const API = (() => {
    const cfg = () => window.APP_CONFIG.supabase;
    const headers = () => ({
        apikey: cfg().anonKey,
        Authorization: `Bearer ${cfg().anonKey}`
    });
    const jsonHeaders = () => ({
        ...headers(),
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
    });

    async function request(endpoint, options = {}) {
        try {
            const res = await fetch(`${cfg().url}${endpoint}`, {
                ...options,
                headers: options.body ? jsonHeaders() : headers()
            });
            if (!res.ok) {
                const err = await res.text();
                throw new Error(`API Error ${res.status}: ${err}`);
            }
            const text = await res.text();
            return text ? JSON.parse(text) : null;
        } catch (err) {
            console.error('[API]', err);
            throw err;
        }
    }

    return {
        // ── Alertas ────────────────────────────────
        async getAlertas(limit = 500) {
            return request(`/rest/v1/alertas?select=*&order=similitud_score.desc&limit=${limit}`);
        },

        async markRevisada(id, revisada) {
            const result = await request(`/rest/v1/alertas?id=eq.${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ revisada })
            });
            if (!Array.isArray(result) || result.length === 0) {
                throw new Error('La actualización no afectó ninguna fila (revisar permisos en Supabase)');
            }
            return result;
        },

        // ── Cartera ────────────────────────────────
        async getMarcas() {
            return request('/rest/v1/marcas_vigiladas?select=*&order=created_at.desc');
        },

        async addMarca(marca) {
            return request('/rest/v1/marcas_vigiladas', {
                method: 'POST',
                body: JSON.stringify(marca)
            });
        },

        async updateMarca(id, data) {
            const result = await request(`/rest/v1/marcas_vigiladas?id=eq.${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data)
            });
            if (!Array.isArray(result) || result.length === 0) {
                throw new Error('La actualización no afectó ninguna fila (revisar permisos en Supabase)');
            }
            return result;
        },

        async deleteMarca(id) {
            return request(`/rest/v1/marcas_vigiladas?id=eq.${id}`, {
                method: 'DELETE'
            });
        }
    };
})();
