(function (mock) {
  'use strict';

  mock.hceApi = mock.hceApi || {};

  mock.hceApi.HceDeploymentApi = {

    addDeploymentTarget: function (name, url, username, password, org, space, targetType) {
      return {
        url: '/api/ce/v2/deployments/targets',
        response: {
          201: {
            body: {
              id: 1,
              user_id: 1,
              name: name,
              url: url,
              userName: username,
              password: password,
              organization: org,
              space: space,
              type: targetType
            }
          },

          500: {
            body: {}
          }
        }
      };
    },

    getDeploymentTargets: function () {
      return {
        url: '/api/ce/v2/deployments/targets',
        response: {
          200: {
            body: [
              {
                id: 1,
                user_id: 1,
                name: 'Deployment Target Name',
                url: 'http://www.example.com/',
                userName: 'username',
                password: 'password',
                organization: 'org 1',
                space: 'space 1',
                type: 'cloudfoundry'
              },
              {
                id: 1,
                user_id: 2,
                name: 'Deployment Target Name 2',
                url: 'http://www.example2.com/',
                userName: 'username2',
                password: 'password2',
                organization: 'org 2',
                space: 'space 2',
                type: 'cloudfoundry'
              }
            ]
          },

          500: {
            body: {}
          }
        }
      };
    }
  };

})(this.mock = this.mock || {});
