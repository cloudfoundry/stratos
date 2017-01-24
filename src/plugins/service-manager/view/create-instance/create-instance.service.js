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
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} asyncTaskDialog - our async dialog service
   */
  function CreateInstanceDialogFactory($q, modelManager, asyncTaskDialog) {

    this.show = function (serviceManagerGuid, service, productVersion, sdlVersion) {

      function create(data) {
        console.log('CREATE INSTANCE');
        console.log(data);
        var hsmModel = modelManager.retrieve('service-manager.model');
        return hsmModel.createInstance(serviceManagerGuid, service.id, data.product, data.sdl, data.instanceId, data.params).then(function (d) {
          console.log('created');
          console.log(d);
          return d;
        });
      }

      var productVersions = [];
      var sdlVersions = {};
      _.each(service.product_versions, function (version) {
        productVersions.push({
          label: version.product_version,
          value: version.product_version
        });
        var sdl = [];
        sdlVersions[version.product_version] = sdl;
        _.each(version.sdl_versions, function (url, sdlVersion) {
          console.log(sdlVersion,  version.latest);
          sdl.push({
            label: sdlVersion,
            value: sdlVersion,
            latest: sdlVersion === version.latest
          });
        });
      });

      console.log(productVersions);
      console.log(sdlVersions);

      return asyncTaskDialog(
        {
          title: 'Create Instance of Service "' + service.id + '"',
          templateUrl: 'plugins/service-manager/view/create-instance/create-instance.html',
          buttonTitles: {
            submit: gettext('Create')
          }
        },
        {
          data: {
            guid: serviceManagerGuid,
            service: service,
            productVersion: productVersion,
            sdlVersion: sdlVersion,
            productVersions: productVersions,
            sdlVersions: sdlVersions
          },
          invalidityCheck: function (data) {
            return data.form && data.form.createInstanceForm ? data.form.createInstanceForm.$invalid : true;
          }
        },
        create
      );
    };

    return this;
  }
})();
