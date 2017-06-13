(function () {
  'use strict';

  angular
    .module('app.framework.widgets')
    .directive('codeBlock', codeBlock);

  /**
   * @namespace app.framework.widgets.codeBlock
   * @memberof app.framework.widgets
   * @name codeBlock
   * @description A coe block card directive that includes a copy icon to copy the text contents to the clipboard.
   * @example
   * <code-block theme="light" hide-copy="true">
   * // This is presented in the code
   * </code-block>
   * @returns {object} The code block directive definition object
   */
  function codeBlock() {
    return {
      bindToController: {
        theme: '@',
        hideCopy: '='
      },
      controller: CodeBlockController,
      controllerAs: 'codeBlockCtrl',
      scope: {},
      templateUrl: 'framework/widgets/code-block/code-block.html',
      transclude: true
    };
  }

  /**
   * @namespace app.framework.widgets.CodeBlockController
   * @memberof app.framework.widgets
   * @name CodeBlockController
   * @constructor
   * @param {object} $document - Angular $document service
   * @param {object} $timeout - Angular $timeout service
   */
  function CodeBlockController($document, $timeout) {

    var vm = this;

    vm.copyToClipboard = copyToClipboard;

    init();

    /**
     * @function init
     * @memberof app.framework.widgets.CodeBlockController
     * @description Controller init method - looks to see if copy to clipboard is supported by the browser
     * @returns {void}
     */
    function init() {
      // See if copy to clipboard is supported
      try {
        vm.canCopy = $document[0].queryCommandSupported('copy');
      } catch (e) {
        vm.canCopy = false;
      }
    }

    /**
     * @function copyToClipboard
     * @memberof app.framework.widgets.CodeBlockController
     * @description Copies the text content in the code block to the clipboard
     * @param {object} event - browser event that the user performed to initiate the copy to clipboard
     * @returns {void}
     */
    function copyToClipboard(event) {
      /* eslint-disable */
      var textElement = $document[0].createElement('textarea');
      var jqTextElement = $(textElement);
      var scrollTop = $($document[0]).scrollTop();
      try {
        var element = angular.element(event.event.target.parentElement);
        jqTextElement.addClass('console-code-block-temp');
        // Transclude needs a child element. If text is passed in then the transclude will add a span wrapper.
        // Ensure we get the text of this first element to avoid additional white space.
        textElement.textContent = $('pre:first-child', element).text();
        element.append(textElement);
        $document[0].getSelection().removeAllRanges();
        textElement.select();
        $document[0].execCommand('copy');

        // Show the message that we copied to the clipboard
        element.addClass('copy-success');
        $timeout(function() {
          element.removeClass('copy-success');
        }, 1000);
      } catch (err) {
        // Failed to copy to clipboard
      } finally {
        jqTextElement.remove();
        $document[0].getSelection().removeAllRanges();
      }
      event.event.preventDefault();
      event.event.stopPropagation();
      $($document[0]).scrollTop(scrollTop);
      /* eslint-enable */
    }
  }
})();
