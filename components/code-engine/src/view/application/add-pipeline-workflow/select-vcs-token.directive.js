(function () {
  'use strict';

  angular
    .module('code-engine.view.application')
    .directive('selectVcsToken', selectVcsToken);

  // Replace directives are not going anywhere, see:
  // https://github.com/angular/angular.js/commit/eec6394a342fb92fba5270eee11c83f1d895e9fb#commitcomment-8124407
  /* eslint-disable angular/no-directive-replace */
  function selectVcsToken() {
    return {
      bindToController: {
        selectedSource: '=',
        source: '=',
        onManageTokens: '&'
      },
      scope: {},
      controller: SelectVcsTokenController,
      controllerAs: 'selectVcsAndTokenCtrl',
      templateUrl: 'plugins/code-engine/view/application/add-pipeline-workflow/select-vcs-token.directive.html',
      replace: true
    };
  }
  /* eslint-enable angular/no-directive-replace */

  function SelectVcsTokenController(modelManager, ceManageVcsTokens, ceRegisterVcsToken) {
    var vm = this;

    vm.singleToken = singleToken;
    vm.noValidToken = noValidToken;
    vm.noToken = noToken;
    vm.manyTokens = manyTokens;
    vm.manageTokens = manageTokens;
    vm.addNewToken = addNewToken;
    vm.isSelected = isSelected;

    refreshSelectedToken();

    function singleToken() {
      return vm.source.value.tokenOptions.length === 1;
    }

    function noValidToken() {
      return vm.source.value.tokenOptions.length < 1;
    }

    function manyTokens() {
      return vm.source.value.tokenOptions.length > 1;
    }

    function noToken() {
      var vcsModel = modelManager.retrieve('code-engine.model.vcs');
      return vcsModel.getTokensForVcs(vm.source.value).length < 1;
    }

    function manageTokens($event) {
      var vcsModel = modelManager.retrieve('code-engine.model.vcs');
      $event.stopPropagation();
      ceManageVcsTokens.manage(vm.source.value).then(function () {
        // Avoid potential race condition when the last validity check is still in flight
        vcsModel.lastValidityCheck.then(function () {

          // Rebuild valid token options
          vcsModel.buildTokenOptions(vm.source.value);
          refreshSelectedToken();

          return vm.onManageTokens({vcs: vm.source.value});
        });

      });
      return true;
    }

    function addNewToken($event) {
      var vcsModel = modelManager.retrieve('code-engine.model.vcs');
      $event.stopPropagation();
      ceRegisterVcsToken.registerToken(vm.source.value).then(function () {
        // Refresh tokens
        return vcsModel.listVcsTokens().then(function () {
          return vcsModel.checkTokensValidity(vm.source.value).then(function () {
            // Rebuild valid token options
            vcsModel.buildTokenOptions(vm.source.value);
            refreshSelectedToken();
            return vm.onManageTokens({vcs: vm.source.value});
          });
        });

      });
      return true;
    }

    // Make sure the selected Token still exists
    function refreshSelectedToken() {
      if (vm.source.value.selectedToken) {
        // Attempt to preserve the existing token selection
        var matchingToken = _.find(vm.source.value.tokenOptions, function (tokenOption) {
          return tokenOption.value === vm.source.value.selectedToken;
        });
        if (!matchingToken) {
          // select another if possible
          if (vm.source.value.tokenOptions.length > 0) {
            vm.source.value.selectedToken = vm.source.value.tokenOptions[0].value;
          } else {
            delete vm.source.value.selectedToken;
          }
        }
      } else {
        // auto-select first valid token
        if (vm.source.value.tokenOptions.length > 0) {
          vm.source.value.selectedToken = vm.source.value.tokenOptions[0].value;
        } else {
          delete vm.source.value.selectedToken;
        }
      }
    }

    function isSelected() {
      return vm.selectedSource === vm.source.value;
    }

  }

})();
