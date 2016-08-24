(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('app.view.hceRegistration', HceRegistrationFactory);

  HceRegistrationFactory.$inject = [
    'app.model.modelManager',
    'app.view.notificationsService',
    'helion.framework.widgets.asyncTaskDialog'
  ];

  function HceRegistrationFactory(modelManager, notificationsService, asyncTaskDialog) {
    var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');

    function createInstances(serviceInstances) {
      var filteredInstances = _.filter(serviceInstances, {cnsi_type: 'hce'});
      return _.map(filteredInstances,
        function (c) {
          var endpoint = c.api_endpoint;
          return endpoint.Scheme + '://' + endpoint.Host;
        });
    }

    return {
      add: function () {
        var data = {
          name: '',
          url: ''
        };
        return asyncTaskDialog(
          {
            title: gettext('Register Code Engine Endpoint'),
            templateUrl: 'app/view/hce-registration/hce-registration.html',
            class: 'detail-view-thin',
            buttonTitles: {
              submit: gettext('Register')
            }
          },
          {
            data: data,
            instances: createInstances(serviceInstanceModel.serviceInstances)
          },
          function () {
            return serviceInstanceModel.createHce(data.url, data.name)
              .then(function () {
                notificationsService.notify('success', gettext('HCE endpoint \'{{name}}\' successfully registered'),
                  {name: data.name});
              });
          }
        ).result;
      }
    };
  }

})();
