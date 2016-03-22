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

  ApplicationGalleryCardController.$inject = [
    '$state',
    '$scope',
  ];

  function ApplicationGalleryCardController($state, $scope) {
    var that = this;
    this.$state = $state;
    this.cardData = {
      title: this.app.entity.name,
    };

    var validStates = ['STARTED', 'RUNNING', 'STOPPING'];
    $scope.$watch(
      function () {
        return that.app.entity.state;
      }, function (newState) {
        if (validStates.indexOf(newState) < 0) {
          var icon = newState === 'ERROR' ? 'helion-icon-Critical_L' : 'helion-icon-Warning_L'
          that.cardData.status = {
            classes: newState === 'ERROR' ? 'danger' : 'warning',
            description: newState,
            icon: 'helion-icon helion-icon-lg ' + icon
          };
        } else {
          delete that.cardData.status;
        }
      }
    );

  }

  angular.extend(ApplicationGalleryCardController.prototype, {
    goToApp: function () {
      this.$state.go('cf.applications.application.summary', { guid: this.app.metadata.guid });
    }
  });

})();
