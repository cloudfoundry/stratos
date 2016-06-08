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
      templateUrl: 'plugins/cloud-foundry/view/applications/list/gallery-view/application-gallery-card/application-gallery-card.html'
    };
  }

  ApplicationGalleryCardController.$inject = [
    '$state'
  ];

  function ApplicationGalleryCardController($state) {
    this.$state = $state;
    this.cardData = {
      title: this.app.entity.name
    };
  }

  angular.extend(ApplicationGalleryCardController.prototype, {
    goToApp: function () {
      var guids = {
        cnsiGuid: this.cnsiGuid,
        guid: this.app.metadata.guid
      };
      this.$state.go('cf.applications.application.summary', guids);
    }
  });

})();
