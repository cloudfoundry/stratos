module.exports = {
  title: 'STRATOS',
  tagline: 'Open-Source Multi-Cluster UI for Cloud Foundry and Kubernetes',
  url: 'https://stratos.app',
  baseUrl: '/',
  favicon: 'img/favicon.ico',
  organizationName: 'cloudfoundry',
  projectName: 'stratos',
  themeConfig: {
    disableDarkMode: true,
    navbar: {
      title: 'STRATOS',
      logo: {
        alt: 'Stratos',
        src: 'img/logo.png',
      },
      links: [
        {
          to: 'docs/',
          activeBasePath: 'docs',
          label: 'Docs',
          position: 'right',
        },
        // {to: 'blog', label: 'Blog', position: 'left'},
        {
          href: 'https://github.com/cloudfoundry/stratos',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: 'docs/',
            },
            {
              label: 'Deploying Stratos',
              to: 'docs/deploy/overview',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
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
          items: [
            {
              label: 'Presentations and Talks',
              to: 'docs/talks',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Cloud Foundry Foundation`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          // It is recommended to set document id as docs home page (`docs/` path).
          homePageId: 'introduction',
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl:
            'https://github.com/cloudfoundry/stratos/edit/master/website/',
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
