(function () {
  'use strict';

  var _ = require('../../../tools/node_modules/lodash');

  module.exports = {
    wrap: wrap
  };

  function wrap(element) {
    return {
      getElement: function () {
        return element;
      },
      getRows: _.partial(getRows, element),
      //getItem: _.partial(getItem, element),
      getData: _.partial(getData, element),
      getItem: _.partial(getItem, element)
    };
  }

  function getRows(ele) {
    //return ele.element(by.css('.wizard-head h4')).getText();
    return ele.all(by.css('tbody tr'));
  }

  function getItem(ele, row, column) {
    return ele.all(by.css('tbody tr')).get(row).all(by.css('td')).get(column);
  }

  function getData(ele) {
    return this.getRows(ele).map(function (row) {
      return row.all(by.css('td')).map(function (col) {
        return col.getText();
      });
    });
  }

})();
