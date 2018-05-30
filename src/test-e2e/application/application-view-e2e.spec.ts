import { ApplicationE2eHelper } from './application-e2e-helpers';
import { e2e, E2ESetup } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';


describe('Application View', function () {
  // // var testConfig;
  // const testTime = (new Date()).toISOString();
  // const testAppName = ApplicationE2eHelper.createApplicationName(testTime);
  // const hostName = ApplicationE2eHelper.getHostName(testAppName);
  // const newHostName = hostName + '_new';
  // let domain;
  // const e2eSetup: E2ESetup = e2e.setup(ConsoleUserType.admin);

  // beforeAll(() => {
  //   e2eSetup
  //     .clearAllEndpoints()
  //     .registerDefaultCloudFoundry()
  //     .connectAllEndpoints(ConsoleUserType.admin)
  //     .connectAllEndpoints(ConsoleUserType.user);



  //   e2e.setup(ConsoleUserType.admin).registerDefaultCloudFoundry


  //   // Setup the test environment.
  //   // Reset all cnsi that exist in params
  //   return appSetupHelper.appSetup().then(function () {
  //     // testConfig = setup;

  //     // Create a test app for all of these test to use
  //     const until = protractor.ExpectedConditions;
  //     galleryWall.showApplications();
  //     browser.wait(until.presenceOf(galleryWall.getAddApplicationButton()), 15000);
  //     galleryWall.addApplication();
  //     browser.wait(until.presenceOf(addAppWizard.getWizard().getNext()), 5000);
  //     addAppCfApp.name().addText(testAppName);
  //     addAppCfApp.host().clear();
  //     addAppCfApp.host().addText(hostName);
  //     return addAppCfApp.domain().getValue().then(function (d) {
  //       domain = d;
  //       addAppWizard.getWizard().next();
  //       return browser.wait(until.not(until.presenceOf(addAppWizard.getElement())), 10000);
  //     });
  //   });
  // });

  // afterAll(function () {
  //   return appSetupHelper.deleteAppByName(testAppName);
  // });

  // it('Should Walk through the tabs', function () {
  //   const names = ['Summary', 'Log Stream', 'Service Instances', 'Variables', 'Events', 'SSH', 'Service Catalog'];
  //   const cfFromConfig = cfHelpers.getCfs() ? cfHelpers.getCfs().cf1 : undefined;
  //   if (cfFromConfig && cfFromConfig.supportsVersions) {
  //     names.push('Versions');
  //   }
  //   browser.debugger();
  //   // Walk through each of the tabs
  //   application.getTabs().then(function (tabs) {
  //     _.each(tabs, function (tab, i) {
  //       tab.click();
  //       expect(application.getActiveTab().getText()).toBe(names[i]);
  //     });
  //   });
  // });

  // describe('Summary Tab', function () {
  //   beforeAll(function () {
  //     // Summary tab
  //     application.showSummary();
  //   });

  //   it('Should go to summary tab', function () {
  //     expect(application.getHeaderAppName().isDisplayed()).toBe(true);
  //     expect(application.getHeaderAppName().getText()).toBe(testAppName);
  //     expect(application.getActiveTab().getText()).toBe('Summary');
  //   });

  //   describe('Route Management', function () {

  //     it('Should list current route', function () {
  //       const route = hostName + '.' + domain;
  //       // Application should only have a single route
  //       const routes = table.wrap(element(by.css('.summary-routes table')));
  //       routes.getData(routes).then(function (rows) {
  //         expect(rows.length).toBe(1);
  //         expect(rows[0][0]).toBe(route);
  //       });
  //     });

  //     it('should be able to add a route', function () {
  //       const until = protractor.ExpectedConditions;
  //       const route = hostName + '.' + domain;
  //       const newRoute = newHostName + '.' + domain;
  //       application.addRoute();

  //       expect(addRouteDialog.getTitle()).toBe('Add a Route');
  //       expect(addRouteDialog.isDisplayed()).toBe(true);
  //       addRouteDialog.cancel();
  //       browser.wait(until.not(until.presenceOf(addRouteDialog.getElement())), 5000);
  //       application.addRoute();
  //       expect(addRouteDialog.isDisplayed()).toBe(true);
  //       expect(addRouteDialog.getTitle()).toBe('Add a Route');
  //       addRouteDialog.host().clear();
  //       addRouteDialog.host().addText(newHostName);
  //       addRouteDialog.commit();
  //       browser.wait(until.not(until.presenceOf(addRouteDialog.getElement())), 5000);

  //       // Should have two routes now
  //       const routes = table.wrap(element(by.css('.summary-routes table')));
  //       routes.getData(routes).then(function (rows) {
  //         expect(rows.length).toBe(2);
  //         expect(rows[0][0]).toBe(route);
  //         expect(rows[1][0]).toBe(newRoute);
  //       });
  //     });

  //     it('should be able to delete a route', function () {
  //       // This assumes that the previous test has run and created a route
  //       const routes = table.wrap(element(by.css('.summary-routes table')));
  //       routes.getData(routes).then(function (rows) {
  //         expect(rows.length).toBe(2);
  //         const columnMenu = actionMenu.wrap(routes.getItem(0, 1));
  //         helpers.scrollIntoView(columnMenu);
  //         columnMenu.click();
  //         // Delete
  //         columnMenu.clickItem(1);

  //         expect(confirmModal.getTitle()).toBe('Delete Route');
  //         expect(confirmModal.getBody()).toBe('Are you sure you want to delete \'' + hostName + '.' + domain + '\'?');
  //         confirmModal.commit();

  //         routes.getData(routes).then(function (newRows) {
  //           expect(newRows.length).toBe(1);
  //           expect(newRows[0][0]).toBe(newHostName + '.' + domain);
  //         });
  //       });
  //     });

  //     describe('Application route should show up on CF Endpoints view', function () {

  //       let appRouteName, appViewUrl;

  //       beforeAll(function () {
  //         // NOTE - Requires route with name <newHostName> create from test above
  //         appRouteName = newHostName + '.' + domain;

  //         browser.getCurrentUrl().then(function (url) {
  //           appViewUrl = url;
  //         });
  //         helpers.loadApp(true);
  //         navbar.goToView('endpoint.clusters');

  //         const cfFromConfig = cfHelpers.getCfs() ? cfHelpers.getCfs().cf1 : {};
  //         orgsAndSpaces.goToOrg(cfFromConfig.testOrgName || 'e2e');
  //         orgsAndSpaces.goToSpace(cfFromConfig.testSpaceName || 'e2e');
  //         // Go to Routes tab
  //         application.getTabs().get(2).click();
  //       });

  //       // After all tests have run, return to the app view page
  //       afterAll(function () {
  //         return browser.get(appViewUrl);
  //       });

  //       it('routes table should include our app route', function () {
  //         // Note: Even though its routes, the class is services
  //         const routes = table.wrap(element(by.css('.space-services-table table')));
  //         routes.getRows().then(function (rows) {
  //           expect(rows.length).toBeGreaterThan(0);
  //         });
  //         // Table should contain our route
  //         routes.getData().then(function (rows) {
  //           const index = _.findIndex(rows, function (row) {
  //             return row[0] === appRouteName;
  //           });
  //           expect(index).not.toBeLessThan(0);
  //         });
  //       });

  //       it('should allow the route to be un-mapped and then deleted', function () {
  //         const routes = table.wrap(element(by.css('.space-services-table table')));
  //         routes.waitForElement();

  //         // Click the "Show More" button in case there are many routes
  //         const showMoreButtonLink = element(by.css('.space-services-table tfoot > tr > td > a'));
  //         showMoreButtonLink.isDisplayed().then(function (visible) {
  //           if (visible) {
  //             showMoreButtonLink.click();
  //           }
  //         });

  //         routes.getData().then(function (rows) {
  //           const index = _.findIndex(rows, function (row) {
  //             return row[0] === appRouteName;
  //           });

  //           // Confirm route exists in table
  //           expect(index).not.toBeLessThan(0);
  //           expect(rows[index]).toBeDefined();

  //           // Confirm route is attached to an application
  //           const appRouteAttachedTo = rows[index][1];
  //           expect(appRouteAttachedTo).toBeDefined();
  //           expect(appRouteAttachedTo.length).toBeGreaterThan(0);
  //           expect(appRouteAttachedTo).toContain(testAppName);

  //           const columnMenu = actionMenu.wrap(routes.getItem(index, 2));
  //           columnMenu.waitForElement();
  //           helpers.scrollIntoView(columnMenu);

  //           // Unmap Route
  //           columnMenu.click();

  //           columnMenu.clickItem(1);
  //           confirmModal.waitForModal();
  //           expect(confirmModal.getTitle()).toBe('Unmap Route from Application');
  //           confirmModal.commit();
  //           confirmModal.waitUntilNotPresent();

  //           // Delete Route
  //           columnMenu.click();
  //           columnMenu.clickItem(0);
  //           confirmModal.waitForModal();
  //           expect(confirmModal.getTitle()).toBe('Delete Route');
  //           confirmModal.commit();
  //           confirmModal.waitUntilNotPresent();

  //           if (rows.length === 1) {
  //             expect(element(by.css('.space-services-table .panel-body')).getText()).toBe('You have no routes');
  //           } else {
  //             routes.getData().then(function (newRows) {
  //               expect(newRows.length).toBe(rows.length - 1);
  //             });
  //           }
  //         });
  //       });
  //     });
  //   });

  //   describe('Edit Application', function () {

  //     const modalTitle = 'Edit App';

  //     function getMemoryUtilisation() {
  //       return element(by.id('app-memory-value')).getText()
  //         .then(function (text) {
  //           let number = text.substring(0, text.indexOf(' '));
  //           if (text.indexOf('GB') >= 0 || text.indexOf('MB') >= 0) {
  //             if (text.indexOf('GB') >= 0) {
  //               const iNumber = parseInt(number, 10) * 1024;
  //               number = iNumber.toString();
  //             }
  //           } else {
  //             fail('Unhandled mem usage size');
  //           }
  //           return number;
  //         });
  //     }

  //     function getInstances() {
  //       return element(by.css('.app-instance-title + dd percent-gauge')).getAttribute('value-text')
  //         .then(function (text) {
  //           return text.substring(text.indexOf('/') + 2, text.length);
  //         });
  //     }

  //     it('should open + close + open with initial values', function () {
  //       const until = protractor.ExpectedConditions;

  //       // Initial Values - Name
  //       const originalAppName = application.getHeaderAppName().getText();
  //       expect(originalAppName).toBe(testAppName);

  //       // Initial Values - Memory Utilisation
  //       const originalMemUsage = getMemoryUtilisation();

  //       // Initial Values - Instances
  //       const originalInstances = getInstances();

  //       // Open the modal
  //       application.editApplication();
  //       browser.wait(until.presenceOf(editApplicationModal.getElement()), 5000);
  //       expect(editApplicationModal.getTitle()).toBe(modalTitle);

  //       // Close
  //       editApplicationModal.cancel();
  //       browser.wait(until.not(until.presenceOf(editApplicationModal.getElement())), 5000);

  //       // Open and check values
  //       application.editApplication();
  //       browser.wait(until.presenceOf(editApplicationModal.getElement()), 5000);
  //       expect(editApplicationModal.getTitle()).toBe(modalTitle);

  //       expect(editApplicationModal.name().getValue()).toBe(originalAppName);
  //       expect(editApplicationModal.memoryUsage().getValue()).toBe(originalMemUsage);
  //       expect(editApplicationModal.instances().getValue()).toBe(originalInstances);
  //     });

  //     it('should edit values and save changes', function () {
  //       // Note - depends on open modal from previous test
  //       expect(editApplicationModal.isDisplayed()).toBe(true);

  //       const until = protractor.ExpectedConditions;

  //       // App name
  //       editApplicationModal.name().clear();
  //       // Ensure we update the core app name, this will allow app to be deleted at end of test
  //       testAppName += '-edited';
  //       const newName = editApplicationModal.name().addText(testAppName).then(function () {
  //         return testAppName;
  //       });

  //       // Mem Usage
  //       const newMem = editApplicationModal.memoryUsage().getValue().then(function (text) {
  //         let newValue = parseInt(text, 10) * 2;
  //         newValue = newValue.toString();
  //         editApplicationModal.memoryUsage().clear();
  //         editApplicationModal.memoryUsage().addText(newValue);
  //         return newValue;
  //       });

  //       // Instances
  //       const newInstance = editApplicationModal.instances().getValue().then(function (text) {
  //         let newValue = parseInt(text, 10) + 1;
  //         newValue = newValue.toString();
  //         editApplicationModal.instances().clear();
  //         editApplicationModal.instances().addText(newValue);
  //         return newValue;
  //       });

  //       // Input values should be correct
  //       expect(editApplicationModal.name().getValue()).toBe(newName);
  //       expect(editApplicationModal.memoryUsage().getValue()).toBe(newMem);
  //       expect(editApplicationModal.instances().getValue()).toBe(newInstance);

  //       // Save
  //       editApplicationModal.save();
  //       browser.wait(until.not(until.presenceOf(editApplicationModal.getElement())), 5000);

  //       const newMemAllInstances = protractor.promise.all([
  //         newMem,
  //         newInstance
  //       ]).then(function (res) {
  //         const newMem = parseInt(res[0], 10) * parseInt(res[1], 10);
  //         return newMem.toString();
  //       });

  //       // App values should be correct
  //       expect(application.getHeaderAppName().getText()).toBe(newName);
  //       expect(getMemoryUtilisation()).toBe(newMemAllInstances);
  //       expect(getInstances()).toBe(newInstance);
  //     });

  //   });

  // });
});
