(function () {
  'use strict';

  /**
   * @name helion.framework.widgets.detailView
   * @example:
   *  ```
   *  detailView({
   *    title: 'Detail View Title',
   *    templateUrl: 'html/template/path.html'
   *    },
   *    {
   *      data: {}
   *    }
   *  });
   */
  angular
    .module('helion.framework.widgets')
    .directive('detailViewTemplate', detailViewTemplate)
    .factory('helion.framework.widgets.detailView', serviceFactory);

  serviceFactory.$inject = [
    '$uibModal',
    'helion.framework.basePath',
    '$document',
    'helion.framework.utils.dialogEvents',
    '$timeout'
  ];

  function serviceFactory($uibModal, path, $document, dialogEvents, $timeout) {

    var detailViewContainer;

    var openDetailViewCount = 0;

    return detailView;

    function detailView(config, context) {
      var needGlass = openDetailViewCount === 0;
      var element = $document[0].createElement('div');
      var body = angular.element($document[0].body);
      context = context || {};

      if (needGlass) {
        body.prepend(element);
        detailViewContainer = angular.element(element);
        detailViewContainer.addClass('detail-view-container');
        body.addClass('detail-view-open');
      }

      // If dialog mode then set ensure we are using the dialog class
      if (config.dialog) {
        config.class = config.class || '';
        config.class += ' detail-view-dialog';
      }

      var windowClass = 'detail-view';
      if (config.class) {
        windowClass += ' ' + config.class;
      }

      var modal = $uibModal.open({
        backdrop: needGlass,
        backdropClass: 'detail-view-backdrop',
        openedClass: 'detail-view-open',
        appendTo: detailViewContainer,
        controller: config.controller || DetailViewController,
        controllerAs: config.controllerAs || 'detailViewCtrl',
        templateUrl: config.detailViewTemplateUrl || path + 'widgets/detail-view/detail-view.html',
        resolve: {
          context: function () {
            return context;
          },
          content: function () {
            return {
              templateUrl: config.templateUrl,
              template: config.template,
              title: config.title
            };
          }
        },
        windowClass: windowClass,
        windowTopClass: 'detail-view-top'
      });
      dialogEvents.notifyOpened();
      openDetailViewCount++;
      modal.closed.then(function () {
        openDetailViewCount--;
        dialogEvents.notifyClosed();

        if (openDetailViewCount === 0) {
          body.removeClass('detail-view-open');
          detailViewContainer.remove();
        }
      });

      modal.rendered.then(function () {
        $timeout(function () {
          // If dialog mode then we need to fix the width after rendering, so that
          // if content is shown/hidden (e.g. error box) then the dialog width will not change
          // since this is jarring if it does
          if (config.dialog) {
            var dialog = angular.element('.detail-view-dialog .modal-dialog');
            var width = dialog.width();
            dialog.width(width);
          }
        });
      });

      // Return the modal (makes close/dismiss promises available to caller)
      return modal;
    }
  }

  /**
   * @namespace helion.framework.widgets.detailView
   * @memberof helion.framework.widgets
   * @name DetailViewController
   * @constructor
   * @param {object} context - the context for the detail view
   * @property {object} context - the context for the detail view
   * @param {object} content - the configuration for the content to place inside the detail view
   * @property {object} content - the configuration for the content to place inside the detail view
   */
  DetailViewController.$inject = [
    '$scope',
    '$sce',
    'context',
    'content'
  ];

  function DetailViewController($scope, $sce, context, content) {
    this.context = context;
    this.content = content;

    this.getTemplateHtml = function () {
      return $sce.trustAsHtml(content.template);
    };
  }

  detailViewTemplate.$inject = [
    '$compile'
  ];

  /**
   * @namespace helion.framework.widgets.detailViewTemplate
   * @memberof helion.framework.widgets
   * @name detailViewTemplate
   * @description Helper directive to allow a template to be supplied directly
   * @param {object} $compile - Angular's $compile service
   * @returns {object} The detail view template directive definition object
   */
  function detailViewTemplate($compile) {
    return {
      scope: {
        template: '@'
      },
      link: function (scope, element) {
        scope.$watch('template', function (value) {
          element.html(value);
          $compile(element.contents())(scope);
        });
      }
    };
  }

})();

