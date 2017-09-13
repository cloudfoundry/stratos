(function () {
  'use strict';

  var wrapper = require('../wrapper.po');

  module.exports = {
    getRows: getRows,
    getData: getData,
    getItem: getItem
  };

  wrapper(module);

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
