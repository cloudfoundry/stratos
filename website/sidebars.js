module.exports = {
  docs: {
    Documentation: ['introduction', 'overview'],
    'Getting Started': [
    	'deploy/cloud-foundry', 
    	'deploy/kubernetes', 
    	'deploy/all-in-one'],
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
    		Extensions: [
    			'guides/extensions/frontend-extensions',
    			'guides/extensions/backend-plugins'
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
  },
};
