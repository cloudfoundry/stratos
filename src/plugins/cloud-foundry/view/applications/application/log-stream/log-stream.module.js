(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.log-stream', ['ab-base64'])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.application.log-stream', {
      url: '/log-stream',
      templateUrl: 'plugins/cloud-foundry/view/applications/application/log-stream/log-stream.html',
      controller: ApplicationLogStreamController,
      controllerAs: 'applicationLogStreamCtrl'
    });
  }

  ApplicationLogStreamController.$inject = [
    'base64',
    'app.model.modelManager',
    'app.utils.utilsService',
    '$stateParams',
    '$location',
    '$log'
  ];

  /**
   * @name ApplicationLogStreamController
   * @constructor
   * @param {object} base64 - base64 service
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {app.utils.utilsService} utils - our utils service
   * @param {object} $stateParams - the UI router $stateParams service
   * @param {object} $location - the Angular $location service
   * @param {object} $log - the Angular $log service
   * @property {object} model - the Cloud Foundry Applications Model
   * @property {string} id - the application GUID
   */
  function ApplicationLogStreamController(base64, modelManager, utils, $stateParams, $location, $log) {
    this.model = modelManager.retrieve('cloud-foundry.model.application');

    var coloredLog = utils.coloredLog;

    var protocol = $location.protocol() === 'https' ? 'wss' : 'ws';
    this.websocketUrl = protocol + '://' + $location.host() + ':' + $location.port() + '/pp/v1/' +
      $stateParams.cnsiGuid + '/apps/' + $stateParams.guid + '/stream';

    // Comment this out to test log stream in gulp dev
    // this.websocketUrl = protocol + '://' + $location.host() + ':3003/v1/' + $stateParams.cnsiGuid + '/apps/' + $stateParams.guid + '/stream';

    this.autoScrollOn = true; // auto-scroll by default

    // After the user has scrolled up we disable auto-scroll
    // They can re-enable auto-scroll either by:
    // - manually scrolling to the bottom
    // - clicking the auto-scroll button
    this.autoScroll = function () {
      this.autoScrollOn = true;
    };

    this.jsonFilter = function (jsonString) {
      try {
        var messageObj = angular.fromJson(jsonString);
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
    };

  }

  angular.extend(ApplicationLogStreamController.prototype, {
  });

})();
