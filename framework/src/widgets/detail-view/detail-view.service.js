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

      // Go through all opened detail views and updated their stacking styles
      angular.forEach(angular.element('.modal.detail-view'), function (value, key) {
        /* eslint-disable angular/angularelement */
        var v = $(value);
        /* eslint-enable angular/angularelement */
        v.removeClass('detail-view-stack-' + key);
        v.addClass('detail-view-stack-' + (key + 1));
      });

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

      modal.result.finally(function () {
        // Go through all opened detail views and updated their stacking styles
        angular.forEach(angular.element('.modal.detail-view'), function (value, key) {
          if (key > 0) {
            /* eslint-disable angular/angularelement */
            var v = $(value);
            /* eslint-enable angular/angularelement */
            v.removeClass('detail-view-stack-' + key);
            v.addClass('detail-view-stack-' + (key - 1));
          }
        });
      });

      // Return the modal (makes close/dismiss promises available to caller)
      return modal;
    }
  }

  DetailViewController.$inject = [
    '$scope',
    'context',
    'content'
  ];

  /**
   * @name DetailViewController
   * @param {object} $scope - the $scope service
   * @param {object} context - the context for the detail view
   * @param {object} content - the configuration for the content to place inside the detail view
   */
  function DetailViewController($scope, context, content) {
    this.context = context;
    this.content = content;
    this.$scope = $scope;
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
        detailViewCtrl: '=',
        template: '@'
      },
      link: function (scope, element) {
        scope.$watch('template', function (value) {
          // Forward context into the compile scope to simplify templates
          scope.detailViewCtrl.$scope.context = scope.detailViewCtrl.context;

          element.html(value);
          $compile(element.contents())(scope.detailViewCtrl.$scope);
        });
      }
    };
  }

})();

