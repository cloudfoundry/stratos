module.exports = {
  docs: {
		Documentation: ['introduction', 'overview'],
    'Deploying Stratos': [
			'deploy/deploy-overview',
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
			'advanced/sso'
		],
		'Contributing to Development': [
			'guides/contribution/contributing',
			{
			Developer: [
				'guides/developers/developers-guide',
				'guides/developers/developers-guide-env-tech',
				'guides/developers/developers-guide-e2e-tests'
			]
		}
		],
		'Extending Stratos': [
			'extensions/introduction',
			'guides/customization/customizing',
			'extensions/theming',
			'extensions/frontend',
			'extensions/backend',
		],
		
  },
};
