module.exports = {
  title: 'STRATOS',
  tagline: 'Open-Source Multi-Cluster UI for Cloud Foundry and Kubernetes',
  url: 'https://stratos.app',
  baseUrl: '/',
  favicon: 'img/favicon.ico',
  organizationName: 'cloudfoundry',
  onBrokenLinks: 'warn',
  projectName: 'stratos',
  // Parse .md files as plain Markdown (not MDX) to avoid JSX errors
  // in auto-generated docs like contributing.md
  markdown: {
    format: 'detect',
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  themeConfig: {
    navbar: {
      title: 'STRATOS',
      logo: {
        alt: 'Stratos',
        src: 'img/logo.png',
      },
      items: [
      // Uncomment when versioned_docs are generated
      // {
      //   type: 'docsVersionDropdown',
      //   position: 'right',
      //   dropdownItemsAfter: [{to: '/versions', label: 'All versions'}],
      // },
      {
        to: 'docs/introduction',
        activeBasePath: 'docs',
        label: 'Docs',
        position: 'right',
      }, {
        href: 'https://github.com/cloudfoundry/stratos',
        label: 'GitHub',
        position: 'right',
      }],
    },
    footer: {
      style: 'dark',
      links: [{
        title: 'Docs',
        items: [{
          label: 'Getting Started',
          to: 'docs/introduction',
        },
        {
          label: 'Deploying Stratos',
          to: 'docs/deploy/overview',
        },
        ],
      },
      {
        title: 'Community',
        items: [{
          label: 'Slack',
          href: 'https://cloudfoundry.slack.com/?redir=%2Fmessages%2Fstratos',
        },
        {
          label: 'GitHub',
          href: 'https://github.com/cloudfoundry/stratos',
        },
        ],
      },

      {
        title: 'More',
        items: [{
          label: 'Presentations and Talks',
          to: 'docs/talks',
        },],
      },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Cloud Foundry Foundation`,
    },
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          // It is recommended to set document id as docs home page (`docs/` path).
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl: 'https://github.com/cloudfoundry/stratos/edit/master/website/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
  stylesheets: [
    //'https://fonts.googleapis.com/icon?family=Material+Icons'
  ]
};
