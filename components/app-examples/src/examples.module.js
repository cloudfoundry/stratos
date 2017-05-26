(function () {
  'use strict';

  angular
    .module('app-examples.main', [
      'app-examples.widgets'
    ])
    .constant('appExamples.basePath', 'app-examples/')
    .controller('ExampleController', ExampleController)
    .config(registerRoute);

  function registerRoute($stateProvider) {
    $stateProvider.state('examples', {
      url: '/examples',
      templateUrl: 'app-examples/framework.html',
      data: {
        activeMenuState: 'examples'
      }
    });
    $stateProvider.state('theme', {
      url: '/theme',
      templateUrl: 'app-examples/theme_preview.html',
      data: {
        activeMenuState: 'theme'
      }
    });
  }

  /* eslint-disable no-alert */
  function ExampleController($location, $scope, $state, $timeout, $q, $log, frameworkDialogConfirm, frameworkDetailView,
                             frameworkToaster, frameworkAsyncTaskDialog, frameworkDialogEvents) {
    var vm = this;

    vm.globalSpinnerActive = false;
    vm.singleSelectedRow = '';
    vm.uniqueValue = '';
    vm.ignoreCaseUniqueValue = '';
    vm.radioCheckedValue = '';
    vm.cbCheckedValue = {};
    vm.mockTableData = [
      {name: 'NodeJS', description: 'API component, NodeJS, docker container', az: 'US East'},
      {name: 'RoR', description: 'API component, Ruby on Rails 5, docker container', az: 'US West'}
    ];
    vm.mockTableDisplayData = [];
    vm.mockArrayData = [
      {
        title: 'App 1',
        link: '#focusable-input'
      },
      {
        title: 'App 2',
        status: {
          description: 'Danger!',
          classes: 'danger',
          icon: 'material-icons app-icon-error',
          link: '#flyout'
        }
      },
      {
        title: 'App 3',
        status: {
          description: 'Warning!',
          classes: 'warning',
          icon: 'material-icons app-icon-warning'
        }
      }
    ];
    vm.ringChartData = {
      ok: 5,
      critical: 2,
      warning: 3,
      unknown: 6
    };
    vm.ringChartData2 = {
      ok: 5,
      critical: 2,
      unknown: 6
    };
    vm.ringChartLabels = {
      ok: 'OK',
      critical: 'Errors',
      warning: 'Warnings',
      unknown: 'Unknown',
      total: 'Items',
      totalOne: 'Item'
    };
    vm.addTextColorAction = {
      label: 'Add Text Color',
      execute: function () {
        alert('Add more text colors!');
      }
    };
    vm.autoPopulate = {
      src: '',
      dest: ''
    };
    vm.actions = [
      {
        name: 'Start',
        icon: 'material-icons app-icon-play',
        execute: function (target) {
          alert('Start ' + target);
          vm.disabled = true;
          vm.actions[1].disabled = false;
        }
      },
      {
        name: 'Stop',
        disabled: true,
        execute: function (target) {
          alert('Stop ' + target);
          vm.disabled = true;
          vm.actions[0].disabled = false;
        }
      }
    ];
    vm.target = 'Target';
    vm.routes = [
      {label: 'Tab 1', state: 'tab1'},
      {label: 'Tab 2', state: 'tab2'},
      {label: 'Tab 3', state: 'tab3'}
    ];
    vm.selectValue = null;
    vm.selectOptions = [
      {label: 'Black', value: 'black'},
      {label: 'Blue', value: 'blue'},
      {label: 'Cyan', value: 'cyan'},
      {label: 'Gray', value: 'gray'},
      {label: 'Green', value: 'green'},
      {label: 'Red', value: 'red', disabled: true},
      {label: 'Yellow', value: 'yellow'}
    ];
    vm.selectValueLong = 'long';
    vm.selectOptionsLong = [
      {label: 'Black', value: 'black'},
      {label: 'Blue', value: 'blue'},
      {label: 'Cyan', value: 'cyan'},
      {label: 'Gray', value: 'gray'},
      {label: 'This is a super long value which should get truncated', value: 'long'},
      {label: 'Red', value: 'red', disabled: true},
      {label: 'Yellow', value: 'yellow'}
    ];

    vm.getLogText = getLogText;
    vm.updateRingChartData = updateRingChartData;
    vm.toggleStopAction = toggleStopAction;
    vm.hideGlobalSpinner = hideGlobalSpinner;
    vm.showGlobalSpinner = showGlobalSpinner;
    vm.cardClicked = cardClicked;
    vm.notificationClicked = notificationClicked;
    vm.openConfirmModal = openConfirmModal;
    vm.openConfirmModalWithError = openConfirmModalWithError;
    vm.openDetailView = openDetailView;
    vm.openDetailViewWizard = openDetailViewWizard;
    vm.showToast = showToast;
    vm.showToastNoAutoClose = showToastNoAutoClose;
    vm.showCustomToast = showCustomToast;
    vm.showBusyToast = showBusyToast;
    vm.showAsyncTaskDialog = showAsyncTaskDialog;

    $state.transitionTo('tab1');

    frameworkDialogEvents.configure({ scope: $scope });

    $scope.$on('MODAL_INTERACTION_START', function () {
      $log.info('MODAL_INTERACTION_START');
    });

    $scope.$on('MODAL_INTERACTION_END', function () {
      $log.info('MODAL_INTERACTION_END');
    });

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

    function getLogText() {
      var ret = '';
      ret += 'STDOUT: default color long wrapping line - default color ' +
        'long wrapping line - default color long wrapping line - default color long wrapping line\n\n';
      ret += coloredLog('ok: Green text [green text]\n', 'green');
      ret += coloredLog('TASK: Yellow log - yellow log\n', 'yellow');
      ret += coloredLog('SKIP: blue line - I\'m blue\n', 'blue');
      ret += coloredLog('ERROR: Oops red text red! Oops!\n', 'red');
      ret += coloredLog('ERROR ERROR ERROR ERROR ERROR!!! - \x1B[1mFAIL\n\n', 'white', 'red');
      ret += '\x1B[1mBold text!\x1B[0m\n\n';

      ret += 'All color combinations:\n';
      for (var i = 0; i < colorCodes.length; i++) {
        var bg = colorCodes[i];
        for (var j = 0; j < colorCodes.length; j++) {
          var fg = colorCodes[j];
          if (fg === bg) {
            continue;
          }
          ret += coloredLog(fg + ' on ' + bg, fg, bg) + ' ';
        }
        ret += '\n';
      }

      return ret;
    }

    function updateRingChartData() {
      ringChartData.critical++;
      ringChartData.ok++;
    }

    function toggleStopAction() {
      vm.actions[1].hidden = !vm.actions[1].hidden;
    }

    function hideGlobalSpinner() {
      vm.globalSpinnerActive = false;
    }
    function showGlobalSpinner() {
      vm.globalSpinnerActive = true;
    }

    function cardClicked(card) {
      if (card && card.link) {
        $location.url(card.link).replace();
      }
    }
    function notificationClicked(card) {
      if (card && card.status && card.status.link) {
        $location.url(card.status.link).replace();
      }
    }
    function openConfirmModal() {
      frameworkDialogConfirm({
        title: 'Are you sure?',
        description: 'Please confirm.',
        busyDescription: 'Please wait',
        buttonText: {
          yes: 'Yes, I am sure',
          no: 'No'
        },
        callback: function () {
          alert('Confirmed');
        }
      });
    }
    function openConfirmModalWithError() {
      frameworkDialogConfirm({
        title: 'Are you sure?',
        description: 'Please confirm.',
        busyDescription: 'Please wait',
        errorMessage: 'There was a problem',
        buttonText: {
          yes: 'Yes, I am sure',
          no: 'No'
        },
        callback: function () {
          return $q.reject('Uh oh. Something went wrong.');
        }
      });
    }
    function openDetailView() {
      frameworkDetailView(
        {
          title: 'Example Detail View',
          templateUrl: 'scripts/detail-view/detail-view-example.html'
        },
        {
          open: function () {
            openDetailView();
          },
          showConfirmModal: function () {
            openConfirmModal();
          }
        });
    }
    function openDetailViewWizard(title) {
      frameworkDetailView(
        {
          title: title,
          template: '<my-workflow />'
        },
        {}
      );
    }
    function showToast(type, message) {
      frameworkToaster[type](message);
    }
    function showToastNoAutoClose(type, message) {
      frameworkToaster[type](message, {timeOut: 0});
    }
    function showCustomToast(message, iconClass) {
      frameworkToaster.show(message, iconClass);
    }
    function showBusyToast(message) {
      var toast = frameworkToaster.busy(message);
      $timeout(function () {
        toast.close().then(function () {
          frameworkToaster.success('Completed okay');
        });
      }, 3000);
    }
    function showAsyncTaskDialog() {
      frameworkAsyncTaskDialog(
        {
          title: 'Example Async Task Dialog',
          templateUrl: 'scripts/async-task-dialog/async-task-dialog-example.html'
        },
        {},
        function () {
          return $q(function (resolve) {
            $timeout(function () {
              resolve();
            }, 2000);
          });
        });
    }
  }

})(this);
/* eslint-enable no-alert */
