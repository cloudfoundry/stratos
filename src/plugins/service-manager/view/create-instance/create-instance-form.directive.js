(function () {
  'use strict';

  angular
    .module('service-manager.view.create-instance.form', [])
    .directive('createInstanceForm', createInstanceForm);

  createInstanceForm.$inject = [
  ];

  /**
   * @name application
   * @returns {object} The create instance form directive definition object
   */
  function createInstanceForm() {
    return {
      controller: CreateInstanceForm,
      controllerAs: 'ciFormCtrl',
      templateUrl: 'plugins/service-manager/view/create-instance/create-instance-form.html',
      scope: {
        data: '='
      },
      bindToController: true
    };
  }

  CreateInstanceForm.$inject = [
    '$scope',
    'app.model.modelManager'
  ];

  /**
   * @namespace app.view.application.ApplicationController
   * @memberof app.view.application
   * @name CreateInstanceForm
   * @param {object} $scope - the Angular $scope service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @class
   */
  function CreateInstanceForm($scope, modelManager) {
    var that = this;
    this.hsmModel = modelManager.retrieve('service-manager.model');
    this.data.form = $scope.form;
    this.data.params = [];

    this.sdlOptions = [];

    $scope.$watch('form', function (f) {
      that.data.form = f;
    });

  }

  angular.extend(CreateInstanceForm.prototype, {

    productChanged: function () {
      this.data.sdl = undefined;
      this.sdlOptions = this.data.sdlVersions[this.data.product] || [];
      var found = _.find(this.sdlOptions, {latest: true});
      this.data.sdl = found.value;
      this.sdlChanged();
    },

    sdlChanged: function () {
      var that = this;
      if (this.data.sdl) {
        this.hsmModel.getServiceSdl(this.data.guid, this.data.service.id, this.data.product, this.data.sdl).then(function (sdl) {
          var params = _.filter(sdl.parameters, function (param) {
            return param.required && !param.generator && !param.secret && !param.default;
          });
          that.parameters = params;
        });
      } else {
        this.parameters = undefined;
      }
    }
  });

})();
