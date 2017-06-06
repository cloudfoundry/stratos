(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('app.view.registerServiceViaHsm', RegisterServiceViaHsmFactory);

  RegisterServiceViaHsmFactory.$inject = [
    '$q',
    '$interpolate',
    'app.model.modelManager',
    'helion.framework.widgets.asyncTaskDialog',
    'app.utils.utilsService',
    'app.view.registerService',
    'app.view.credentialsDialog'
  ];

  /**
   * @name DiscoverRegisterServicesDialogFactory
   * @constructor
   * @param {object} $q - Angular $q service
   * @param {object} $interpolate - Angular $q service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} asyncTaskDialog - our async dialog service
   * @param {app.utils.utilsService} utilsService - the utils service
   * @param {app.view.registerService} registerService - Service that handles registering cnsi's
   * @param {app.view.credentialsDialog} credentialsDialog - dialog/service that handles connecting to a cnsi
   */
  function RegisterServiceViaHsmFactory($q, $interpolate, modelManager, asyncTaskDialog, utilsService, registerService,
                                        credentialsDialog) {

    // Collection of objects representing the services we'd like to discover. At the moment this is just HCF (pre and
    // post 4.1 service types). HCE is a pain due to the reason described in getHCEEndpoint
    var servicesToDiscover = [
      {
        id: 'stackato.hpe.hcf',
        name: utilsService.getOemConfiguration().CLOUD_FOUNDRY,
        type: 'hcf'
      },
      {
        id: 'hsc-catalog.hpe.hcf',
        name: utilsService.getOemConfiguration().CLOUD_FOUNDRY,
        type: 'hcf'
      }
      // {
      //   id: 'stackato.hpe.hce',
      //   name: utilsService.getOemConfiguration().CODE_ENGINE,
      //   type: 'hce',
      //   serviceLocationName: 'hce-rest',
      //   serviceLocationPort: 'https'
      // },
      // {
      //   id: 'hsc-catalog.hpe.hce',
      //   name: utilsService.getOemConfiguration().CODE_ENGINE,
      //   type: 'hce',
      //   serviceLocationName: 'hce-rest',
      //   serviceLocationPort: 'https'
      // }
    ];

    var endpoints = [];
    var instanceNames = [];
    var existingEndpointNames = [];
    var existingEndpointUrls = [];

    /**
     * @name getHCFEndpoint
     * @description Discover the hcf endpoint from the service instance domain param
     * @param {object} instanceInfo - HSM response to getInstance
     * @returns {object} promise
     */
    function getHCFEndpoint(instanceInfo) {
      var domainParameter = _.find(instanceInfo.parameters, { name: 'DOMAIN' });
      return domainParameter
        ? $q.resolve('https://api.' + domainParameter.value)
        : $q.reject('Cannot determine public url - missing domain parameter');
    }

    /**
     * @name getHCEEndpoint
     * @description Discover the hcf endpoint from the service instance domain param
     * @param {object} servicePublicUrl - Public URL for a service from a specific HSM service location
     * @returns {object} promise
     */
    function getHCEEndpoint(servicePublicUrl) {
      // In an ideal world we would make an info call to the public url info endpoint to retrieve the external public
      // url, however code engine is not currently aware of it and the known public url is returned. If they do fix this
      // the info call must be made in the portal to avoid CORS and air-gap issues
      return $q.resolve(servicePublicUrl);
    }

    /**
     * @name findPublicUrl
     * @description Given a list of service locations find the required service and create a url from it
     * @param {array} serviceLocations - array of HSM service_location's
     * @param {object} serviceToDiscover - specific type of service we need to create the url from.
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
     * @param {object} hsmCnsiGuid - the cnsi guid of the hsm to contact
     * @param {array} serviceInstances - array HSM service instances
     * @param {object} serviceToDiscover - specific type of service we need to find
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

            // Create the endpoint url for the candidate cnsi
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
                // Swallow error. Don't stop the 'all' wait if a single info request fails
              });
          })
          .catch(function () {
            // Swallow error. Don't stop the 'all' wait if a single info request fails
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
     * @param {object} hsmCredentials - username and password of HSM
     * @returns {object} promise
     */
    function registerServiceEndpoints(hsmCredentials) {
      var promises = [];
      _.forEach(endpoints, function (endpoint) {
        delete endpoint.error;
        if (!endpoint.register) {
          // user has not selected this endpoint, skip
          return;
        }
        // First attempt to register the service
        var promise = registerService.register(endpoint.productName, endpoint.productType, endpoint.url, endpoint.name,
          endpoint.skipSll)
          .catch(function (response) {
            // Has it failed due to an ssl error?
            var errorMessage = response.status === 403
              ? response.data.error + gettext('. Please check "Skip SSL validation for the endpoint" if the ' +
                'certificate issuer is trusted.')
              : gettext('There was a problem registering the endpoint. If this error persists, please contact the' +
                'administrator.');

            endpoint.error = {
              message: errorMessage,
              status: 'error'
            };
            return $q.reject(response);
          })
          .then(function (serviceInstance) {
            // Attempt to connect using the same credentials as the HSM
            if (hsmCredentials && hsmCredentials.username && hsmCredentials.password) {
              return modelManager.retrieve('app.model.serviceInstance.user').connect(serviceInstance.guid,
                endpoint.name, hsmCredentials.username, hsmCredentials.password)
                .then(function success() {
                  credentialsDialog.notify(endpoint.name);
                })
                .catch(function () {
                  // Not interested in failed connection attempt, the user can attempt this manually
                });
            }
          })
          .then(function (serviceInstance) {
            // Remove any that have successfully added. Failures will be shown in the table. Do this last after the
            // attempted connect, this avoids the dialog showing with no rows in the table
            _.pull(endpoints, endpoint);
            return serviceInstance;
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
     * @name discoverAndShowEndpoints
     * @description Discover applicable service endpoints found in the given HSM and provide user with a way to
     * optionally add them as console endpoints
     * @param {string} hsmCnsiGuid - the cnsi guid of the hsm to contact
     * @param {object} hsmCredentials - the username and password used to connect to HSM
     * @returns {object} promise - asyn detail view promise
     */
    function discoverAndShowEndpoints(hsmCnsiGuid, hsmCredentials) {

      endpoints.length = 0;

      return modelManager.retrieve('service-manager.model').getInstances(hsmCnsiGuid, true)
        .then(function (serviceInstances) {

          // Define the existing set of cnsi's
          var cnsis = modelManager.retrieve('app.model.serviceInstance').serviceInstances;
          var hsmCnsiName = _.find(cnsis, { guid: hsmCnsiGuid }).name;
          existingEndpointNames = registerService.createInstanceNames(cnsis);
          existingEndpointUrls = _.map(cnsis, utilsService.getClusterEndpoint);

          // Discover a list of cnsi endpoints from HSM
          var findServicesPromises = [];
          _.forEach(servicesToDiscover, function (serviceToDiscover) {
            var promise = findCnsiEndpoints(hsmCnsiGuid, serviceInstances, serviceToDiscover)
              .then(function (foundEndpoints) {
                [].push.apply(endpoints, foundEndpoints);
              })
              .catch(function () {
                // Silently skip, most probably it just doesn't exist in HSM. Importantly lets all promises finish
                // within later $q.all
              });
            findServicesPromises.push(promise);
          });

          return $q.all(findServicesPromises)
            .then(function () {

              if (endpoints.length === 0) {
                return $q.resolve({showNotification: true});
              }

              buildEndpointNames();

              var textScope = {
                hsmCnsiName: hsmCnsiName,
                cloudFoundryName: utilsService.getOemConfiguration().CLOUD_FOUNDRY,
                hsmName: utilsService.getOemConfiguration().SERVICE_MANAGER
              };

              var description = endpoints.length === 1
                ? $interpolate(gettext('The {{ hsmName }} \'{{ hsmCnsiName }}\' has successfully been connected and ' +
                  'the following unregistered {{ cloudFoundryName }} endpoint has been discovered. ' +
                  'Would you like to now register it?'))(textScope)
                : $interpolate(gettext('The {{ hsmName }} \'{{ hsmCnsiName }}\' has successfully been connected and ' +
                  'the following unregistered {{ cloudFoundryName }} endpoints have been discovered. ' +
                  'Would you like to now register them?'))(textScope);

              return asyncTaskDialog(
                {
                  title: $interpolate(gettext('Register {{ cloudFoundryName }} Endpoints'))(textScope),
                  templateUrl: 'app/view/endpoints/register-via-hsm/register-via-hsm.html',
                  buttonTitles: {
                    submit: gettext('Register'),
                    cancel: gettext('Close')
                  }
                },
                {
                  data: {
                    description: description,
                    endpoints: endpoints,
                    instanceNames: instanceNames,
                    buildEndpointNames: buildEndpointNames
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
                      valid = data.form[endpoint.key + 'name'].$valid;
                      if (!valid) {
                        return true;
                      }
                    }
                    return !valid;
                  }
                },
                _.partial(registerServiceEndpoints, hsmCredentials)
              ).result.catch(function () {
                // Ignore cancel/close as rejected promise
              });
            });
        });

    }

    this.show = discoverAndShowEndpoints;

    return this;
  }
})();
