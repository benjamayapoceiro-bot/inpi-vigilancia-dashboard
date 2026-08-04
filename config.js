/**
 * ═══════════════════════════════════════════════════════════════
 *  CONFIGURACIÓN DEL CLIENTE — INPI Vigilancia Dashboard
 * ═══════════════════════════════════════════════════════════════
 *  Para vender a otro estudio jurídico:
 *  1. Duplicar este repositorio
 *  2. Cambiar SOLO este archivo con los datos del nuevo cliente
 *  3. Deploy en GitHub Pages / Netlify / Vercel
 * ═══════════════════════════════════════════════════════════════
 */
window.APP_CONFIG = {
  // ── Datos del estudio ──────────────────────────────
  firm: {
    name: "Alpha Gestoría 360",
    tagline: "Vigilancia Inteligente de Marcas",
    logoUrl: null,              // URL del logo del estudio (null = usa icono default)
    primaryColor: "#6C5CE7",    // Color principal de la marca
    accentColor: "#00CEC9",     // Color de acento
    contactEmail: "info@alphagestoria.com",
    contactPhone: "+54 11 1234-5678",
  },

  // ── Supabase backend ───────────────────────────────
  supabase: {
    url: "https://oomczohvjqycpuhhmotv.supabase.co",
    anonKey: "sb_publishable_OwKVJX834gmqXdjT8o3DGg_Tdz5YZpa",
  },

  // ── Features toggle ────────────────────────────────
  features: {
    exportCSV: true,
    exportPrint: true,
    logoComparison: true,
    expirationAlerts: true,
    analyticsView: true,
  },

  // ── Textos personalizables ─────────────────────────
  texts: {
    welcomeTitle: "Panel de Vigilancia",
    welcomeSubtitle: "Monitoreo automático del Boletín de Marcas INPI",
    footerText: "Sistema de vigilancia automática — cruza texto y logos contra el Boletín de Marcas del INPI semanalmente.",
  }
};
