(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.gallery', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.gallery', {
      url: '/gallery',
      templateUrl: 'plugins/cloud-foundry/view/applications/gallery/gallery.html',
      controller: ApplicationsGalleryController,
      controllerAs: 'applicationsGalleryCtrl'
    });
  }

  ApplicationsGalleryController.$inject = [
    'app.model.modelManager'
  ];

  /**
   * @name ApplicationsGalleryController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @property {object} application - the Cloud Foundry Applications Model
   */
  function ApplicationsGalleryController(modelManager) {
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.model.all();
  }

  angular.extend(ApplicationsGalleryController.prototype, {
  });

})();
