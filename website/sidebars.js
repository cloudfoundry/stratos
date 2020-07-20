module.exports = {
  docs: {
    Documentation: ['introduction', 'overview'],
    'Getting Started': [
    	'deploy/deploy-readme',
    	{
    		"Cloud Foundry": [
    			'deploy/cloud-foundry',
    			'deploy/cloud-foundry/db-migration' 
    		],
    	},
    	{
    		Kubernetes: [
    			'deploy/kubernetes',
    			'deploy/kubernetes/helm-installation' 
    		],
    	},
    	'deploy/all-in-one',
    	'deploy/access'
    ],
    Guides: [
    	{
    		Contributing: [
    			'guides/contribution/contributing',
    			'guides/contribution/pull_request_template',
    			'guides/contribution/issue_template'
    		],
    	},
		'guides/customization/customizing',
		{
    		Developer: [
    			'guides/developers/developers-guide',
    			'guides/developers/developers-guide-env-tech',
    			'guides/developers/developers-guide-e2e-tests'

    		], 
    	},
		'guides/troubleshooting/troubleshooting',
		{
			Administrator: [
				'guides/admin/invite-user-guide',
				'guides/admin/sso'
			],
		}
		],
		'Extending Stratos': [
			'extensions/introduction',
			'extensions/theming',
			'extensions/frontend',
			'extensions/backend',
		],
		
  },
};
