(function () {
  'use strict';

  angular
    .module('helion.framework.widgets')
    .directive('selectRow', selectRow);

  SelectRowController.$inject = [];

  function SelectRowController() {
  }

  /**
   * The `selectRow` directive updates the checkbox selection state of
   * the specified row in the table. Assign this as an attribute to a
   * checkbox input element, passing in the row.
   *
   * ```
   * <tr ng-repeat="row in displayedCollection">
   *   <td>
   *     <input type='checkbox' select-row='row'/>
   *   </td>
   * </tr>
   * ```
   * @name selectRow
   * @returns {*}
   */
  function selectRow() {
    return {
      scope: {},          // isolate scope
      restrict: 'A',
      require: ['selectRow', '^listTable', '^stTable'],
      bindToController: {
        row: '=selectRow'
      },
      controller: SelectRowController,
      controllerAs: 'selectRowCtrl',
      link: link
    };

    ////////////////////

    function link(scope, element, attrs, ctrl) {
      var selectRowCtrl = ctrl[0];
      var listTableCtrl = ctrl[1];
      var smartTableCtrl = ctrl[2];
      element.click(clickHandler);

      // select or unselect row
      function clickHandler() {
        scope.$apply(function () {
          scope.$evalAsync(function () {
            var checkedState = element.prop('checked');
            var row = selectRowCtrl.row;
            smartTableCtrl.select(row, 'multiple');
            listTableCtrl.updateSelected(row, checkedState);
          });
        });
      }
    }
  }
})();
