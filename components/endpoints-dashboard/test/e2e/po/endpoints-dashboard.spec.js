(function () {
  'use strict';

  var appCore = '../../../../app-core/frontend/';
  var cloudFoundry = '../../../../cloud-foundry/frontend/';

  var helpers = require(appCore + 'test/e2e/po/helpers.po');
  var resetTo = require(appCore + 'test/e2e/po/resets.po');
  var loginPage = require(appCore + 'test/e2e/po/login-page.po');
  var endpointsPage = require('./endpoints/endpoints-dashboard.po.js');
  var registerEndpoint = require('./endpoints/register-endpoint.po.js');
  var navbar = require(appCore + 'test/e2e/po/navbar.po');
  var actionMenu = require(appCore + 'test/e2e/po/widgets/actions-menu.po');
  var confModal = require(appCore + 'test/e2e/po/widgets/confirmation-modal.po');
  var _ = require('lodash');

  // These are pretty tied into the tests. The dashboard will need to know about specific endpoints to determine
  // behaviour on log in, out, etc. These could, if a problem, be split out into the cf app if this becomes a problem
  var cfHelpers = require(cloudFoundry + 'test/e2e/po/helpers.po');
  var applications = require(cloudFoundry + 'test/e2e/po/applications/applications.po');

  describe('Endpoints Dashboard -', function () {

    function resetToLoggedIn(stateSetter, isAdmin) {
      return browser.driver.wait(stateSetter())
        .then(function () {
          helpers.setBrowserNormal();
          helpers.loadApp();
          return isAdmin ? loginPage.loginAsAdmin() : loginPage.loginAsNonAdmin();
        });
    }

    describe('Workflow on log in (admin/non-admin + no endpoints/some endpoints) -', function () {
      describe('As Admin -', function () {

        describe('No registered endpoints', function () {
          beforeAll(function () {
            resetToLoggedIn(resetTo.removeAllCnsi, true);
          });

          it('Should reach endpoints dashboard after log in', function () {
            endpointsPage.isEndpoints().then(function (isEndpoints) {
              expect(isEndpoints).toBe(true);
            });
            expect(endpointsPage.isWelcomeMessageAdmin()).toBeTruthy();
            expect(endpointsPage.getEndpointTable().isDisplayed()).toBeFalsy();
          });

          it('should show register button', function () {
            expect(endpointsPage.headerRegisterVisible()).toBeTruthy();
          });

        });

        describe('Some registered endpoints', function () {
          beforeAll(function () {
            resetToLoggedIn(resetTo.resetAllCnsi, true);
          });

          it('Should reach endpoint dashboard after log in', function () {
            expect(endpointsPage.isEndpoints()).toBeTruthy();
          });

          it('Should show application wall with \'no clusters\' message', function () {
            applications.showApplications();
            expect(applications.isApplicationWallNoClusters()).toBeTruthy();
          });

          it('Click on application wall link to reach endpoints', function () {
            applications.clickEndpointsDashboard()
              .then(function () {
                return endpointsPage.isEndpoints();
              })
              .then(function (isEndpoints) {
                expect(isEndpoints).toBe(true);
              });
          });

          it('Welcome message should be displayed', function () {
            expect(endpointsPage.welcomeMessage().isPresent()).toBeTruthy();
          });

        });

      });

      describe('As Non-Admin -', function () {

        describe('No registered endpoints -', function () {
          beforeAll(function () {
            resetToLoggedIn(resetTo.removeAllCnsi, false);
          });

          it('Should not display endpoint dashboard', function () {
            endpointsPage.isEndpoints().then(function (isEndpoints) {
              expect(isEndpoints).toBe(false);
              expect(element(by.css('.applications-msg')).getText()).toBe('There are no registered endpoints.');
              expect(navbar.navBarElement().isPresent()).toBeFalsy();
            });
          });
        });

        describe('Some registered endpoints -', function () {

          beforeAll(function () {
            resetToLoggedIn(resetTo.resetAllCnsi, false);
          });

          describe('endpoints table -', function () {
            it('should be displayed', function () {
              endpointsPage.isEndpoints().then(function (isEndpoints) {
                expect(isEndpoints).toBe(true);
              });
              expect(endpointsPage.isWelcomeMessageNonAdmin()).toBeTruthy();
            });

            it('should not show register button', function () {
              expect(endpointsPage.headerRegisterVisible()).toBeFalsy();
            });

            it('should show at least one endpoint', function () {
              var endpointsTable = endpointsPage.getEndpointTable();
              expect(helpers.getTableRows(endpointsTable).count()).toBeGreaterThan(0);
            });

            it('should show correct table content', function () {
              // For each cnsi endpoint
              // 1) we show the correct type
              // 2) the icon is the correct 'disconnected' one
              // 3) the address is correct
              // 4) the 'connect' button is available
              var endpointsTable = endpointsPage.getEndpointTable();
              var endpointsRows = helpers.getTableRows(endpointsTable);
              endpointsRows.each(function (element, index) {
                if (index % 2 === 0) {
                  // Row is an endpoint
                  var service, serviceType;
                  // Find the name and run type dependent tests
                  endpointsPage.endpointName(index).then(function (name) {
                    name = name.toLowerCase();
                    var cnsisConfig = helpers.getCNSIs();

                    for (var type in cnsisConfig) {
                      if (!cnsisConfig.hasOwnProperty(type)) { continue; }
                      var cnsis = cnsisConfig[type];
                      service = _.find(cnsis, function (cnsi) {
                        if (cnsi.register.cnsi_name === name) {
                          return cnsi;
                        }
                      });
                      if (service) {
                        serviceType = type;
                        break;
                      }
                    }

                    if (service) {
                      // 1) we show the correct type
                      if (serviceType === 'cf') {
                        expect(endpointsPage.endpointType(index)).toBe('Cloud Foundry');
                      }
                      // 3) the address is correct
                      expect(endpointsPage.endpointUrl(index)).toBe(service.register.api_endpoint);
                      // 2) the icon is the correct 'disconnected' one
                      expect(endpointsPage.endpointIsDisconnected(index)).toBeTruthy();
                      // 4) the 'connect' button is available
                      endpointsPage.endpointConnectLink(index).then(function (button) {
                        expect(button.isDisplayed()).toBeTruthy();
                      });
                    }
                  });
                }
              });
            });

          });

        });

      });

    });

    // The following tests are all carried out as non-admin
    describe('Dashboard tests -', function () {

      describe('Register endpoints -', function () {

        function registerTests(type) {
          beforeAll(function () {
            resetToLoggedIn(resetTo.removeAllCnsi, true)
              .then(function () {
                return endpointsPage.isEndpoints();
              })
              .then(function (isEndpoints) {
                expect(isEndpoints).toBe(true);

                // No endpoints ... no table
                expect(endpointsPage.getEndpointTable().isDisplayed()).toBeFalsy();
              });
          });

          beforeEach(function () {
            registerEndpoint.safeClose();
          });

          it('should show add form detail view when btn in welcome is pressed', function () {
            endpointsPage.clickAddClusterInWelcomeMessage().then(function () {
              expect(registerEndpoint.isVisible().isDisplayed()).toBeTruthy();
            });
          });

          it('should show add form detail view when btn in tile is pressed', function () {
            endpointsPage.headerRegister().then(function () {
              expect(registerEndpoint.isVisible().isDisplayed()).toBeTruthy();
            });
          });

          describe('Form', function () {
            var service = helpers.getRegisteredService();

            beforeEach(function () {
              endpointsPage.headerRegister()
                .then(function () {
                  expect(registerEndpoint.isVisible().isDisplayed()).toBeTruthy();
                  expect(registerEndpoint.getStep()).toBe(2);
                  registerEndpoint.closeEnabled(true);
                  // registerEndpoint.selectType(type);
                });
            });

            describe('endpoint details step', function () {
              it('is endpoint details step', function () {
                expect(registerEndpoint.getStep()).toBe(2);
                expect(registerEndpoint.getStepTwoType()).toBe(type);
              });

              if (type === 'cf') {
                describe('Invalid address', function () {

                  var invalidUrl = 'This is an invalid URL';

                  beforeEach(function () {
                    // Enter a name so the form will become valid on valid address
                    registerEndpoint.enterName('abc').then(function () {
                      return registerEndpoint.registerEnabled(false);
                    });
                  });

                  it('Incorrect format', function () {
                    registerEndpoint.enterAddress(invalidUrl)
                      .then(function () {
                        return registerEndpoint.isAddressValid(false);
                      })
                      .then(function () {
                        registerEndpoint.registerEnabled(false);
                      });
                  });

                  it('Valid format', function () {
                    registerEndpoint.enterAddress(service.register.api_endpoint)
                      .then(function () {
                        return registerEndpoint.isAddressValid(true);
                      })
                      .then(function () {
                        registerEndpoint.registerEnabled(true);
                      });
                  });

                  it('Invalid to valid to invalid', function () {
                    registerEndpoint.enterAddress(invalidUrl)
                      .then(function () {
                        return registerEndpoint.isAddressValid(false);
                      })
                      .then(function () {
                        return registerEndpoint.registerEnabled(false);
                      })
                      .then(function () {
                        return registerEndpoint.clearAddress();
                      })
                      .then(function () {
                        return registerEndpoint.enterAddress(service.register.api_endpoint);
                      })
                      .then(function () {
                        return registerEndpoint.isAddressValid(true);
                      })
                      .then(function () {
                        return registerEndpoint.registerEnabled(true);
                      })
                      .then(function () {
                        return registerEndpoint.clearAddress();
                      })
                      .then(function () {
                        return registerEndpoint.enterAddress(invalidUrl);
                      })
                      .then(function () {
                        return registerEndpoint.isAddressValid(false);
                      })
                      .then(function () {
                        return registerEndpoint.registerEnabled(false);
                      });
                  });
                });

                describe('Invalid name', function () {

                  beforeEach(function () {
                    // Enter a url so the form will become valid on valid Name
                    registerEndpoint.enterAddress(service.register.api_endpoint).then(function () {
                      return registerEndpoint.registerEnabled(false);
                    });
                  });

                  it('Valid', function () {
                    registerEndpoint.enterName(service.register.cnsi_name)
                      .then(function () {
                        registerEndpoint.isNameValid(true);
                        registerEndpoint.registerEnabled(true);
                      });
                  });

                  it('Invalid to valid to invalid', function () {
                    registerEndpoint.enterName(service.register.cnsi_name)
                      .then(function () {
                        registerEndpoint.isNameValid(true);
                        registerEndpoint.registerEnabled(true);
                      })
                      .then(function () {
                        return registerEndpoint.clearName();
                      })
                      .then(function () {
                        registerEndpoint.isNameValid(false);
                        registerEndpoint.registerEnabled(false);
                      })
                      .then(function () {
                        return registerEndpoint.enterName(service.register.cnsi_name);
                      })
                      .then(function () {
                        registerEndpoint.isNameValid(true);
                        registerEndpoint.registerEnabled(true);
                      });
                  });
                });
              }

              it('Should hint at SSL errors', function () {
                registerEndpoint.populateAndRegister(service.register.api_endpoint, service.register.cnsi_name, false)
                  .then(function () {
                    return registerEndpoint.checkError(/SSL/);
                  });
              });

              it('Successful register', function () {
                var endpointIndex;
                registerEndpoint.populateAndRegister(service.register.api_endpoint, service.register.cnsi_name,
                  service.register.skip_ssl_validation)
                  .then(function () {
                    var toastText = new RegExp("Endpoint '" + service.register.cnsi_name + "' successfully registered");
                    return helpers.checkAndCloseToast(toastText);
                  })
                  .then(function () {

                    var endpointsTable = endpointsPage.getEndpointTable();
                    var endpointsRows = helpers.getTableRows(endpointsTable);

                    return endpointsRows.each(function (element, index) {
                      return element.all(by.css('td')).first().getText().then(function (name) {
                        if (name.toLowerCase() === service.register.cnsi_name.toLowerCase()) {
                          endpointIndex = index;
                        }
                      });
                    });
                  })
                  .then(function () {
                    expect(endpointIndex).toBeDefined();
                    expect(endpointsPage.endpointIsDisconnected(endpointIndex)).toBeTruthy();
                  });
              });
            });
          });
        }

        describe('Register cf -', function () {
          registerTests('cf');
        });

      });

      describe('Unregister Endpoints -', function () {

        describe('As Admin -', function () {
          var endpointCount;

          beforeAll(function () {
            resetToLoggedIn(resetTo.resetAllCnsi, true)
              .then(function () {
                endpointsPage.showEndpoints();
                return endpointsPage.isEndpoints();
              })
              .then(function (isEndpoints) {
                expect(isEndpoints).toBe(true);

                expect(endpointsPage.getEndpointTable().isDisplayed()).toBeTruthy();
                return helpers.getTableRows(endpointsPage.getEndpointTable()).count();
              })
              .then(function (count) {
                endpointCount = count;
              });
          });

          it('Successfully unregister', function () {
            var toDelete = helpers.getRegisteredService().register.cnsi_name;
            var actionMenuElement, cfRowIndex;
            endpointsPage.getRowWithEndpointName(toDelete)
              .then(function (index) {
                cfRowIndex = index;
                expect(cfRowIndex).toBeDefined();
                actionMenuElement = endpointsPage.endpointActionMenu(cfRowIndex);
                expect(actionMenu.getItems(actionMenuElement).count()).toBe(2);
                expect(actionMenu.getItemText(actionMenuElement, 1)).toBe('Unregister');
                return actionMenu.click(actionMenuElement);
              })
              .then(function () {
                return actionMenu.clickItem(actionMenuElement, 1);
              })
              .then(function () {
                expect(confModal.isVisible()).toBeTruthy();
                return confModal.cancel();
              })
              .then(function () {
                expect(confModal.isVisible()).toBeFalsy();
                return actionMenu.click(actionMenuElement);
              })
              .then(function () {
                return actionMenu.clickItem(actionMenuElement, 1);
              })
              .then(function () {
                expect(confModal.isVisible()).toBeTruthy();
                return confModal.commit();
              })
              .then(function () {
                // The new row count should be two less than when we started (row had an additional 'disconnected' error)
                endpointsPage.getEndpointTable().isDisplayed().then(function (haveTable) {
                  if (haveTable) {
                    expect(helpers.getTableRows(endpointsPage.getEndpointTable()).count()).toBe(endpointCount - 2);
                  }
                });
              });
          });
        });

        describe('As User -', function () {

          beforeAll(function () {
            resetToLoggedIn(resetTo.resetAllCnsi, false)
              .then(function () {
                endpointsPage.showEndpoints();
                return endpointsPage.isEndpoints();
              })
              .then(function (isEndpoints) {
                expect(isEndpoints).toBe(true);
                endpointsPage.waitForEndpointTable();
              });
          });

          it('unregister is not visible', function () {
            endpointsPage.getRowWithEndpointName(helpers.getRegisteredService().register.cnsi_name)
              .then(function (cfRowIndex) {
                expect(cfRowIndex).toBeDefined();
                var actionMenuElement = endpointsPage.endpointActionMenu(cfRowIndex);
                expect(actionMenu.isSingleButton(actionMenuElement)).toBeTruthy();
                expect(actionMenu.getSingleButtonText(actionMenuElement)).not.toBe('Unregister');
              });
          });
        });

      });

      describe('Connect/Disconnect endpoints -', function () {
        var cf = helpers.getRegisteredService();
        var cfRowIndex;
        beforeAll(function (done) {
          resetToLoggedIn(resetTo.resetAllCnsi, false)
            .then(function () {
              endpointsPage.isEndpoints().then(function (isEndpoints) {
                expect(isEndpoints).toBe(true);
              });
            })
            .then(function () {
              // Find the CF row to test on
              return endpointsPage.getRowWithEndpointName(helpers.getRegisteredService().register.cnsi_name);
            })
            .then(function (index) {
              expect(index).toBeDefined();
              cfRowIndex = index;
              done();
            });
        });

        describe('endpoint `Connect` -', function () {

          beforeAll(function (done) {
            endpointsPage.endpointConnectLink(cfRowIndex).then(function (button) {
              button.click().then(done);
            });
          });

          it('should open the credentials form', function () {
            expect(endpointsPage.credentialsForm().isDisplayed()).toBeTruthy();
          });

          it('should show the cluster name and URL as readonly in the credentials form', function () {
            var endpointsTable = endpointsPage.getEndpointTable();
            var name = helpers.getTableCellAt(endpointsTable, cfRowIndex, 0).getText().then(function (text) {
              return text.toLowerCase();
            });
            var url = helpers.getTableCellAt(endpointsTable, cfRowIndex, 3).getText().then(function (text) {
              return text.replace('https://', '');
            });

            var fields = endpointsPage.credentialsFormFields();
            expect(fields.get(0).getAttribute('value')).toBe(name);
            expect(fields.get(1).getAttribute('value')).toBe(url);
            expect(fields.get(2).getAttribute('value')).toBe('');
            expect(fields.get(3).getAttribute('value')).toBe('');
          });

          it('should disable connect button if username and password are blank', function () {
            expect(endpointsPage.credentialsFormConnectButton().isEnabled()).toBeFalsy();
          });

          it('should enable connect button if username and password are not blank', function () {
            endpointsPage.credentialsFormFill(cf.admin.username, cf.admin.password);
            expect(endpointsPage.credentialsFormConnectButton().isEnabled()).toBeTruthy();
          });

          it('should update service instance data on register', function () {
            endpointsPage.credentialsFormEndpointConnect().then(function () {
              helpers.checkAndCloseToast(/Successfully connected to '(?:cf)'/);
              var endpointsTable = endpointsPage.getEndpointTable();
              expect(helpers.getTableCellAt(endpointsTable, cfRowIndex, 5).getText()).toBe('DISCONNECT');
              expect(endpointsPage.endpointIsConnected(cfRowIndex)).toBeTruthy();
            });
          });

          it('should go directly to endpoint view on logout and login (as admin)', function () {
            // This would be better in the 'non admin' section, however it's easier to test here with a service registered
            // This removes the need to go through/test the endpoint dashboard registration process alongside this test
            navbar.logout();
            loginPage.waitForLogin();
            loginPage.login(helpers.getAdminUser(), helpers.getAdminPassword());

            expect(browser.getCurrentUrl()).toBe(helpers.getHost() + '/#/endpoint');
          });

          it('should go directly to applications view on logout and login', function () {
            navbar.logout();
            loginPage.waitForLogin();
            loginPage.login(helpers.getUser(), helpers.getPassword());

            expect(browser.getCurrentUrl()).toBe(helpers.getHost() + '/#/cf/applications/list/gallery-view');
          });

        });

        describe('endpoint `Disconnect` -', function () {
          it('should update row in table when disconnected', function () {
            endpointsPage.goToEndpoints();
            endpointsPage.waitForEndpointTable();
            endpointsPage.endpointDisconnectLink(cfRowIndex)
              .then(function (button) {
                return button.click();
              })
              .then(function () {
                helpers.checkAndCloseToast(/Successfully disconnected endpoint '(?:cf)'/);
                var endpointsTable = endpointsPage.getEndpointTable();
                expect(helpers.getTableCellAt(endpointsTable, cfRowIndex, 5).getText()).toBe('CONNECT');
              });
          });

        });

      });

      describe('Error States -', function () {

        it('Unconnected', function () {
          // See checks in 'Workflow on log in (admin/non-admin + no endpoints/some endpoints)/Some As Admin/registered
          // endpoints/endpoints table/should show correct table content'
        });

        it('Token Expired', function () {
          resetToLoggedIn(resetTo.resetAllCnsi, false)
            .then(function () {
              // Connect the test non-admin user to all cnsis in params
              return resetTo.connectAllCnsi(helpers.getUser(), helpers.getPassword(), false);
            })
            .then(function () {
              // This is the magic that will cause the endpoint tokens to appear as expired
              helpers.forceDate(2100, 1, 20);
              endpointsPage.showEndpoints();
              return endpointsPage.isEndpoints();
            })
            .then(function (isEndpoints) {
              expect(isEndpoints).toBe(true);
              expect(endpointsPage.getEndpointTable().isDisplayed()).toBeTruthy();
              return endpointsPage.getRowWithEndpointName(helpers.getRegisteredService().register.cnsi_name);
            })
            .then(function (cfRowIndex) {
              expect(cfRowIndex).toBeDefined();
              var errorRow = endpointsPage.endpointError(cfRowIndex);
              expect(errorRow.isPresent()).toBeTruthy();
              var div = errorRow.element(by.css('.console-popover-alert'));
              expect(div.isPresent()).toBeTruthy();
              expect(helpers.hasClass(div, 'console-popover-alert-error')).toBeTruthy();
              div.element(by.css('.popover-content')).getText().then(function (text) {
                expect(text.indexOf('Token has expired')).toBe(0);
              });
            });
        });
      });

    });

  }).skipWhen(cfHelpers.skipIfNoCF);
})();
