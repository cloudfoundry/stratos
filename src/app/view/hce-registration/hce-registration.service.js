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

    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.serviceInstanceApi = apiManager.retrieve('app.api.serviceInstance');
    this.serviceInstanceModel.list();
    var that = this;

    return {
      add: function () {
        var data = {name: '', url: ''};
        detailView(
          {
            detailViewTemplateUrl: 'app/view/hce-registration/hce-registration.html',
            title: gettext('Register Code Engine Endpoint'),
            controller: HceRegistrationController
          },
          {
            data: data
          }
        ).result.then(function () {
          return that.serviceInstanceApi.createHCE(data.url, data.name).then(function () {
            that.serviceInstanceModel.list();
          });
        });
      }
    };
  }

  HceRegistrationController.$inject = [
    'app.model.modelManager',
    'context',
    '$scope'
  ];


  function HceRegistrationController (modelManager, context, $scope) {
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.context = context;

    this.serviceInstanceModel = modelManager.retrieve('app.model.serviceInstance');
    this.serviceInstances = {};
    this.currentEndpoints = {};
    this.$scope = $scope;
    var that = this;

    this.context.options = {instances: []};

    $scope.$watchCollection(function () {
      return that.serviceInstanceModel.serviceInstances;
    }, function (serviceInstances) {
      var filteredInstances = _.filter(serviceInstances, {cnsi_type: 'hce'});
      _.forEach(filteredInstances, function (serviceInstance) {
        var guid = serviceInstance.guid;
        if (angular.isUndefined(that.serviceInstances[guid])) {
          that.serviceInstances[guid] = serviceInstance;
        } else {
          angular.extend(that.serviceInstances[guid], serviceInstance);
        }
      });

      that.context.options.instances = _.map(that.serviceInstances,
        function (c) {
          var endpoint = c.api_endpoint;
          return endpoint.Scheme + '://' + endpoint.Host;
        });
    });
  }

})();
