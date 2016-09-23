(function (phantom) {
  var page = require('webpage').create();

  
  page.onResourceError = function() {
    phantom.exit(1)
  }
  

  

  

  page.onConsoleMessage = function () {
      console.log.apply(console, arguments)
  }

  
  page.open('http://localhost:9876/?id=65151510')
  
}(phantom))
