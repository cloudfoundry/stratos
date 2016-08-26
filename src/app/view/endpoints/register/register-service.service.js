(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('app.view.registerService', ServiceRegistrationService);

  ServiceRegistrationService.$inject = [
    'app.model.modelManager',
    'app.view.notificationsService',
    'helion.framework.widgets.asyncTaskDialog'
  ];

  function ServiceRegistrationService(modelManager, notificationsService, asyncTaskDialog) {
    var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');

    function createInstances(serviceInstances, filter) {
      var filteredInstances = _.filter(serviceInstances, {cnsi_type: filter});
      return _.map(filteredInstances,
        function (c) {
          var endpoint = c.api_endpoint;
          return endpoint.Scheme + '://' + endpoint.Host;
        });
    }

    return {
      add: function (title, description, type) {
        var data = {
          name: '',
          url: ''
        };
        return asyncTaskDialog(
          {
            title: title,
            templateUrl: 'app/view/endpoints/register/register-service.html',
            class: 'detail-view-thin',
            buttonTitles: {
              submit: gettext('Register')
            }
          },
          {
            data: data,
            instances: createInstances(serviceInstanceModel.serviceInstances, type),
            description: description
          },
          function () {
            var promise = type === 'hcf'
              ? serviceInstanceModel.create(data.url, data.name)
              : serviceInstanceModel.createHce(data.url, data.name);
            return promise.then(function () {
              notificationsService.notify('success',
                gettext('{{endpointType}} endpoint \'{{name}}\' successfully registered'),
                {endpointType: type.toUpperCase(), name: data.name});
            });
          }
        ).result;
      }
    };
  }

})();
