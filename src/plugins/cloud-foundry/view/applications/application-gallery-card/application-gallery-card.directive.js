(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications')
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
      templateUrl: 'plugins/cloud-foundry/view/applications/application-gallery-card/application-gallery-card.html'
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

    this.cardClicked = function() {
      this.$state.go('cf.applications.show', {applicationId: this.app.metadata.guid});
    };
  }

})();
