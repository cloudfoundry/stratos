(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications')
    .directive('applicationGalleryCard', applicationGalleryCard);

  applicationGalleryCard.$inject = ['app.basePath'];


  function applicationGalleryCard(path) {
    return {
      bindToController: {
        app: '=',
      },
      controller: ApplicationGalleryCardController,
      controllerAs: 'applicationGalleryCardCtrl',
      scope: {},
      templateUrl: 'plugins/cloud-foundry/view/applications/application-gallery-card/application-gallery-card.html'
    };
  }

  ApplicationGalleryCardController.$inject = [];


  function ApplicationGalleryCardController() {

    this.cardData = {
      title: this.app.entity.name,
      status: {
        description:  (this.app.entity.state=='STARTED') ?  '' : this.app.entity.state,
        classes:  (this.app.entity.state=='STARTED') ?  '' : 'warning'
      }
    };
  }

})();
