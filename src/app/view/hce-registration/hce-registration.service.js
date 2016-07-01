(function () {
  'use strict';

  angular
    .module('app.view')
    .factory('app.view.hceRegistration', HceRegistrationFactory);

  HceRegistrationFactory.$inject = [
    'app.model.modelManager',
    'app.api.apiManager',
    'helion.framework.widgets.detailView'
  ];

  function HceRegistrationFactory (modelManager, apiManager, detailView) {
    var serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    var serviceInstanceApi = apiManager.retrieve('app.api.serviceInstance');

    return {
      add: function () {
        var data = {name: '', url: ''};
        detailView(
          {
            templateUrl: 'app/view/hce-registration/hce-registration.html',
            title: gettext('Register Code Engine Endpoint')
          },
          {
            data: data,
            options: {
              instances: null     // TODO should get from helper service for eliminating duplicates
            }
          }
        ).result.then(function () {
          return serviceInstanceApi.createHCE(data.url, data.name).then(function () {
            serviceInstanceModel.list();
          });
        });
      }
    };
  }
})();
