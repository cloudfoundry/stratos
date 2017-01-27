(function () {

  'use strict';

  angular
    .module('service-manager.view.create-instance', ['service-manager.view.create-instance.form'])
    .factory('service-manager.view.create-instance.dialog', CreateInstanceDialogFactory);

  CreateInstanceDialogFactory.$inject = [
    '$q',
    'app.model.modelManager',
    'helion.framework.widgets.asyncTaskDialog'
  ];

  /**
   * @memberof app.view.endpoints.clusters.cluster
   * @name CreateInstanceDialogFactory
   * @constructor
   * @param {object} $q - Angular $q service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} asyncTaskDialog - our async dialog service
   */
  function CreateInstanceDialogFactory($q, modelManager, asyncTaskDialog) {

    this.show = function (serviceManagerGuid, services, serviceId, productVersion, sdlVersion) {

      function create(data) {
        var hsmModel = modelManager.retrieve('service-manager.model');
        return hsmModel.createInstance(serviceManagerGuid, data.serviceId, data.product, data.sdl, data.instanceId, data.params).then(function (d) {
          return d;
        });
      }

      return asyncTaskDialog(
        {
          title: 'Create Service Instance',
          templateUrl: 'plugins/service-manager/view/create-instance/create-instance.html',
          class: 'detail-view-two-fields',
          buttonTitles: {
            submit: gettext('Create')
          }
        }, {
          data: {
            guid: serviceManagerGuid,
            serviceId: serviceId,
            services: services,
            productVersion: productVersion,
            sdlVersion: sdlVersion
          },
          invalidityCheck: function (data) {
            return data.form && data.form.createInstanceForm ? data.form.createInstanceForm.$invalid : true;
          }
        },
      create);
    };

    return this;
  }
})();
