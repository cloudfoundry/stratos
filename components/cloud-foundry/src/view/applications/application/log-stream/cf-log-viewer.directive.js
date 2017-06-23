(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.log-stream.cfLogViewer', ['ab-base64'])
    .directive('cfLogViewer', cfLogViewer);

  function cfLogViewer() {
    return {
      bindToController: true,
      templateUrl: 'plugins/cloud-foundry/view/applications/application/log-stream/cf-log-viewer.html',
      scope: {
        webSocketUrl: '=?',
        webSocket: '=?',
        filter: '=?',
        disableStatus: '=?'
      },
      controller: CfLogViewerController,
      controllerAs: 'cfLogViewer',
      restrict: 'E'
    };
  }

  /**
   * @name CfLogViewerController
   * @constructor
   * @param {object} base64 - base64 service
   * @param {app.utils.appUtilsService} appUtilsService - our appUtilsService service
   * @param {object} $log - the Angular $log service
   */
  function CfLogViewerController(base64, appUtilsService, $log) {

    var vm = this;

    var coloredLog = appUtilsService.coloredLog;

    vm.autoScrollOn = true; // auto-scroll by default

    vm.jsonFilter = jsonFilter;

    function jsonFilter(jsonString) {
      try {
        var messageObj = angular.fromJson(jsonString);
        if (!messageObj) {
          return;
        }
        if (vm.filter) {
          return vm.filter(messageObj);
        }

        var msgColour, sourceColour, bold;

        // CF timestamps are in nanoseconds
        var msStamp = Math.round(messageObj.timestamp / 1000000);
        var timeStamp = moment(msStamp).format('HH:mm:ss.SSS');

        if (/APP/.test(messageObj.source_type)) {
          sourceColour = 'green';
        } else {
          sourceColour = 'yellow';
        }
        var messageSource = coloredLog('[' + messageObj.source_type + '.' + messageObj.source_instance + ']', sourceColour, true);

        if (messageObj.message_type === 2) {
          msgColour = 'red';
          bold = true;
        }
        var messageString = coloredLog(base64.decode(messageObj.message), msgColour, bold) + '\n';

        return timeStamp + ': ' + messageSource + ' ' + messageString;
      } catch (error) {
        $log.error('Failed to filter jsonMessage from WebSocket: ', jsonString);
        return jsonString;
      }
    }
  }

})();
