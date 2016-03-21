(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.list')
    .directive('applicationGalleryCard', applicationGalleryCard);

  applicationGalleryCard.$inject = [];

  function applicationGalleryCard() {
    return {
      bindToController: {
        app: '='
      },
      controller: ApplicationGalleryCardController,
      controllerAs: 'applicationGalleryCardCtrl',
      scope: {},
      templateUrl: 'plugins/cloud-foundry/view/applications/list/gallery-view/application-gallery-card/application-gallery-card.html'
    };
  }

  ApplicationGalleryCardController.$inject = ['$state'];

  function ApplicationGalleryCardController($state) {
    this.$state = $state;
    this.cardData = {
      title: this.app.entity.name,
      status: {
        description: this.app.entity.state === 'STARTED' ? '' : this.app.entity.state,
        classes: this.app.entity.state === 'STARTED' ? '' : 'warning'
      }
    };
  }

  angular.extend(ApplicationGalleryCardController.prototype, {
    goToApp: function () {
      this.$state.go('cf.applications.application.summary', { guid: this.app.metadata.guid });
    }
  });

})();
