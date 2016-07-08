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
    '$stateParams',
    '$location',
    '$log'
  ];

  /**
   * @name ApplicationLogStreamController
   * @constructor
   * @param {app.model.modelManager} modelManager - the Model management service
   * @param {object} $stateParams - the UI router $stateParams service
   * @property {object} model - the Cloud Foundry Applications Model
   * @property {string} id - the application GUID
   */
  function ApplicationLogStreamController(base64, modelManager, $stateParams, $location, $log) {
    this.model = modelManager.retrieve('cloud-foundry.model.application');
    this.websocketUrl = 'ws://' + $location.host() + '/pp/v1/' +
      $stateParams.cnsiGuid + '/apps/' + $stateParams.guid + '/stream';

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
        var messageObj = JSON.parse(jsonString);
        var messageString = base64.decode(messageObj.message) + '\n';

        var colour;
        switch (messageObj.source_type) {
          case 'APP':
              colour = 'green';
                break;
          default:
                colour = 'red';
        }
        var messageSource = coloredLog('[' + messageObj.source_type + '.' + messageObj.source_instance + ']', colour);

        // CF timestamps are in nanoseconds
        var msStamp = Math.round(messageObj.timestamp / 1000000);
        var timeStamp = coloredLog(moment(msStamp).format('YYYY-MM-DD HH:mm:ss'), 'blue');

        return messageSource + ' ' + timeStamp + ': ' + messageString;
      } catch (error) {
        $log.error('Failed to filter jsonMessage from WebSocket: ', jsonString);
        return jsonString;
      }
    };

    var colorCodes = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
    function coloredLog(message, color, background) {
      var colorCode = color ? colorCodes.indexOf(color) : false;
      var backgroundCode = background ? colorCodes.indexOf(background) : false;
      var ret = '';
      if (color) {
        ret += '\x1B[3' + colorCode + 'm';
      }
      if (background) {
        ret += '\x1B[4' + backgroundCode + 'm';
      }
      ret += message;
      if (color || background) {
        ret += '\x1B[0m';
      }
      return ret;
    }

  }

  angular.extend(ApplicationLogStreamController.prototype, {
  });

})();
