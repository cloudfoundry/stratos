(function () {

  'use strict';

  angular
    .module('service-manager.view.manage-instance', ['service-manager.view.manage-instance.form'])
    .factory('service-manager.view.manage-instance.dialog', ManageInstanceDialogFactory);

  ManageInstanceDialogFactory.$inject = [
    '$q',
    'app.model.modelManager',
    'helion.framework.widgets.asyncTaskDialog'
  ];

  /**
   * @name ManageInstanceDialogFactory
   * @constructor
   * @param {object} $q - Angular $q service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} asyncTaskDialog - our async dialog service
   */
  function ManageInstanceDialogFactory($q, modelManager, asyncTaskDialog) {

    this.show = function (mode, serviceManagerGuid, services, serviceId, productVersion, sdlVersion) {

      function create(data) {
        var hsmModel = modelManager.retrieve('service-manager.model');
        return hsmModel.createInstance(serviceManagerGuid, data.serviceId, data.product, data.sdl, data.instanceId, data.params).then(function (d) {
          return d;
        });
      }

      function configure(data) {
        var hsmModel = modelManager.retrieve('service-manager.model');
        return hsmModel.configureInstance(serviceManagerGuid, data.instance, data.params).then(function (d) {
          return d;
        });
      }

      function execute(data) {
        switch (mode) {
          case 'upgrade':
            return upgrade(data);
          case 'configure':
            return configure(data);
          default:
            return create(data);
        }
      }

      var title, submitButtonText, instance;
      switch (mode) {
        case 'upgrade':
          title = gettext('Upgrade Instance');
          submitButtonText = gettext('Upgrade');
          break;
        case 'configure':
          title = gettext('Configure Instance');
          submitButtonText = gettext('Configure');
          break;
        default:
          title = gettext('Create Instance');
          submitButtonText = gettext('Create');
      }

      if (!services && angular.isObject(serviceId)) {
        instance = serviceId;
        serviceId = instance.service_id;
        productVersion = instance.product_version;
        sdlVersion = instance.sdl_version;
      }

      return asyncTaskDialog(
        {
          title: title,
          templateUrl: 'plugins/service-manager/view/manage-instance/manage-instance.html',
          class: 'detail-view-two-fields',
          buttonTitles: {
            submit: submitButtonText
          }
        }, {
          data: {
            mode: mode,
            guid: serviceManagerGuid,
            instance: instance,
            serviceId: serviceId,
            services: services,
            productVersion: productVersion,
            sdlVersion: sdlVersion
          },
          invalidityCheck: function (data) {
            return data.form && data.form.createInstanceForm ? data.form.createInstanceForm.$invalid : true;
          }
        },
      execute);
    };

    return this;
  }
})();
