/* eslint-disable angular/json-functions */
(function () {
  'use strict';

  var helpers = require('../../po/helpers.po');
  var resetTo = require('../../po/resets.po');
  var loginPage = require('../../po/login-page.po');
  var galleryWall = require('../../po/applications/applications.po');
  var addAppWizard = require('../../po/applications/add-application-wizard.po');
  var addAppHcfApp = require('../../po/applications/add-application-hcf-app.po');
  var addAppService = require('../../po/applications/add-application-services.po');
  var _ = require('../../../tools/node_modules/lodash');
  var cfModel = require('../../po/models/cf-model.po');
  var proxyModel = require('../../po/models/proxy-model.po');
  var searchBox = require('../../po/widgets/input-search-box.po');
  var inputText = require('../../po/widgets/input-text.po');

  describe('Applications - Add application', function () {

    /**
     * This spec will ..
     * - Create, if missing, an e2e org + space with roles for admin + non-admin
     * - An application containing a service (but NO pipeline).
     * - Remove the application, if created, and it associated routes and service instance
     * - Will NOT remove the org + space. This will allow us to see any remaining test artifacts
     *
     * THE ORDER OF TESTS IN THIS FILE IS IMPORTANT
     */

    var testApp, testCluster, testOrgName, testSpaceName, testUser, testAdminUser, clusterSearchBox,
      organizationSearchBox, spaceSearchBox, registeredCnsi, selectedCluster, selectedOrg, selectedSpace;
    var testTime = (new Date()).getTime();
    var hcfFromConfig = helpers.getHcfs().hcf1;

    function getSearchBoxes() {
      return element.all(by.css('.panel-body form .form-group'));
    }

    beforeAll(function () {
      // Setup the test environment. This will ensure....
      // - The required hcf is registered and connected (for both admin and non-admin users)
      // - The app wall is showing
      // - The app wall has the required hcf, organization and space filters set correctly

      // Reset all cnsi that exist in params
      var promise = resetTo.resetAllCnsi()
        .then(function () {
          // Connect the test non-admin user to all cnsis in params
          return resetTo.connectAllCnsi(helpers.getUser(), helpers.getPassword(), false);
        })
        .then(function () {
          // Connect the test admin user to all cnsis in params (required to ensure correct permissions are set when
          // creating orgs + spaces)
          return resetTo.connectAllCnsi(helpers.getAdminUser(), helpers.getAdminPassword(), true);
        })
        .then(function () {
          // Fetch the e2e org and space names
          testOrgName = hcfFromConfig.testOrgName;
          testSpaceName = hcfFromConfig.testSpaceName;
          expect(testOrgName).toBeDefined();
          expect(testSpaceName).toBeDefined();
          // Fetch the cnsi metadata
          return proxyModel.fetchRegisteredCnsi(null, helpers.getUser(), helpers.getPassword()).then(function (response) {
            registeredCnsi = JSON.parse(response);
            testCluster = _.find(registeredCnsi, {name: hcfFromConfig.register.cnsi_name});
            expect(testCluster).toBeDefined();
          });
        })
        .then(function () {
          // Set up/find the required organization and space

          // Fetch the hcf admin + non-admin user guids. This will be used for org + space roles
          return cfModel.fetchUsers(testCluster.guid)
            .then(function (users) {
              testUser = _.find(users, {entity: {username: hcfFromConfig.user.username}});
              testAdminUser = _.find(users, {entity: {username: hcfFromConfig.admin.username}});
              expect(testUser).toBeDefined();
              expect(testAdminUser).toBeDefined();
            }).then(function () {
              // Add required test organisation if it does not exist
              // POSSIBLE IMPROVEMENT - Ensure both admin + non-admin have correct roles
              return cfModel.addOrgIfMissing(testCluster.guid, testOrgName, testAdminUser.metadata.guid,
                testUser.metadata.guid);
            })
            .then(function (organization) {
              // Add required test space if it does not exist
              // POSSIBLE IMPROVEMENT - Ensure both admin + non-admin have correct roles
              return cfModel.addSpaceIfMissing(testCluster.guid, organization.metadata.guid, testOrgName, testSpaceName,
                testAdminUser.metadata.guid, testUser.metadata.guid);
            });
        })
        .then(function () {
          // Load the browser and navigate to app wall
          helpers.setBrowserNormal();
          helpers.loadApp();
          // Log in as a standard non-admin user
          loginPage.loginAsNonAdmin();
          return galleryWall.showApplications();
        })
        .then(function () {
          expect(galleryWall.isApplicationWall()).toBeTruthy();
        })
        .then(function () {
          // Select the required HCF cluster
          clusterSearchBox = searchBox.wrap(getSearchBoxes().get(0));
          expect(clusterSearchBox.isDisplayed()).toBe(true);
          expect(clusterSearchBox).toBeDefined();
          expect(clusterSearchBox.getOptionsCount()).toBeGreaterThan(1);
          return clusterSearchBox.selectOptionByLabel(testCluster.name);
        })
        .then(function () {
          // Get the selected cluster
          return clusterSearchBox.getValue().then(function (text) {
            selectedCluster = text;
            expect(selectedCluster).toEqual(testCluster.name);
          });
        })
        .then(function () {
          // Select the required e2e organization
          organizationSearchBox = searchBox.wrap(getSearchBoxes().get(1));
          expect(organizationSearchBox).toBeDefined();
          expect(organizationSearchBox.getOptionsCount()).toBeGreaterThan(1);
          return organizationSearchBox.selectOptionByLabel(testOrgName);
        })
        .then(function () {
          // Get the selected organization
          return organizationSearchBox.getValue().then(function (text) {
            selectedOrg = text;
            expect(selectedOrg).toEqual(testOrgName);
          });
        })
        .then(function () {
          // Select the required e2e space
          spaceSearchBox = searchBox.wrap(getSearchBoxes().get(2));
          expect(spaceSearchBox).toBeDefined();
          expect(spaceSearchBox.getOptionsCount()).toBeGreaterThan(1);
          return spaceSearchBox.selectOptionByLabel(testSpaceName);
        })
        .then(function () {
          // Get the selected space
          return spaceSearchBox.getValue().then(function (text) {
            selectedSpace = text;
            expect(selectedSpace).toEqual(testSpaceName);
          });
        });

      // Ensure we don't continue until everything is set up
      return browser.driver.wait(promise);
    });

    afterAll(function () {
      if (testApp) {
        var promise = cfModel.deleteAppIfExisting(testCluster.guid, testApp.entity.name, helpers.getUser(), helpers.getPassword())
          .catch(function (error) {
            fail('Failed to clean up after running e2e test, there may be a rogue app named: \'' + (testApp.entity.name || 'unknown') + '\'. Error:', error);
          });
        browser.driver.wait(promise);
      }
    });

    it('Add Application button should be visible', function () {
      expect(galleryWall.getAddApplicationButton().isDisplayed()).toBeTruthy();
    });

    it('Add Application button shows fly out with correct values', function () {
      var selectedHcf = _.find(registeredCnsi, {name: selectedCluster});
      var domain = selectedHcf.api_endpoint.Host.substring(4);

      galleryWall.addApplication().then(function () {
        expect(addAppWizard.isDisplayed()).toBeTruthy();

        expect(addAppWizard.getTitle()).toBe('Add Application');

        addAppWizard.getWizard().getStepNames().then(function (names) {
          expect(names.length).toBe(3);
        });

        addAppWizard.getWizard().getStepNames().then(function (steps) {
          expect(steps[0]).toBe('Name');
          expect(steps[1]).toBe('Services');
          expect(steps[2]).toBe('Delivery');
        });

        addAppHcfApp.name().getValue().then(function (text) {
          expect(text).toBe('');
        });

        addAppHcfApp.hcf().getValue().then(function (text) {
          expect(text).toBe(selectedCluster);
        });
        addAppHcfApp.organization().getValue().then(function (text) {
          expect(text).toBe(selectedOrg);
        });
        addAppHcfApp.space().getValue().then(function (text) {
          expect(text).toBe(selectedSpace);
        });

        addAppHcfApp.domain().getValue().then(function (text) {
          expect(text).toBe(domain);
        });
        addAppHcfApp.host().getValue().then(function (text) {
          expect(text).toBe('');
        });

        addAppWizard.getWizard().isCancelEnabled().then(function (enabled) {
          expect(enabled).toBe(true);
        });

        addAppWizard.getWizard().isNextEnabled().then(function (enabled) {
          expect(enabled).toBe(false);
        });

      });
    });

    it('Create hcf app', function () {
      // Should be on the add hcf app step
      expect(addAppWizard.getWizard().getCurrentStep().getText()).toBe('Name');

      var appName = 'acceptance.e2e.' + testTime;
      var hostName = appName.replace(/\./g, '_');

      var promise = addAppHcfApp.name().addText(appName)
        .then(function () {
          return addAppHcfApp.host().getValue().then(function (text) {
            expect(text).toBe(appName);
          });
        }).then(function () {
          return addAppWizard.getWizard().isNextEnabled().then(function (enabled) {
            expect(enabled).toBe(false);
          });
        })
        .then(function () {
          return addAppHcfApp.host().clear();
        })
        .then(function () {
          return addAppHcfApp.host().addText(hostName);
        })
        .then(function () {
          return addAppWizard.getWizard().isNextEnabled().then(function (enabled) {
            expect(enabled).toBe(true);
          });
        })
        .then(function () {
          return addAppWizard.getWizard().next();
        })
        .then(function () {
          helpers.checkAndCloseToast(/A new application and route have been created for '[^']+'/);
        })
        .then(function () {
          return cfModel.fetchApp(testCluster.guid, appName, helpers.getUser(), helpers.getPassword())
            .then(function (app) {
              testApp = app;
              expect(app).toBeTruthy();
            })
            .catch(function () {
              fail('Failed to determine if app exists');
            });
        });

      browser.driver.wait(promise);
    });

    it('Add basic service', function () {
      var serviceName = 'acceptance.e2e.service.' + testTime;
      // Should be on the services section of the wizard now
      expect(addAppWizard.getWizard().getCurrentStep().getText()).toBe('Services');

      // Should be able to cancel still
      addAppWizard.getWizard().isCancelEnabled().then(function (enabled) {
        expect(enabled).toBe(true);
      });

      // Should be able to skip services, so next should be enabled
      addAppWizard.getWizard().isNextEnabled().then(function (enabled) {
        expect(enabled).toBe(true);
      });

      // Ensure we have more than one service
      expect(addAppService.getServices().count()).toBeGreaterThan(0);

      // Add the first service in the list
      var serviceWizard = addAppService.getServiceWizard();
      var promise = addAppService.addService('app-autoscaler')
        .then(function () {
          // Are we on the correct service tab?
          expect(serviceWizard.getSelectedAddServiceTab()).toBe('Create New Instance');
          // Initial save should be disabled
          return serviceWizard.getWizard().isNextEnabled().then(function (enabled) {
            expect(enabled).toBe(false);
          });
        })
        .then(function () {
          // Entering junk should keep the save button disabled
          return serviceWizard.getCreateNewName().addText(serviceName)
            .then(function () {
              return serviceWizard.getWizard().isNextEnabled().then(function (enabled) {
                expect(enabled).toBe(false);
              });
            });
        })
        .then(function () {
          // Fix the service name
          serviceName = serviceName.replace(/\./g, '_');
        })
        .then(function () {
          // Enter a valid service name should enable save
          return serviceWizard.getCreateNewName().clear()
            .then(function () {
              return serviceWizard.getCreateNewName().addText(serviceName);
            })
            .then(function () {
              return serviceWizard.getWizard().isNextEnabled().then(function (enabled) {
                expect(enabled).toBe(true);
              });
            });
        })
        .then(function () {
          // Save the new service
          return serviceWizard.getWizard().next().then(function () {
            helpers.checkAndCloseToast(/The '[^']+' service has been successfully attached to application '[^']+'/);
          });
        })
        .then(function () {
          // Move passed service screen
          return addAppWizard.getWizard().next();
        })
        .then(function () {
          return cfModel.fetchServiceExist(testCluster.guid, serviceName, helpers.getUser(), helpers.getPassword())
            .then(function (service) {
              expect(service).toBeTruthy();
            })
            .catch(function () {
              fail('Failed to determine if service exists');
            });
        });

      browser.driver.wait(promise);
    });

    it('Arrive at pipeline section of wizard', function () {
      expect(addAppWizard.getWizard().getCurrentStep().getText()).toBe('Delivery');
      addAppWizard.getWizard().cancel();
    });

    it('Should show add application button when no applications shown on app wall', function () {
      galleryWall.showApplications();
      galleryWall.resetFilters();
      galleryWall.getAddAppWhenNoApps().isPresent().then(function (present) {
        if (!present) {
          // Type some stuff in the search box that will result in no matching applications
          var appNameSearchBox = inputText.wrap(galleryWall.appNameSearch());
          appNameSearchBox.clear();
          return appNameSearchBox.addText('zzz_not_expecting_any_apps');
        }
      });
      galleryWall.getAddAppWhenNoApps().click();
      expect(addAppWizard.isDisplayed()).toBeTruthy();
      expect(addAppWizard.getTitle()).toBe('Add Application');
      addAppWizard.getWizard().cancel();
    });

  });
})();
