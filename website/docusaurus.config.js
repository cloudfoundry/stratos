// @ts-check
// See: https://docusaurus.io/docs/api/docusaurus-config

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'STRATOS',
  tagline: 'Open-Source Multi-Cluster UI for Cloud Foundry and Kubernetes',
  favicon: 'img/favicon.ico',

  // Overridable so the GitHub Pages workflow can build for
  // cloudfoundry.github.io/stratos/ until the custom domain lands.
  url: process.env.SITE_URL || 'https://stratos.app',
  baseUrl: process.env.SITE_BASE_URL || '/',

  organizationName: 'cloudfoundry',
  projectName: 'stratos',

  onBrokenLinks: 'throw',
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'throw'
    }
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en']
  },

  future: {
    faster: true,
    v4: true
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          // The single documentation tree lives at the repo root so it
          // renders on GitHub as well; the site is a projection of it.
          path: '../docs',
          sidebarPath: './sidebars.js',
          editUrl: 'https://github.com/cloudfoundry/stratos/edit/develop/',
          editCurrentVersion: true,
          exclude: [
            'planning/**',
            'issue_template.md',
            'pull_request_template.md'
          ],
          beforeDefaultRemarkPlugins: [
            require('./src/plugins/remark-github-alerts')
          ]
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css'
        }
      })
    ]
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/logo.png',
      colorMode: {
        defaultMode: 'light',
        disableSwitch: false,
        respectPrefersColorScheme: true
      },
      navbar: {
        title: 'STRATOS',
        logo: {
          alt: 'Stratos Logo',
          src: 'img/logo.svg'
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'docs',
            position: 'left',
            label: 'Docs'
          },
          {
            href: 'https://github.com/cloudfoundry/stratos',
            position: 'right',
            className: 'header-github-link',
            'aria-label': 'GitHub repository'
          }
        ]
      },
      docs: {
        sidebar: {
          autoCollapseCategories: true,
          hideable: true
        }
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Introduction',
                to: '/docs/'
              },
              {
                label: 'Getting Started',
                to: 'docs/deploy/overview'
              },
              {
                label: 'Contributing',
                to: 'docs/contributing_guide'
              }
            ]
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Slack',
                href: 'https://cloudfoundry.slack.com/?redir=%2Fmessages%2Fstratos'
              },
              {
                label: 'GitHub',
                href: 'https://github.com/cloudfoundry/stratos'
              }
            ]
          },
          {
            title: 'More',
            items: [
              {
                label: 'Presentations and Talks',
                to: 'docs/talks'
              }
            ]
          }
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Cloud Foundry Foundation`
      },
      prism: {
        additionalLanguages: ['bash', 'json', 'yaml', 'go', 'scss']
      }
    }),

  themes: [
    '@docusaurus/theme-mermaid',
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        indexPages: true,
        docsRouteBasePath: '/docs',
        hashed: true,
        language: ['en'],
        highlightSearchTermsOnTargetPage: false,
        searchResultContextMaxLength: 50,
        searchResultLimits: 8,
        searchBarShortcut: true,
        searchBarShortcutHint: true
      }
    ]
  ],
  plugins: [
    ['./src/plugins/webpack-alias.js', {}],
    ['./src/plugins/tailwind-config.js', {}]
  ]
}

export default config
