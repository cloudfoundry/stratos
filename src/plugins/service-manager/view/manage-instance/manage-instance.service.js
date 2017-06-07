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
   * @param {object} $q - the Angular $q service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} asyncTaskDialog - our async dialog service
   */
  function ManageInstanceDialogFactory($q, modelManager, asyncTaskDialog) {

    this.show = function (mode, serviceManagerGuid, services, serviceId, productVersion, sdlVersion) {

      function create(data) {
        var hsmModel = modelManager.retrieve('service-manager.model');
        return hsmModel.createInstance(serviceManagerGuid, data.serviceId, data.product, data.sdl, data.instanceId,
          data.params);
      }

      function configure(data) {
        var hsmModel = modelManager.retrieve('service-manager.model');
        return hsmModel.configureInstance(serviceManagerGuid, data.instance, data.params);
      }

      function upgrade(data) {
        var hsmModel = modelManager.retrieve('service-manager.model');
        // Update the product and sdl versions for the instance
        data.instance.product_version = data.product;
        data.instance.sdl_version = data.sdl;
        return hsmModel.configureInstance(serviceManagerGuid, data.instance, data.params);
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

      var asyncContext = {
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
      };

      function execute(data) {
        var result;
        switch (mode) {
          case 'upgrade':
            result = upgrade(data);
            break;
          case 'configure':
            result = configure(data);
            break;
          default:
            result = create(data);
            break;
        }

        return result.catch(function (response) {
          asyncContext.errorMsg = _.get(response, 'data.message');
          return $q.reject(response);
        });
      }

      return asyncTaskDialog(
        {
          title: title,
          templateUrl: 'plugins/service-manager/view/manage-instance/manage-instance.html',
          class: 'detail-view-two-fields',
          buttonTitles: {
            submit: submitButtonText
          }
        }, asyncContext, execute);
    };

    return this;
  }
})();
