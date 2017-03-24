(function () {
  'use strict';

  angular
    .module('helion.framework.widgets')
    .factory('RecursionHelper', RecursionHelper);

  RecursionHelper.$inject = [
    '$compile'
  ];

  function RecursionHelper($compile) {
    return {
      /**
       * Manually compiles the element, fixing the recursion loop.
       * @param {object} element - Element
       * @param {function} [link] - A post-link function, or an object with function(s) registered via pre and post properties.
       * @returns {object} An object containing the linking functions.
       */
      compile: function (element, link) {
        // Normalize the link parameter
        if (angular.isFunction(link)) {
          link = { post: link };
        }

        // Break the recursion loop by removing the contents
        var contents = element.contents().remove();
        var compiledContents;
        return {
          pre: link && link.pre ? link.pre : null,
          post: function (scope, element) {
            // Compile the contents
            if (!compiledContents) {
              compiledContents = $compile(contents);
            }
            // Re-add the compiled contents to the element
            compiledContents(scope, function (clone) {
              element.append(clone);
            });

            // Call the post-linking function, if any
            if (link && link.post) {
              link.post.apply(null, arguments);
            }
          }
        };
      }
    };
  }
})();
