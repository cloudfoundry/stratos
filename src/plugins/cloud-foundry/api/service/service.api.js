(function () {
  'use strict';

  /**
   * @namespace cloud-foundry.api
   * @memberOf cloud-foundry.api
   * @name cloud-foundry.api.service
   * @description Service access API
   */
  angular
    .module('cloud-foundry.api')
    .run(registerServiceApi);

  registerServiceApi.$inject = [
    '$http',
    '$q',
    '$cookies',
    'app.api.apiManager'
  ];

  function registerServiceApi($http, $q, $cookies, apiManager) {
    apiManager.register('cloud-foundry.api.service', new ServiceApi($http, $q, $cookies));
  }

  /**
   * @namespace cloud-foundry.api
   * @memberof cloud-foundry.api.service
   * @name cloud-foundry.api.service.ServiceApi
   * @param {object} $http - the Angular $http service
   * @param {object} $q - the Angular Promise service
   * @param {object} $cookies - the Angular cookies service
   * @property {object} $http - the Angular $http service
   * @property {object} $q - the Angular Promise service
   * @property {object} $cookies - the Angular cookies service
   * @class
   */
  function ServiceApi($http, $q, $cookies) {
    this.$http = $http;
    this.$q = $q;
    this.$cookies = $cookies;
  }

  angular.extend(ServiceApi.prototype, {
     /**
      * @function all
      * @memberof cloud-foundry.api.service
      * @description Retrieve all the services from cloud foundry.
      * @param {string} guid - the guid
      * @param {string} options - the options
      * @returns {object} A resolved/rejected promise
      * @public
      */
      /*eslint-disable no-unused-vars*/
    all: function(guid, options) {
      // return stub data for now
      return stubData();
    }

  });

  function stubData() {
  // stub out response for list
  /* eslint-disable quote-props */
    return Promise.resolve({
      "data": {
        "total_results": 1,
        "total_pages": 1,
        "prev_url": null,
        "next_url": null,
        "resources": [
          {
            "metadata": {
              "guid": "b55b3e8d-66df-475a-ba80-f6ca7edfcb41",
              "url": "/v2/services/b55b3e8d-66df-475a-ba80-f6ca7edfcb41",
              "created_at": "2016-02-19T02:03:48Z",
              "updated_at": null
            },
            "entity": {
              "label": "label-19",
              "provider": null,
              "url": null,
              "description": "desc-111",
              "long_description": null,
              "version": null,
              "info_url": null,
              "active": true,
              "bindable": true,
              "unique_id": "8be9090d-f716-4111-aa75-74ec99c30069",
              "extra": null,
              "tags": [

              ],
              "requires": [

              ],
              "documentation_url": null,
              "service_broker_guid": "f00db357-bedd-4432-bb51-890c26b5862e",
              "plan_updateable": false,
              "service_plans_url": "/v2/services/b55b3e8d-66df-475a-ba80-f6ca7edfcb41/service_plans"
            }
          }
        ]
      }
    });
  /* eslint-enable quote-props */
  }
})();
