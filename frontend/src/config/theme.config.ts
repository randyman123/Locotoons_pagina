// Tema visual actual de Locotoons.
// Este archivo documenta el sistema de colores y tipografías sin modificar el CSS.
// Para aplicarlo: conectar cada valor al CSS custom property correspondiente en index.css.

export const THEME = {
  // ─── Variables CSS (:root en index.css) ────────────────────────────────────
  // Cambiar aquí + en index.css:root para rethemear el sitio completo.
  cssVars: {
    pageBg: '#e6e6e6',
    surface: '#ffffff',
    border: '#cfcfcf',
    borderStrong: '#a9a9a9',
    text: '#4f4f4f',
    textStrong: '#1f1f1f',
    muted: '#767676',
    accent: '#bd151f',
  },

  // ─── Familia roja de marca (hardcodeados en App.css) ──────────────────────
  // Todos derivan del accent base. rgba(189, 21, 31, x) = accent base con opacidad.
  // rgba(171, 18, 29, x) = accentDark con opacidad.
  accent: {
    base: '#bd151f',    // --accent en index.css — logo, links activos, foco de inputs
    light: '#cf222b',   // botón primario — gradiente inicio
    dark: '#ab121d',    // botón primario — gradiente fin, sombras hover
    darker: '#9f111b',  // top-strip — bordes del gradiente
    medium: '#c61d25',  // top-strip — centro del gradiente
    xdark: '#8a1d24',   // texto de error rojo
  },

  // ─── Gradientes semánticos ────────────────────────────────────────────────
  gradients: {
    topStrip: 'linear-gradient(90deg, #9f111b 0%, #c61d25 48%, #9f111b 100%)',
    buttonPrimary: 'linear-gradient(180deg, #cf222b 0%, #ab121d 100%)',
    buttonWhatsapp: 'linear-gradient(180deg, #c0252d 0%, #951019 100%)',
    buttonWhatsappGreen: 'linear-gradient(180deg, #2dc96b 0%, #17994c 100%)',
  },

  // ─── Paleta de navegación (barra oscura de categorías) ───────────────────
  nav: {
    bg: '#161616',
    border: '#0d0d0d',
    activeGradientStart: '#2a2a2a',
    activeGradientEnd: '#111111',
    activeBorder: '#353535',
    text: '#ffffff',
  },

  // ─── Colores funcionales (estado, feedback) ───────────────────────────────
  status: {
    errorBg: '#fff1f1',
    errorBorder: '#d89ca1',
    errorText: '#8a1d24',
    successBg: '#f5f8f5',
    successBorder: '#c9d8cc',
    successText: '#3e4d42',
    warningBg: '#fff1c7',
    warningBorder: '#e5bf4d',
    warningText: '#765300',
  },

  // ─── Verde WhatsApp ────────────────────────────────────────────────────────
  whatsapp: {
    gradientStart: '#2dc96b',
    gradientEnd: '#17994c',
  },

  // ─── Tipografías ──────────────────────────────────────────────────────────
  fonts: {
    heading: "'Trebuchet MS', 'Segoe UI', Tahoma, sans-serif",
    body: 'Arial, Helvetica, sans-serif',
  },
};
