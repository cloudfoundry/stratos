(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('app.view.registerServiceViaHsm', RegisterServiceViaHsmFactory);

  RegisterServiceViaHsmFactory.$inject = [
    '$q',
    '$http',
    '$sce',
    'app.model.modelManager',
    'helion.framework.widgets.asyncTaskDialog',
    'app.utils.utilsService',
    'app.view.registerService'
  ];

  /**
   * @name DiscoverRegisterServicesDialogFactory
   * @constructor
   * @param {object} $q - Angular $q service
   * @param {object} $http - Angular $http service
   * @param {object} $sce - Angular $sce service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} asyncTaskDialog - our async dialog service
   * @param {app.utils.utilsService} utilsService - the utils service
   * @param {app.view.registerService} registerService - Service that handles registering cnsi's
   */
  function RegisterServiceViaHsmFactory($q, $http, $sce, modelManager, asyncTaskDialog, utilsService, registerService) {

    //TODO: Tidy. for 4.0.1 on demo it's different than 4.1 in dev harness
    // Collection of objects representing the services we'd like to discover. This links HSM service type,
    // HSM service location and console cnsi type. The service location will provide the external url
    var servicesToDiscover = [
      {
        id: 'stackato.hpe.hce',
        name: utilsService.getOemConfiguration().CODE_ENGINE,
        type: 'hce',
        serviceLocationName: 'hce-rest',
        serviceLocationPort: 'https'
      },
      {
        id: 'stackato.hpe.hcf',
        name: utilsService.getOemConfiguration().CLOUD_FOUNDRY,
        type: 'hcf',
        serviceLocationName: 'router',
        serviceLocationPort: 'router2'
      },
      {
        id: 'hsc-catalog.hpe.hce',
        name: utilsService.getOemConfiguration().CODE_ENGINE,
        type: 'hce',
        serviceLocationName: 'hce-rest',
        serviceLocationPort: 'https'
      },
      {
        id: 'hsc-catalog.hpe.hcf',
        name: utilsService.getOemConfiguration().CLOUD_FOUNDRY,
        type: 'hcf',
        serviceLocationName: 'ha-proxy',
        serviceLocationPort: 'ha-proxy2'
      }
    ];
    var endpoints = [];
    var instanceNames = [];
    var existingEndpointNames = [];
    var existingEndpointUrls = [];

    /**
     * @name getHCFEndpoint
     * @description Discover the hcf endpoint from the service instance domain param
     * @param {object} instanceInfo -
     * @returns {object} promise
     */
    function getHCFEndpoint(instanceInfo) {
      var domainParameter = _.find(instanceInfo.parameters, { name: 'DOMAIN' });
      // TODO: safe to assume https?
      return domainParameter
        ? $q.resolve('https://api.' + domainParameter.value)
        : $q.reject('Cannot determine public url - missing domain parameter');
    }

    /**
     * @name getHCEEndpoint
     * @description Discover the hcf endpoint from the service instance domain param
     * @param {object} instanceInfo -
     * @param {object} servicePublicUrl -
     * @param {object=} skipSllVerification -
     * @returns {object} promise
     */
    function getHCEEndpoint(instanceInfo, servicePublicUrl, skipSllVerification) {
      //TODO: cannot get info due to CORS error. also, value provided is not of required type. hce doesn't seem to ...
      //TODO: ... have any way to determine url. for now just use raw one
      return $q.resolve(servicePublicUrl);

      // // var config = {};
      // // config.url = servicePublicUrl + '/info';
      // // config.method = 'GET';
      // var url = servicePublicUrl + '/info';
      // $sce.trustAsResourceUrl(url);
      //
      // return $http.jsonp(url, {jsonpCallbackParam: 'api_public_uri'})
      //   .then(function (response) {
      //     var publicUrl = _.get(response, 'data.api_public_uri');
      //     return publicUrl ? publicUrl : $q.reject('Cannot determine public url from info call');
      //   })
      //   .catch(function (error) {
      //     if (error.status === 403) {
      //       //TODO: security issue
      //       return getHCEEndpoint(instanceInfo, servicePublicUrl, true);
      //     }
      //     return $q.reject(error);
      //   });
    }

    /**
     * @name findPublicUrl
     * @description Given a list of service locations find the required service and create a url from it
     * @param {object} serviceLocations -
     * @param {object} serviceToDiscover -
     * @returns {string?} url
     */
    function findPublicUrl(serviceLocations, serviceToDiscover) {

      var serviceLocation = _.find(serviceLocations, {
        service_name: serviceToDiscover.serviceLocationName,
        port_name: serviceToDiscover.serviceLocationPort
      });

      if (!serviceLocation) {
        return null;
      }

      var publicUrl = 'https://' + serviceLocation.public_location;
      if (serviceLocation.public_port) {
        publicUrl += ':' + serviceLocation.public_port;
      }

      return publicUrl;
    }

    /**
     * @name findCnsiEndpoints
     * @description Given a list of service locations find the required service and create a url from it
     * @param {object} hsmCnsiGuid -
     * @param {object} serviceInstances -
     * @param {object} serviceToDiscover -
     * @returns {object} promise
     */
    function findCnsiEndpoints(hsmCnsiGuid, serviceInstances, serviceToDiscover) {
      // Find instances of the required service
      var matchingInstances = _.filter(serviceInstances, {state: 'running', service_id: serviceToDiscover.id});

      var services = [];
      var promises = [];

      _.forEach(matchingInstances, function (match) {
        var promise = modelManager.retrieve('service-manager.model').getInstance(hsmCnsiGuid, match.instance_id)
          .then(function (instanceInfo) {

            // Create the url for the candidate cnsi
            var createEndpointPromise, publicUrl;
            switch (serviceToDiscover.type) {
              case 'hcf':
                createEndpointPromise = getHCFEndpoint(instanceInfo);
                break;
              case 'hce':
                publicUrl = findPublicUrl(instanceInfo.service_locations, serviceToDiscover);
                createEndpointPromise = publicUrl ? getHCEEndpoint(instanceInfo, publicUrl) : $q.reject();
                break;
              default:
                publicUrl = findPublicUrl(instanceInfo.service_locations, serviceToDiscover);
                createEndpointPromise = publicUrl ? $q.resolve(publicUrl) : $q.reject();
                break;
            }

            return createEndpointPromise
              .then(function (publicUrl) {
                // Ensure we don't already have a cnsi with this endpoint
                if (_.indexOf(existingEndpointUrls, publicUrl) < 0) {
                  services.push({
                    key: instanceInfo.instance_id + instanceInfo.service_id,
                    productName: serviceToDiscover.name,
                    productType: serviceToDiscover.type,
                    name: instanceInfo.instance_id,
                    url: publicUrl
                  });
                }
              })
              .catch(function () {
                // Swallow error. Don't kill the chain if a single info request fails
              });
          })
          .catch(function () {
            // Swallow error. Don't kill the chain if a single instance request fails
          });
        promises.push(promise);
      });

      return promises.length > 0
        ? $q.all(promises).then(function () {
          return services;
        })
        : $q.reject('Could not find service');
    }

    /**
     * @name registerServiceEndpoints
     * @description Register the selected endpoints as cnsi's
     * @returns {object} promise
     */
    function registerServiceEndpoints() {
      var promises = [];
      _.forEach(endpoints, function (endpoint) {
        delete endpoint.error;
        if (!endpoint.register) {
          // user has not checked, skip
          return;
        }
        var promise = registerService.register(endpoint.productName, endpoint.productType, endpoint.url, endpoint.name,
          endpoint.skipSll)
          .then(function () {
            // Remove any that have successfully added. Failures will be shown in the table
            _.pull(endpoints, endpoint);
          })
          .catch(function (response) {

            var errorMessage = response.status === 403
              ? response.data.error + gettext('. Please check "Skip SSL validation for the endpoint" if the certificate issuer is trusted.')
              : gettext('There was a problem registering the endpoint. If this error persists, please contact the' +
                'administrator.');

            endpoint.error = {
              message: errorMessage,
              status: 'error'
            };
            return $q.reject(response);
          });

        promises.push(promise);

      });

      return $q.all(promises);
    }

    /**
     * @name buildEndpointNames
     * @description Each entry in the endpoint table will need a unique set of endpoint names to disallow.
     */
    function buildEndpointNames() {
      _.forEach(endpoints, function (endpoint) {
        if (endpoint.endpointNames) {
          endpoint.endpointNames.length = 0;
        } else {
          endpoint.endpointNames = [];
        }

        // Candidate names from table of endpoints that are checked
        var candidateNames = _.map(_.filter(endpoints, { register: true}), 'name');
        // Ensure we do not include the candidate endpoint name in it's own unique items list
        var index = _.indexOf(candidateNames, endpoint.name);
        if (index > -1) {
          _.pullAt(candidateNames, index);
        }

        [].push.apply(endpoint.endpointNames, existingEndpointNames);
        [].push.apply(endpoint.endpointNames, candidateNames);

      });
    }

    /**
     * @name buildEndpointNames
     * @description Each entry in the endpoint table will need a unique set of endpoint names to disallow.
     */
    function buildEndpointUrls() {
      _.forEach(endpoints, function (endpoint) {
        if (endpoint.endpointUrls) {
          endpoint.endpointUrls.length = 0;
        } else {
          endpoint.endpointUrls = [];
        }

        // Candidate urls from table of endpoints that are checked
        var candidateUrls = _.map(_.filter(endpoints, { register: true}), 'url');
        // Ensure we do not include the candidate endpoint url in it's own unique items list
        var index = _.indexOf(candidateUrls, endpoint.url);
        if (index > -1) {
          _.pullAt(candidateUrls, index);
        }

        [].push.apply(endpoint.endpointUrls, existingEndpointUrls);
        [].push.apply(endpoint.endpointUrls, candidateUrls);

      });
    }

    /**
     * @name discoverAndShowSelection
     * @description Discover applicable service endpoints from the given HSM and provide user with a way to optionally
     * add them as console endpoints
     * @param {string} hsmCnsiGuid - cnsi guid of a hsm
     * @returns {object} promise - asyn detail view promise
     */
    function discoverAndShowSelection(hsmCnsiGuid) {

      endpoints.length = 0;

      return modelManager.retrieve('service-manager.model').getInstances(hsmCnsiGuid, true)
        .then(function (serviceInstances) {

          // Discover a list of cnsi endpoints from HSM
          var findServicesPromises = [];
          _.forEach(servicesToDiscover, function (serviceToDiscover) {
            var promise = findCnsiEndpoints(hsmCnsiGuid, serviceInstances, serviceToDiscover)
              .then(function (foundEndpoints) {
                [].push.apply(endpoints, foundEndpoints);
              })
              .catch(function () {
                // Silently skip, probably not found
              });
            findServicesPromises.push(promise);
          });

          return $q.all(findServicesPromises)
            .then(function () {

              var cnsis = modelManager.retrieve('app.model.serviceInstance').serviceInstances;
              existingEndpointNames = registerService.createInstanceNames(cnsis);
              existingEndpointUrls = _.map(cnsis, utilsService.getClusterEndpoint);

              buildEndpointNames();
              buildEndpointUrls();

              if (endpoints.length === 0) {
                return $q.resolve();
              }

              return asyncTaskDialog(
                {
                  title: gettext('Register Additional Endpoints'),
                  templateUrl: 'app/view/endpoints/register-via-hsm/register-via-hsm.html',
                  buttonTitles: {
                    submit: gettext('Register'),
                    cancel: gettext('Close')
                  }
                },
                {
                  data: {
                    endpoints: endpoints,
                    instanceNames: instanceNames,
                    buildEndpointNames: buildEndpointNames,
                    buildEndpointUrls: buildEndpointUrls
                  },
                  hideErrorMsg: true,
                  invalidityCheck: function (data) {
                    // At least one endpoint must be checked
                    // Every checked endpoint must be valid
                    var valid = false;
                    for (var i = 0; i < data.endpoints.length; i++) {
                      var endpoint = data.endpoints[i];
                      if (!endpoint.register) {
                        continue;
                      }
                      valid = data.form[endpoint.key + 'name'].$valid && data.form[endpoint.key + 'url'].$valid;
                      if (!valid) {
                        return true;
                      }
                    }
                    return !valid;
                  }
                },
                registerServiceEndpoints
              ).result.catch(function () {
                // Ignore cancel/close as rejected promise
              });
            });
        });

    }

    this.show = discoverAndShowSelection;

    return this;
  }
})();
