const postcss = require('postcss');
const nested = require('postcss-nested');

// postcss-nested uses PostCSS v8 visitor API (phase 2), but Tailwind's
// detectNesting runs in phase 1 (runOnRoot). Wrapping in an Once handler
// forces nesting to be expanded in phase 1, before Tailwind sees it.
const nestedOnce = {
  postcssPlugin: 'postcss-nested-once',
  Once(root) {
    postcss([nested]).process(root).sync();
  },
};

module.exports = {
  plugins: [
    nestedOnce,
    require('tailwindcss'),
    require('autoprefixer'),
  ],
};
