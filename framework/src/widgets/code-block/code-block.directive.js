(function () {
  'use strict';

  angular
    .module('helion.framework.widgets')
    .directive('codeBlock', codeBlock);

  codeBlock.$inject = ['helion.framework.basePath'];

  /**
   * @namespace helion.framework.widgets.codeBlock
   * @memberof helion.framework.widgets
   * @name codeBlock
   * @description A coe block card directive that includes a copy icon to copy the text contents to the clipboard.
   * @param {string} path - the framework base path
   * @example
   * <code-block theme="light" hide-copy="true">
   * // This is presented in the code
   * </code-block>
   * @returns {object} The code block directive definition object
   */
  function codeBlock(path) {
    return {
      bindToController: {
        theme: '@',
        hideCopy: '='
      },
      controller: CodeBlockController,
      controllerAs: 'codeBlockCtrl',
      scope: {},
      templateUrl: path + 'widgets/code-block/code-block.html',
      transclude: true
    };
  }

  CodeBlockController.$inject = [
    '$window',
    '$document',
    '$timeout'
  ];

  /**
   * @namespace helion.framework.widgets.CodeBlockController
   * @memberof helion.framework.widgets
   * @name CodeBlockController
   * @constructor
   * @param {object} $window - Angular $window service
   * @param {object} $document - Angular $document service
   * @param {object} $timeout - Angular $timeout service
   */
  function CodeBlockController($window, $document, $timeout) {
    this.$document = $document;
    this.$timeout = $timeout;
    this.init();
  }

  angular.extend(CodeBlockController.prototype, {
    /**
     * @function init
     * @memberof helion.framework.widgets.CodeBlockController
     * @description Controller init method - looks to see if copy to clipboard is supported by the browser
     * @returns {void}
     */
    init: function () {
      // See if copy to clipboard is supported
      try {
        this.canCopy = this.$document[0].queryCommandSupported('copy');
      } catch (e) {
        this.canCopy = false;
      }
    },

    /**
     * @function copyToClipboard
     * @memberof helion.framework.widgets.CodeBlockController
     * @description Copies the text content in the code block to the clipboard
     * @param {object} event - browser event that the user performed to initiate the copy to clipboard
     * @returns {void}
     */
    copyToClipboard: function (event) {
      /* eslint-disable */
      var that = this;
      var textElement = this.$document[0].createElement('textarea');
      var jqTextElement = $(textElement);
      var scrollTop = $(this.$document[0]).scrollTop();
      try {
        var element = angular.element(event.event.target.parentElement);
        jqTextElement.addClass('hpe-code-block-temp');
        // Transclude needs a child element. If text is passed in then the transclude will add a span wrapper.
        // Ensure we get the text of this first element to avoid additional white space.
        textElement.textContent = $('pre:first-child', element).text();
        element.append(textElement);
        this.$document[0].getSelection().removeAllRanges();
        textElement.select();
        this.$document[0].execCommand('copy');

        // Show the message that we copied to the clipboard
        element.addClass('copy-success');
        that.$timeout(function() {
          element.removeClass('copy-success');
        }, 1000);
      } catch (err) {
        // Failed to copy to clipboard
      } finally {
        jqTextElement.remove();
        this.$document[0].getSelection().removeAllRanges();
      }
      event.event.preventDefault();
      event.event.stopPropagation();
      $(this.$document[0]).scrollTop(scrollTop);
      /* eslint-enable */
    }
  });
})();
