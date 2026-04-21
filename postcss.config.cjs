const path = require('path');

// Explicit absolute config path: vitest runs from sub-packages where
// tailwindcss's default config resolution (relative to process.cwd())
// can't find the monorepo-root tailwind.config.js, causing
// `Cannot read properties of undefined (reading 'config')`.
module.exports = {
  plugins: [
    require('tailwindcss/nesting'),
    require('tailwindcss')({ config: path.join(__dirname, 'tailwind.config.js') }),
    require('autoprefixer'),
  ],
};
