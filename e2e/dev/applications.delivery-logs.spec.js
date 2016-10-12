'use strict';

var helpers = require('../po/helpers.po');
var resetTo = require('../po/resets.po');
var loginPage = require('../po/login-page.po');
var galleryPage = require('../po/applications.po');
var deliveryLogs = require('../po/applications.deliver-log.po');

var Q = require('../../tools/node_modules/q');
//
//describe('Application - Delivery Logs', function () {
//
//  function testPopulatedString(string) {
//    expect(string).toEqual(jasmine.any(String));
//    expect(string.length).toBeGreaterThan(0);
//  }
//
//  beforeAll(function () {
//    browser.driver.wait(resetTo.devWorkflow(false))
//      .then(function () {
//        helpers.setBrowserNormal();
//        helpers.loadApp();
//        loginPage.login('dev', 'dev');
//        galleryPage.showApplications();
//        galleryPage.showApplicationDetails(0);
//        galleryPage.showDeliveryLogs();
//      });
//  });
//
//  it('should show application delivery logs URL', function () {
//    var reg = new RegExp('http:\/\/' + helpers.getHost() + '\/#\/cf\/applications\/[0-9a-z-]*\/delivery-logs');
//    expect(browser.getCurrentUrl()).toMatch(reg);
//  });
//
//  it('summary values should be populated', function (done) {
//
//    function validateEntry(entry) {
//      testPopulatedString(entry.label);
//      testPopulatedString(entry.values.link);
//      testPopulatedString(entry.values.time);
//    }
//
//    deliveryLogs.getSummaryCount()
//      .then(function (count) {
//        var summaries = [];
//        for (var i = 0; i < count; i++) {
//          summaries.push(deliveryLogs.getSummaryAt(i));
//        }
//        return Q.all(summaries);
//      })
//      .then(function (res) {
//        for (var i = 0; i < res.length; i++) {
//          validateEntry(res[i]);
//        }
//        done();
//      })
//      .catch(function (error) {
//        fail(error);
//        done();
//      });
//
//  });
//
//  it('build data populated', function (done) {
//    deliveryLogs.getBuildsRowText(1)
//      .then(function (text) {
//        for (var i = 0; i < text.length; i++) {
//          testPopulatedString(text[i]);
//        }
//        done();
//      })
//      .catch(function (error) {
//        fail(error);
//        done();
//      });
//  });
//
//  it('basic search', function (done) {
//    deliveryLogs.getBuildsCount()
//      .then(function (count) {
//        expect(count).not.toBe(1);
//        return deliveryLogs.searchBuilds('Deploying');
//      })
//      .then(function () {
//        return deliveryLogs.getBuildsCount();
//      })
//      .then(function (count) {
//        expect(count).toBe(1);
//        done();
//      })
//      .catch(function (error) {
//        fail(error);
//        done();
//      });
//  });
//});
