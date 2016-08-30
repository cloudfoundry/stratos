(function () {
  'use strict';

  angular
    .module('app.view')
    .directive('pageFooter', pageFooter);

  pageFooter.$inject = [
    'app.basePath'
  ];

  /**
   * @namespace app.view.pageFooter
   * @memberof app.view
   * @name pageFooter
   * @description A page footer directive
   * @param {string} path - the application base path
   * @returns {object} The pageFooter directive definition object
   */
  function pageFooter(path) {
    return {
      templateUrl: path + 'view/page-footer/page-footer.html',
      controller: FooterController,
      controllerAs: 'footerCtrl'
    };
  }

  FooterController.$inject = [];

  /**
   * @namespace app.view.pageFooter
   * @memberof app.view
   * @name FooterController
   * @description Controller for the footer - provides footer links
   * @constructor
   */
  function FooterController() {
    this.links = {
      privacy: gettext('https://www.hpe.com/us/en/legal/privacy.html'),
      terms: gettext('http://docs.hpcloud.com/permalink/helion-openstack/3.0/eula')
    };
  }
})();
