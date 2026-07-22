// @ts-check

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docs: [
    {
      type: 'category',
      label: 'Stratos',
      collapsed: false,
      items: ['introduction', 'overview', 'license']
    },
    {
      type: 'category',
      label: 'Deploy',
      items: [
        'deploy/overview',
        {
          type: 'category',
          label: 'Cloud Foundry',
          items: [
            'deploy/cloud-foundry/cloud-foundry',
            'deploy/cloud-foundry/db-migration',
            'deploy/cloud-foundry/cf-troubleshooting'
          ]
        },
        {
          type: 'category',
          label: 'Kubernetes',
          items: [
            'deploy/kubernetes',
            'deploy/kubernetes/helm-installation',
            'deploy/kubernetes/eksdeployment'
          ]
        },
        'deploy/all-in-one',
        'deploy/tech-preview',
        'deploy/access',
        'deploy/troubleshooting'
      ]
    },
    {
      type: 'category',
      label: 'Endpoints',
      items: [
        'endpoints/introduction',
        {
          type: 'category',
          label: 'Cloud Foundry',
          items: ['endpoints/cf/cf', 'endpoints/cf/invite-user-guide']
        },
        'endpoints/k8s',
        {
          type: 'category',
          label: 'Metrics',
          items: ['endpoints/metrics/metrics', 'endpoints/metrics/bosh-metrics']
        },
        'endpoints/helm'
      ]
    },
    {
      type: 'category',
      label: 'Advanced Topics',
      items: ['advanced/sso', 'advanced/user-endpoints']
    },
    {
      type: 'category',
      label: 'Develop',
      items: [
        'contributing_guide',
        'developer-environment',
        'build-and-packaging',
        'developer/introduction',
        {
          type: 'category',
          label: 'Frontend',
          items: ['developer/frontend', 'developer/frontend-tests']
        },
        {
          type: 'category',
          label: 'Backend',
          items: ['developer/backend', 'secrets-management']
        },
        {
          type: 'category',
          label: 'Deploy',
          items: ['developer/deploy', 'developer/developers-guide-helm']
        },
        'developer/developers-guide-kube-local-dev',
        'developer/developers-guide-e2e-tests',
        'devops_guide',
        'release_guide'
      ]
    },
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'plugin-architecture',
        'theming-architecture',
        'branding-architecture',
        'tailwind-usage',
        'icon-fonts',
        'pagination-architecture',
        'cf-api-v3',
        'cf-api-v2-usage',
        'cf-entity-scaling'
      ]
    },
    {
      type: 'category',
      label: 'Extend',
      items: [
        'extensions/introduction',
        'extensions/disable-packages',
        'extensions/v4-migration',
        'extensions/frontend',
        'extensions/backend'
      ]
    },
    'talks'
  ]
}

export default sidebars
