(function () {
  'use strict';

  angular
    .module('app.framework.widgets')
    .directive('galleryCard', galleryCard);

  /**
   * @namespace app.framework.widgets.galleryCard
   * @memberof app.framework.widgets
   * @name galleryCard
   * @description A gallery card directive that includes a title,
   * an actions dropdown, main content, and a status notification bar.
   * The main content is transcluded. The card data should include
   * a `title` value.
   * @returns {object} The gallery-card directive definition object
   */
  function galleryCard() {
    return {
      bindToController: {
        cardActions: '=?',
        cardActionsPosition: '@?',
        cardData: '=',
        onCardClick: '&?',
        onNotificationClick: '&?'
      },
      controller: GalleryCardController,
      controllerAs: 'galleryCardCtrl',
      scope: {},
      templateUrl: 'framework/widgets/gallery-card/gallery-card.html',
      transclude: true
    };
  }

  /**
   * @namespace app.framework.widgets.GalleryCardController
   * @memberof app.framework.widgets
   * @name GalleryCardController
   * @constructor
   * @property {string} actionsPosition - the position of the actions dropdown
   * @property {boolean} cardClickable - flag whether content and header is clickable
   * @property {boolean} notificationClickable - flag whether notification bar is clickable
   * @property {function} onCardClick - callback for card content and header click event
   * @property {function} onNotificationClick - callback for notification bar click event
   */
  function GalleryCardController() {
    this.actionsPosition = this.cardActionsPosition || '';
    this.cardClickable = angular.isDefined(this.onCardClick);
    this.notificationClickable = angular.isDefined(this.onNotificationClick);
    this.onCardClick = this.onCardClick || angular.noop;
    this.onNotificationClick = this.onNotificationClick || angular.noop;
  }

})();
