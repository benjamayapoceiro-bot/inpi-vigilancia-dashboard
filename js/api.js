/**
 * ═══════════════════════════════════════════════════════════
 *  API Layer — Supabase abstraction
 *  Reads credentials from window.APP_CONFIG
 * ═══════════════════════════════════════════════════════════
 */

const API = (() => {
    const cfg = () => window.APP_CONFIG.supabase;
    const getAuthToken = () => {
        try {
            const raw = localStorage.getItem('sb-oomczohvjqycpuhhmotv-auth-token');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed.access_token) return parsed.access_token;
            }
        } catch {}
        try {
            const raw2 = localStorage.getItem('supabase.auth.token');
            if (raw2) {
                const p = JSON.parse(raw2);
                if (p.currentSession?.access_token) return p.currentSession.access_token;
            }
        } catch {}
        return null;
    };
    const headers = () => {
        const token = getAuthToken();
        return {
            apikey: cfg().anonKey,
            Authorization: `Bearer ${token || cfg().anonKey}`
        };
    };
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
        request,
        // ── Alertas ────────────────────────────────
        async getAlertas(limit = 500) {
            return request(`/rest/v1/alertas?select=*,marcas_vigiladas(nombre,numero_acta)&order=similitud_score.desc&limit=${limit}`);
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
        },

        async buscarClaseNiza(q, limite = 6) {
            try {
                return await request('/rest/v1/rpc/buscar_clase_niza', {
                    method: 'POST',
                    body: JSON.stringify({ q, limite })
                });
            } catch (e) {
                console.warn('[API] buscar_clase_niza fallo, fallback local', e);
                return null;
            }
        },

        async getDetalleActa(acta) {
            const r = await request(`/rest/v1/detalle_actas_inpi?acta=eq.${encodeURIComponent(acta)}&select=*&limit=1`);
            return r && r[0] ? r[0] : null;
        },

        async saveDetalleActa(detalle) {
            return request('/rest/v1/detalle_actas_inpi', {
                method: 'POST',
                headers: { ...jsonHeaders(), Prefer: 'resolution=merge-duplicates' },
                body: JSON.stringify(detalle)
            });
        }
    };
})();
