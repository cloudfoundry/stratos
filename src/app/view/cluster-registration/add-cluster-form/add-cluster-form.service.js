(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('app.view.hcfRegistration', AddClusterFormFactory);

  AddClusterFormFactory.$inject = [
    'app.model.modelManager',
    'app.view.notificationsService',
    'helion.framework.widgets.asyncTaskDialog'
  ];

  function AddClusterFormFactory(modelManager, notificationsService, asyncTaskDialog) {
    var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');

    return {
      add: function () {
        var data = {
          name: '',
          url: '',
          existingApiEndpoints: _.map(serviceInstanceModel.serviceInstances,
            function (c) {
              var endpoint = c.api_endpoint;
              return endpoint.Scheme + '://' + endpoint.Host;
            })
        };
        return asyncTaskDialog(
          {
            title: gettext('Register Cluster'),
            templateUrl: 'app/view/cluster-registration/add-cluster-form/add-cluster-form.html',
            class: 'detail-view-thin',
            buttonTitles: {
              submit: gettext('Register')
            }
          },
          {
            data: data
          },
          function () {
            return serviceInstanceModel.create(data.url, data.name).then(function () {
              notificationsService.notify('success', gettext('Cluster \'{{name}}\' successfully registered'),
                {name: data.name});
            });
          }
        ).result;
      }
    };
  }

})();
