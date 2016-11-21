(function () {
  'use strict';

  var helpers = require('../../po/helpers.po');
  var resetTo = require('../../po/resets.po');
  var loginPage = require('../../po/login-page.po');
  var endpointsDashboardPage = require('../../po/endpoints/endpoints-dashboard.po.js');
  var registerEndpoint = require('../../po/endpoints/register-endpoint.po.js');
  var applications = require('../../po/applications/applications.po');
  var navbar = require('../../po/navbar.po');

  describe('Endpoints Dashboard', function () {
    
    //TODO: Add token 'expired' test (see service-reconnect.spec.js)
    //TODO: Add endpoint 'error' test
    //TODO: Add more pre-req checks

    function resetToLoggedIn(stateSetter, isAdmin) {
      return browser.driver.wait(stateSetter())
        .then(function () {
          helpers.setBrowserNormal();
          helpers.loadApp();
          if (isAdmin) {
            loginPage.loginAsAdmin();
          } else {
            loginPage.loginAsNonAdmin();
          }

        });
    }

    describe('Workflow on log in (admin/non-admin + no endpoints/some endpoints)', function () {
      describe('As Admin', function () {

        describe('No registered endpoints', function () {
          beforeAll(function () {
            resetToLoggedIn(resetTo.removeAllCnsi, true);
          });

          it('Should reach endpoints dashboard after log in', function () {
            endpointsDashboardPage.isEndpoints().then(function (isEndpoints) {
              expect(isEndpoints).toBe(true);
            });
            expect(endpointsDashboardPage.welcomeMessageAdmin().isDisplayed()).toBeTruthy();
            expect(endpointsDashboardPage.getEndpointTable().isPresent()).toBeFalsy();
          });

          it('should show register button', function () {
            expect(endpointsDashboardPage.headerRegisterVisible()).toBeTruthy();
          });

        });

        describe('Some registered endpoints', function () {
          beforeAll(function () {
            resetToLoggedIn(resetTo.resetAllCnsi, true);
          });

          it('Should reach application wall with \'no clusters\' message after log in', function () {
            expect(applications.isApplicationWallNoClusters()).toBeTruthy();
          });

          it('Click on link to reach endpoints', function () {
            applications.clickEndpointsDashboard()
              .then(function () {
                return endpointsDashboardPage.isEndpoints();
              })
              .then(function (isEndpoints) {
                expect(isEndpoints).toBe(true);
              });
          });

          it('Welcome message should not be displayed', function () {
            expect(endpointsDashboardPage.welcomeMessage().isPresent()).toBeFalsy();
          });

          it('Table contents should be correct', function () {
            //TODO:RC ADD TESTS FOR TABLE STATE. see hce/hcf tests
            // var endpointsTable = endpointsDashboardPage.getEndpointTable();
            // var endpointsRows = helpers.getTableRows(endpointsTable);
            // for (var i = 0; i < endpointsRows.count(); i++) {
            //   expect(endpointsDashboardPage.endpointConnectLink(i).isDisplayed()).toBeTruthy();
            //   expect(endpointsDashboardPage.endpointError(i).isDisplayed()).toBeTruthy();
            // }
          });

        });

      });

      describe('As Non-Admin', function () {

        describe('No registered endpoints', function () {
          beforeAll(function () {
            resetToLoggedIn(resetTo.removeAllCnsi, false);
          });

          it('Should not display endpoint dashboard', function () {
            //TODO: RC check for no nav bar + 'not configured' message
            endpointsDashboardPage.isEndpoints().then(function (isEndpoints) {
              expect(isEndpoints).toBe(false);
            });
          });
        });

        describe('Some registered endpoints', function () {

          beforeAll(function () {
            resetToLoggedIn(resetTo.resetAllCnsi, false);
          });

          describe('endpoints table', function () {
            it('should be displayed', function () {
              endpointsDashboardPage.isEndpoints().then(function (isEndpoints) {
                expect(isEndpoints).toBe(true);
              });
            });

            it('should not show register button', function () {
              expect(endpointsDashboardPage.headerRegisterVisible()).toBeFalsy();
            });

            it('should show at least one endpoint', function () {
              var endpointsTable = endpointsDashboardPage.getEndpointTable();
              expect(helpers.getTableRows(endpointsTable).count()).toBeGreaterThan(0);
            });

            it('should show `Connect` link for each endpoint', function () {
              var endpointsTable = endpointsDashboardPage.getEndpointTable();
              var endpointsRows = helpers.getTableRows(endpointsTable);
              for (var i = 0; i < endpointsRows.count(); i++) {
                //TODO: RC Replace with each()
                expect(endpointsDashboardPage.endpointConnectLink(i).isDisplayed()).toBeTruthy();
                expect(endpointsDashboardPage.endpointError(i).isDisplayed()).toBeTruthy();
              }
            });

            it('Table contents should be correct', function () {
              //TODO:RC ADD TESTS FOR TABLE STATE. see hce/hcf tests
              // var endpointsTable = endpointsDashboardPage.getEndpointTable();
              // var endpointsRows = helpers.getTableRows(endpointsTable);
              // for (var i = 0; i < endpointsRows.count(); i++) {
              //   expect(endpointsDashboardPage.endpointConnectLink(i).isDisplayed()).toBeTruthy();
              //   expect(endpointsDashboardPage.endpointError(i).isDisplayed()).toBeTruthy();
              // }
            });

          });

        });

      });

    });

    // The following tests are all carried out as non-admin
    describe('Dashboard tests', function () {

      describe('Register endpoints', function () {

        function registerTests(type) {
          beforeAll(function () {
            resetToLoggedIn(resetTo.removeAllCnsi, true)
              .then(function () {
                // endpointsDashboardPage.showEndpoints();
                return endpointsDashboardPage.isEndpoints();
              })
              .then(function (isEndpoints) {
                expect(isEndpoints).toBe(true);

                // No endpoints ... no table
                expect(endpointsDashboardPage.getEndpointTable().isPresent()).toBeFalsy();
              });
          });

          beforeEach(function () {
            registerEndpoint.safeClose();
          });

          it('should show add form detail view when btn in welcome is pressed', function () {
            endpointsDashboardPage.clickAddClusterInWelcomeMessage().then(function () {
              expect(registerEndpoint.isVisible().isDisplayed()).toBeTruthy();
              expect(registerEndpoint.getType()).toBe('hcf');
            });
          });

          it('should show add form detail view when btn in tile is pressed', function () {
            endpointsDashboardPage.headerRegister().then(function () {
              expect(registerEndpoint.isVisible().isDisplayed()).toBeTruthy();
              expect(registerEndpoint.getType()).toBe('hcf');
            });
          });

          describe('Form', function () {
            var service = type === 'hcf' ? helpers.getHcfs().hcf1 : helpers.getHces().hce1;

            beforeEach(function () {
              endpointsDashboardPage.headerRegister()
                .then(function () {
                  expect(registerEndpoint.isVisible().isDisplayed()).toBeTruthy();
                  expect(registerEndpoint.getType()).toBe('hcf');
                });
            });

            describe('Initial button state', function () {

              it('Cancel is enabled', function () {
                registerEndpoint.closeEnabled(true);
              });

              it('Register is initially disabled', function () {
                registerEndpoint.registerEnabled(false);
              });
            });

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

            it('Should hint at SSL errors', function () {
              registerEndpoint.populateAndRegister(type, service.register.api_endpoint, service.register.cnsi_name, false)
                .then(function () {
                  return registerEndpoint.checkError(/SSL/);
                });
            });

            it('Successful register', function () {
              var endpointIndex;
              registerEndpoint.populateAndRegister(type, service.register.api_endpoint, service.register.cnsi_name,
                service.register.skip_ssl_validation)
                .then(function () {
                  var toastText = new RegExp("Helion (?:Code Engine|Cloud Foundry) endpoint '" +
                    service.register.cnsi_name + "' successfully registered");
                  return helpers.checkAndCloseToast(toastText);
                })
                .then(function () {

                  var endpointsTable = endpointsDashboardPage.getEndpointTable();
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
                  expect(endpointsDashboardPage.endpointStatus(endpointIndex, 'helion-icon-Connect').isPresent()).toBeTruthy();
                });
            });

          });
        }

        describe('Register hce', function () {
          registerTests('hce');
        });

        describe('Register hcf', function () {
          registerTests('hcf');
        });

        describe('Unregister', function () {
          //TODO: RC

        });

      });

      describe('Connect/Disconnect endpoints', function () {

        beforeAll(function (done) {
          resetToLoggedIn(resetTo.resetAllCnsi, false).then(function () {
            // endpointsDashboardPage.showEndpoints();
            endpointsDashboardPage.isEndpoints().then(function (isEndpoints) {
              expect(isEndpoints).toBe(true);
            });
            var endpointsTable = endpointsDashboardPage.getEndpointTable();
            // Four rows, two endpoints + two endpoint not connected rows
            expect(helpers.getTableRows(endpointsTable).count()).toBe(4);
            done();
          });
        });

        var hcf = helpers.getHcfs().hcf1;
        // Each cnsi has two rows (one normally hidden). So actual row is index * 2
        var hcfRow = 2;

        function ConfirmFirstService(service) {
          // Confirm the first row is the required one (to match creds later)
          var endpointsTable = endpointsDashboardPage.getEndpointTable();
          helpers.getTableCellAt(endpointsTable, hcfRow, 0).getText().then(function (endpointName) {
            expect(service.register.cnsi_name).toEqual(endpointName.toLowerCase());
          });
        }

        describe('endpoint `Connect` clicked', function () {

          beforeAll(function (done) {
            ConfirmFirstService(hcf);
            endpointsDashboardPage.endpointConnectLink(hcfRow).click().then(done);
          });

          it('should open the credentials form', function () {
            expect(endpointsDashboardPage.credentialsForm().isDisplayed()).toBeTruthy();
          });

          it('should show the cluster name and URL as readonly in the credentials form', function () {
            var endpointsTable = endpointsDashboardPage.getEndpointTable();
            var name = helpers.getTableCellAt(endpointsTable, hcfRow, 0).getText().then(function(text) {
              return text.toLowerCase();
            });
            var url = helpers.getTableCellAt(endpointsTable, hcfRow, 3).getText().then(function(text) {
              return text.replace('https://', '');
            });

            var fields = endpointsDashboardPage.credentialsFormFields();
            expect(fields.get(0).getAttribute('value')).toBe(name);
            expect(fields.get(1).getAttribute('value')).toBe(url);
            expect(fields.get(2).getAttribute('value')).toBe('');
            expect(fields.get(3).getAttribute('value')).toBe('');
          });

          it('should disable connect button if username and password are blank', function () {
            expect(endpointsDashboardPage.credentialsFormConnectButton().isEnabled()).toBeFalsy();
          });

          it('should enable connect button if username and password are not blank', function () {
            endpointsDashboardPage.credentialsFormFill(hcf.admin.username, hcf.admin.password);
            expect(endpointsDashboardPage.credentialsFormConnectButton().isEnabled()).toBeTruthy();
          });

          it('should update service instance data on register', function () {
            endpointsDashboardPage.credentialsFormEndpointConnect().then(function () {
              helpers.checkAndCloseToast(/Successfully connected to '(?:hcf|hce)'/);
              var endpointsTable = endpointsDashboardPage.getEndpointTable();
              expect(helpers.getTableCellAt(endpointsTable, hcfRow, 4).getText()).toBe('DISCONNECT');
              expect(endpointsDashboardPage.endpointStatus(hcfRow, 'helion-icon-Active_L').isDisplayed()).toBeTruthy();
            });
          });

          it('should go directly to applications view on logout and login (as admin)', function () {
            // This would be better in the 'non admin' section, however it's easier to test here with a service registered
            // This removes the need to go through/test the endpoint dashboard registration process alongside this test
            navbar.logout();
            loginPage.login(helpers.getAdminUser(), helpers.getAdminPassword());

            expect(browser.getCurrentUrl()).toBe(helpers.getHost() + '/#/cf/applications/list/gallery-view');
          });


          it('should go directly to applications view on logout and login', function () {
            navbar.logout();
            loginPage.login(helpers.getUser(), helpers.getPassword());

            expect(browser.getCurrentUrl()).toBe(helpers.getHost() + '/#/cf/applications/list/gallery-view');
          });

        });

        describe('endpoint `Disconnect`', function () {
          it('should update row in table when disconnected', function () {
            endpointsDashboardPage.goToEndpoints();
            endpointsDashboardPage.endpointDisconnectLink(hcfRow).click()
              .then(function () {
                helpers.checkAndCloseToast(/Successfully disconnected endpoint '(?:hcf|hce)'/);
                var endpointsTable = endpointsDashboardPage.getEndpointTable();
                expect(helpers.getTableCellAt(endpointsTable, hcfRow, 4).getText()).toBe('CONNECT');
              });
          });

        });

      });

    });

  });
})();
