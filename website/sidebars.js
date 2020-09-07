module.exports = {
  docs: {
    Documentation: ['introduction', 'overview', 'license'],
    'Deploying Stratos': [
      'deploy/overview',
      {
        "Cloud Foundry": [
          'deploy/cloud-foundry/cloud-foundry',
          'deploy/cloud-foundry/db-migration',
          'deploy/cloud-foundry/cf-troubleshooting'
        ],
      },
      {
        Kubernetes: [
          'deploy/kubernetes',
          'deploy/kubernetes/helm-installation'
        ],
      },
      'deploy/all-in-one',
      'deploy/access',
      'deploy/troubleshooting',
    ],
    'Advanced Topics': [
      'advanced/invite-user-guide',
      'advanced/sso',
      'advanced/bosh-metrics'
    ],
    'Development': [
      'developer/contributing',
      'developer/introduction',
      {
        Frontend: [
          'developer/frontend',
          'developer/frontend-tests'
        ]
      },
      {
        Backend: [
          'developer/backend',
        ]
      },
      {
        Deploy: [
          'developer/deploy',
          'developer/developers-guide-helm'
        ]
      },
      'developer/developers-guide-e2e-tests',
      'developer/developers-guide-env-tech',
    ],
    'Extending Stratos': [
      'extensions/introduction',
      'extensions/v4-migration',
      'extensions/theming',
      'extensions/frontend',
      'extensions/backend',
    ],

  },
};
