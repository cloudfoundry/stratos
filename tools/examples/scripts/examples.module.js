(function (global) {
  'use strict';

  angular
    .module('helionFrameworkExamples', [
      'helion.framework',
      'ui.router',
      'ncy-angular-breadcrumb',
      'helionFrameworkExamples.tabbed-nav',
      'helionFrameworkExamples.tabs',
      'smart-table'
    ])
    .constant('helionFrameworkExamples.basePath', 'scripts/')
    .controller('ExampleController', ExampleController);

  ExampleController.$inject = [
    '$location',
    '$scope',
    '$state',
    '$timeout',
    '$q',
    '$log',
    'helion.framework.widgets.dialog.confirm',
    'helion.framework.widgets.detailView',
    'helion.framework.widgets.toaster',
    'helion.framework.widgets.asyncTaskDialog',
    'helion.framework.utils.dialogEvents'
  ];

  // provide gettext to widgets
  function expose(vars) {
    for (var key in vars) {
      if (vars.hasOwnProperty(key)) {
        global[key] = vars[key];
      }
    }
  }

  function gettext(text) {
    return text;
  }

  expose({
    gettext: gettext
  });

  /* eslint-disable no-alert */

  function ExampleController($location, $scope, $state, $timeout, $q, $log, confirmDialog, detailView, toaster, asyncTaskDialog, dialogEvents) {
    var that = this;
    this.$location = $location;
    this.$timeout = $timeout;
    this.$q = $q;
    this.$log = $log;
    this.confirmDialog = confirmDialog;
    this.detailView = detailView;
    this.asyncTaskDialog = asyncTaskDialog;
    this.dialogEvents = dialogEvents;
    this.toaster = toaster;
    this.globalSpinnerActive = false;
    this.singleSelectedRow = '';
    this.multiSelectedRows = [];
    this.uniqueValue = '';
    this.ignoreCaseUniqueValue = '';
    this.radioCheckedValue = '';
    this.cbCheckedValue = {};
    this.mockTableData = [
      {name: 'NodeJS', description: 'API component, NodeJS, docker container', az: 'US East'},
      {name: 'RoR', description: 'API component, Ruby on Rails 5, docker container', az: 'US West'}
    ];
    this.mockTableDisplayData = [];
    this.mockArrayData = [
      {
        title: 'App 1',
        link: '#focusable-input'
      },
      {
        title: 'App 2',
        status: {
          description: 'Danger!',
          classes: 'danger',
          icon: 'glyphicon glyphicon-exclamation-sign',
          link: '#flyout'
        }
      },
      {
        title: 'App 3',
        status: {
          description: 'Warning!',
          classes: 'warning',
          icon: 'glyphicon glyphicon-alert'
        }
      }
    ];

    this.ringChartData = {
      ok: 5,
      critical: 2,
      warning: 3,
      unknown: 6
    };

    this.ringChartData2 = {
      ok: 5,
      critical: 2,
      unknown: 6
    };

    this.ringChartLabels = {
      ok: 'OK',
      critical: 'Errors',
      warning: 'Warnings',
      unknown: 'Unknown',
      total: 'Items',
      totalOne: 'Item'
    };

    this.addTextColorAction = {
      label: 'Add Text Color',
      execute: function () {
        alert('Add more text colors!');
      }
    };

	this.autoPopulate = {
		src: '',
		dest: ''
	};

    this.actions = [
      {
        name: 'Start',
        icon: 'glyphicon glyphicon-play',
        execute: function (target) {
          alert('Start ' + target);
          this.disabled = true;
          that.actions[1].disabled = false;
        }
      },
      {
        name: 'Stop',
        disabled: true,
        execute: function (target) {
          alert('Stop ' + target);
          this.disabled = true;
          that.actions[0].disabled = false;
        }
      }
    ];
    this.target = 'Target';

    this.routes = [
      {label: 'Tab 1', state: 'tab1'},
      {label: 'Tab 2', state: 'tab2'},
      {label: 'Tab 3', state: 'tab3'}
    ];
    $state.transitionTo('tab1');

    this.selectValue = null;
    this.selectOptions = [
      {label: 'Black', value: 'black'},
      {label: 'Blue', value: 'blue'},
      {label: 'Cyan', value: 'cyan'},
      {label: 'Gray', value: 'gray'},
      {label: 'Green', value: 'green'},
      {label: 'Red', value: 'red', disabled: true},
      {label: 'Yellow', value: 'yellow'}
    ];

    this.selectValueLong = 'long';
    this.selectOptionsLong = [
      {label: 'Black', value: 'black'},
      {label: 'Blue', value: 'blue'},
      {label: 'Cyan', value: 'cyan'},
      {label: 'Gray', value: 'gray'},
      {label: 'This is a super long value which should get truncated', value: 'long'},
      {label: 'Red', value: 'red', disabled: true},
      {label: 'Yellow', value: 'yellow'}
    ];

    dialogEvents.configure({ scope: $scope });

    $scope.$on('MODAL_INTERACTION_START', function () {
      that.$log.info('MODAL_INTERACTION_START');
    });

    $scope.$on('MODAL_INTERACTION_END', function () {
      that.$log.info('MODAL_INTERACTION_END');
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

    this.getLogText = function () {
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
    };
  }

  angular.extend(ExampleController.prototype, {
    updateRingChartData: function () {
      this.ringChartData.critical++;
      this.ringChartData.ok++;
    },

    toggleStopAction: function () {
      this.actions[1].hidden = !this.actions[1].hidden;
    },

    hideGlobalSpinner: function () {
      this.globalSpinnerActive = false;
    },
    showGlobalSpinner: function () {
      this.globalSpinnerActive = true;
    },

    cardClicked: function (card) {
      if (card && card.link) {
        this.$location.url(card.link).replace();
      }
    },
    notificationClicked: function (card) {
      if (card && card.status && card.status.link) {
        this.$location.url(card.status.link).replace();
      }
    },
    openConfirmModal: function () {
      this.confirmDialog({
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
    },
    openConfirmModalWithError: function () {
      var that = this;
      this.confirmDialog({
        title: 'Are you sure?',
        description: 'Please confirm.',
        busyDescription: 'Please wait',
        errorMessage: 'There was a problem',
        buttonText: {
          yes: 'Yes, I am sure',
          no: 'No'
        },
        callback: function () {
          return that.$q.reject('Uh oh. Something went wrong.');
        }
      });
    },
    openDetailView: function () {
      var that = this;
      this.detailView(
        {
          title: 'Example Detail View',
          templateUrl: 'scripts/detail-view/detail-view-example.html'
        },
        {
          open: function () {
            that.openDetailView();
          },
          showConfirmModal: function() {
            that.openConfirmModal();
          }
        });
    },
    openDetailViewWizard: function (title) {
      var that = this;
      this.detailView(
        {
          title: title,
          template: '<my-workflow />'
        },
        {}
      );
    },
    showToast: function (type, message) {
      this.toaster[type](message);
    },
    showToastNoAutoClose: function (type, message) {
      this.toaster[type](message, {timeOut: 0});
    },
    showCustomToast: function (message, iconClass) {
      this.toaster.show(message, iconClass);
    },
    showBusyToast: function (message) {
      var that = this;
      var toast = this.toaster.busy(message);
      this.$timeout(function () {
        toast.close().then(function () {
          that.toaster.success('Completed okay');
        });
      }, 3000);
    },
    showAsyncTaskDialog: function () {
      var that = this;
      this.asyncTaskDialog(
        {
          title: 'Example Async Task Dialog',
          templateUrl: 'scripts/async-task-dialog/async-task-dialog-example.html'
        },
        {},
        function () {
          return that.$q(function (resolve) {
            that.$timeout(function () {
              resolve();
            }, 2000);
          });
        });
    }
  });

})(this);
/* eslint-enable no-alert */
