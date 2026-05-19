// Tailwind v4 PostCSS pipeline.
// v4 has native CSS Nesting and Lightning-CSS-based vendor prefixing,
// so the v3 helpers (tailwindcss/nesting + autoprefixer) are gone.
// @tailwindcss/postcss reads @import "tailwindcss" / @theme blocks from
// the entry stylesheet; there is no separate config-file argument in v4.
module.exports = {
  plugins: [
    require('@tailwindcss/postcss'),
  ],
};
