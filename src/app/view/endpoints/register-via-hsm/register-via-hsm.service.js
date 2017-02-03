(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('app.view.registerServiceViaHsm', RegisterServiceViaHsmFactory);

  RegisterServiceViaHsmFactory.$inject = [
    '$q',
    'app.model.modelManager',
    'helion.framework.widgets.asyncTaskDialog',
    'app.utils.utilsService',
    'app.view.registerService'
  ];

  /**
   * @name DiscoverRegisterServicesDialogFactory
   * @constructor
   * @param {object} $q - Angular $q service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} asyncTaskDialog - our async dialog service
   * @param {app.utils.utilsService} utilsService - the utils service
   */
  function RegisterServiceViaHsmFactory($q, modelManager, asyncTaskDialog, utilsService, registerService) {

    //TODO: Tidy. for 4.0.1 on demo it's different than 4.1 in dev harness
    var validServices = [
      {
        id: 'stackato.hpe.hce',
        name: utilsService.getOemConfiguration().CODE_ENGINE,
        type: 'hce',
        serviceName: 'hce-rest',
        servicePort: 'https'
      },
      {
        id: 'stackato.hpe.hcf',
        name: utilsService.getOemConfiguration().CLOUD_FOUNDRY,
        type: 'hcf',
        serviceName: 'router',
        servicePort: 'router'
      },
      {
        id: 'hsc-catalog.hpe.hce',
        name: utilsService.getOemConfiguration().CODE_ENGINE,
        type: 'hce',
        serviceName: 'hce-rest',
        servicePort: 'https'
      },
      {
        id: 'hsc-catalog.hpe.hcf',
        name: utilsService.getOemConfiguration().CLOUD_FOUNDRY,
        type: 'hcf',
        serviceName: 'ha-proxy',
        servicePort: 'ha-proxy2'
      }
    ];

    function findServiceEndpoints(hsmCnsiGuid, instances, service) {
      //TODO: RC Add multiple of each type, not just first one
      var instance = _.find(instances, {state: 'running', service_id: service.id});

      var services = [];

      if (instance) {
        return modelManager.retrieve('service-manager.model').getInstance(hsmCnsiGuid, instance.instance_id)
          .then(function (instance) {

            var hceServiceLocation = _.find(instance.service_locations, {
              service_name: service.serviceName,
              port_name: service.servicePort
            });

            if (!hceServiceLocation) {
              return;
            }

            var publicUrl = hceServiceLocation.public_location;
            if (hceServiceLocation.public_port) {
              publicUrl += ':' + hceServiceLocation.public_port;
            }
            if (service.type === 'hcf') {
              publicUrl = 'api.' + publicUrl;
            }
            if (hceServiceLocation.public_port === 443) {
              publicUrl = 'https://' + publicUrl;
            } else {
              publicUrl = 'http://' + publicUrl;
            }

            // TODO: reach out to info, get external public url
            // TODO: check existing endpoints for new external public url + exclude

            services.push({
              key: instance.instance_id + instance.service_id,
              productName: service.name,
              productType: service.type,
              name: instance.instance_id,
              url: publicUrl
            });

            return services;
          });
      }

      return $q.reject('Could not find service');
    }

    var endpoints = [];
    var instanceNames = [];
    var existingEndpointNames = [];

    function registerServiceEndpoints() {
      var promises = [];
      _.forEach(endpoints, function (endpoint) {
        delete endpoint.error;
        if (!endpoint.register) {
          return;
        }
        var promise = registerService.register(endpoint.productName, endpoint.productType, endpoint.url, endpoint.name,
          endpoint.skipSll)
          .then(function () {
            _.pull(endpoints, endpoint);
          })
          .catch(function (response) {

            var errorMessage = response.status === 403
              ? gettext('Please check "Skip SSL validation for the endpoint" if the certificate issuer is trusted.')
              : gettext('There was a problem registering the endpoint. If this error persists, please contact the administrator.');

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

    function buildEndpointNames() {
      _.forEach(endpoints, function (endpoint) {
        if (endpoint.endpointNames) {
          endpoint.endpointNames.length = 0;
        } else {
          endpoint.endpointNames = [];
        }

        var candidateNames = _.map(endpoints, 'name');
        // Ensure we do not include the candidate endpoint name in it's own unique items list
        var index = _.indexOf(candidateNames, endpoint.name);
        if (index > -1) {
          _.pullAt(candidateNames, index);
        }

        [].push.apply(endpoint.endpointNames, existingEndpointNames);
        [].push.apply(endpoint.endpointNames, candidateNames);

      });
    }

    this.show = function (hsmCnsiGuid) {

      endpoints.length = 0;

      return modelManager.retrieve('service-manager.model').getInstances(hsmCnsiGuid, true)
        .then(function (serviceInstances) {
          var findServicesPromises = [];
          _.forEach(validServices, function (service) {
            var promise = findServiceEndpoints(hsmCnsiGuid, serviceInstances, service)
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

              existingEndpointNames = registerService.createInstanceNames(modelManager.retrieve('app.model.serviceInstance').serviceInstances);
              buildEndpointNames();

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
                      valid = data.form[endpoint.key].$valid;
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

    };

    return this;
  }
})();
