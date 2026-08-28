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
            const metodosConRepresentacion = ['POST', 'PATCH', 'DELETE'];
            const usarJsonHeaders = options.body || metodosConRepresentacion.includes(options.method);
            const res = await fetch(`${cfg().url}${endpoint}`, {
                ...options,
                headers: usarJsonHeaders ? jsonHeaders() : headers()
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

        async updateAlerta(id, data) {
            const result = await request(`/rest/v1/alertas?id=eq.${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data)
            });
            if (!Array.isArray(result) || result.length === 0) {
                throw new Error('La actualización no afectó ninguna fila (revisar permisos en Supabase)');
            }
            return result;
        },

        // ── Búsqueda contra histórico (actas_historicas) ──
        async buscarSimilares(q, clase = null, umbral = 0.25, limite = 30) {
            return request('/rest/v1/rpc/buscar_marcas_similares', {
                method: 'POST',
                body: JSON.stringify({ q, clase_filtro: clase, umbral, limite })
            });
        },

        // ── Plazos legales ─────────────────────────
        async getPlazos(marcaId = null) {
            const filtro = marcaId ? `&marca_vigilada_id=eq.${marcaId}` : '';
            return request(`/rest/v1/plazos_legales?select=*&order=fecha_vencimiento.asc${filtro}`);
        },

        async getPlazosProximos(dias = 30) {
            const limite = new Date(Date.now() + dias * 86400000).toISOString().slice(0, 10);
            return request(`/rest/v1/plazos_legales?select=*,marcas_vigiladas(nombre,cliente)&estado=in.(pendiente,en_gestion)&fecha_vencimiento=lte.${limite}&order=fecha_vencimiento.asc`);
        },

        async addPlazo(plazo) {
            return request('/rest/v1/plazos_legales', {
                method: 'POST',
                body: JSON.stringify(plazo)
            });
        },

        async updatePlazo(id, data) {
            const result = await request(`/rest/v1/plazos_legales?id=eq.${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data)
            });
            if (!Array.isArray(result) || result.length === 0) {
                throw new Error('La actualización no afectó ninguna fila (revisar permisos en Supabase)');
            }
            return result;
        },

        async deletePlazo(id) {
            return request(`/rest/v1/plazos_legales?id=eq.${id}`, { method: 'DELETE' });
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
            const result = await request(`/rest/v1/marcas_vigiladas?id=eq.${id}`, {
                method: 'DELETE'
            });
            if (!Array.isArray(result) || result.length === 0) {
                throw new Error('El borrado no afectó ninguna fila (revisar permisos en Supabase)');
            }
            return result;
        }
    };
})();
