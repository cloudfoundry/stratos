(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.list')
    .directive('applicationGalleryCard', applicationGalleryCard);

  applicationGalleryCard.$inject = [];

  function applicationGalleryCard() {
    return {
      bindToController: {
        app: '=',
        cnsiGuid: '='
      },
      controller: ApplicationGalleryCardController,
      controllerAs: 'applicationGalleryCardCtrl',
      scope: {},
      templateUrl: 'plugins/cloud-foundry/view/applications/list/' +
      'gallery-view/application-gallery-card/application-gallery-card.html'
    };
  }

  ApplicationGalleryCardController.$inject = [
    '$state',
    '$scope',
    'modelManager'
  ];

  function ApplicationGalleryCardController($state, $scope, modelManager) {
    var that = this;
    this.$state = $state;
    this.modelManager = modelManager;
    this.cardData = {
      title: this.app.entity.name
    };

    $scope.$watch(function () {
      return that.app.entity.state;
    }, function () {
      that.canShowStats = that.app.entity.state === 'STARTED';
    });
  }

  angular.extend(ApplicationGalleryCardController.prototype, {

    goToApp: function () {
      var guids = {
        cnsiGuid: this.cnsiGuid,
        guid: this.app.metadata.guid
      };
      var appModel = this.modelManager.retrieve('cloud-foundry.model.application');
      appModel.initApplicationFromSummary(this.app);
      this.$state.go('cf.applications.application.summary', guids);
    }
  });

})();
