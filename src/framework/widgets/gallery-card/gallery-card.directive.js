(function () {
  'use strict';

  angular
    .module('helion.framework.widgets')
    .directive('galleryCard', galleryCard);

  galleryCard.$inject = ['helion.framework.basePath'];

  /**
   * @namespace helion.framework.widgets.galleryCard
   * @memberof helion.framework.widgets
   * @name galleryCard
   * @description A gallery card directive that includes a title,
   * an actions dropdown, main content, and a status notification bar.
   * The main content is transcluded. The card data should include
   * a `title` value.
   * @param {string} path - the framework base path
   * @example
   * <gallery-card card-data="myController.cardData"
   *  card-actions-icon="helion-icon helion-icon-View">
   * </gallery-card>
   * @returns {object} The gallery-card directive definition object
   */
  function galleryCard(path) {
    return {
      bindToController: {
        cardActions: '=?',
        cardActionsIcon: '@?',
        cardActionsPosition: '@?',
        cardData: '=',
        onCardClick: '&?',
        onNotificationClick: '&?'
      },
      controller: GalleryCardController,
      controllerAs: 'galleryCardCtrl',
      scope: {},
      templateUrl: path + 'widgets/gallery-card/gallery-card.html',
      transclude: true
    };
  }

  GalleryCardController.$inject = [];

  /**
   * @namespace helion.framework.widgets.GalleryCardController
   * @memberof helion.framework.widgets
   * @name GalleryCardController
   * @constructor
   * @property {string} actionsIcon - the actions dropdown icon
   * @property {string} actionsPosition - the position of the actions dropdown
   * @property {boolean} cardClickable - flag whether content and header is clickable
   * @property {boolean} notificationClickable - flag whether notification bar is clickable
   * @property {function} onCardClick - callback for card content and header click event
   * @property {function} onNotificationClick - callback for notification bar click event
   */
  function GalleryCardController() {
    this.actionsIcon = this.cardActionsIcon || 'glyphicon glyphicon-option-horizontal';
    this.actionsPosition = this.cardActionsPosition || '';
    this.cardClickable = angular.isDefined(this.onCardClick);
    this.notificationClickable = angular.isDefined(this.onNotificationClick);
    this.onCardClick = this.onCardClick || angular.noop;
    this.onNotificationClick = this.onNotificationClick || angular.noop;
  }

})();
