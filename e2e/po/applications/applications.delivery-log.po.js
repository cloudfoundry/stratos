'use strict';

var helpers = require('../helpers.po');

var Q = require('../../../tools/node_modules/q');

module.exports = {
  getSummaryAt: getSummaryAt,
  getSummaryCount: getSummaryCount,
  getBuildsRowText: getBuildsRowText,
  getBuildsCount: getBuildsCount,
  searchBuilds: searchBuilds
};

function getSummary() {
  return element(by.id('delivery-logs-summary'));
}

function getSummaryCount() {
  return getSummary().all(by.css('.data-body > div:nth-of-type(1) > div')).count();
}

function getSummaryAt(index) {

  var sections = getSummary().all(by.css('.data-body > div'));
  var label = sections.get(0).all(by.css('div')).get(index);
  var value = sections.get(1).all(by.css('div')).get(index);

  return Q.all([label.getText(), value.element(by.css('a')).getText(), value.element(by.css('span')).getText()])
    .then(function (res) {
      return {
        label: res[0],
        values: {
          link: res[1],
          time: res[2]
        }
      };
    });
}

function getBuildsTable() {
  return element(by.id('delivery-logs-builds')).element(by.css('table'));
}

function getBuildsRowText(row) {
  var table = getBuildsTable();

  var promises = [];
  for (var i = 0; i < 5; i++) {
    promises.push(helpers.getTableCellAt(table, row, i).getText());
  }
  return Q.all(promises);
}

function getBuildsCount() {
  return helpers.getTableRows(getBuildsTable()).count();
}

function searchBuilds(text) {
  var field = element(by.css('#delivery-logs-search input'));
  return field.sendKeys(text);
}
