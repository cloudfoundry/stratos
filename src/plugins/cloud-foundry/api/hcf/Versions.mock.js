(function (mock) {
  'use strict';

  /* eslint-disable quote-props */
  mock.cloudFoundryAPI = mock.cloudFoundryAPI || {};

  mock.cloudFoundryAPI.Versions = {

    ListVersions: function (guid) {
      return {
        url: '/pp/v1/proxy/v1/apps/' + guid + '/droplets?order_by=-created_at&per_page=200',
        success: {
          code: 200,
          response: {
            "pagination": {
              "first": {"href": "/v1/apps/" + guid + "/droplets?page=1\u0026per_page=200order_by=-created_at"},
              "last": {"href": "/v1/apps/" + guid + "/droplets?page=1\u0026per_page=200order_by=-created_at"},
              "next": null,
              "previous": null,
              "total_pages": 1,
              "total_results": 1
            },
            "resources": [{
              "created_at": "2016-10-15T17:21:28.000Z",
              "guid": "2df16aa9-4cbc-4dc1-8403-0288472d7af5",
              "links": {
                "app": {"href": "/v3/apps/" + guid},
                "assign_current_droplet": {
                  "href": "/v3/apps/" + guid + "/droplets/current",
                  "method": "PUT"
                },
                "package": null,
                "self": {"href": "/v3/droplets/2df16aa9-4cbc-4dc1-8403-0288472d7af5"}
              },
              "result": {
                "buildpack": "nodejs_buildpack",
                "execution_metadata": null,
                "hash": {"type": "sha1", "value": "ef71e903a0f9d1949d8057f6ee354c55fd4eb1fa"},
                "process_types": null,
                "stack": "cflinuxfs2"
              },
              "staging_disk_in_mb": 1024,
              "staging_memory_in_mb": 31,
              "state": "STARTED",
              "updated_at": "2016-10-15T17:21:29.000Z"
            }]
          }
        },
        failure: {
          code: 500,
          body: {guid: {}}
        }
      };
    }
  };

  /* eslint-enable quote-props */
})(this.mock = this.mock || {});
