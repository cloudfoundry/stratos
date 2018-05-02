import { E2EHelpers, ConsoleUserType } from '../helpers/e2e-helpers';
import { browser } from 'protractor';
import { ResetsHelpers } from '../helpers/reset-helpers';
import { EndpointsPage, EndpointMetadata, resetToLoggedIn } from './endpoints.po';
import { ApplicationsPage } from '../applications/applications.po';
import { SideNavMenuItem } from '../po/side-nav.po';
import { CloudFoundryPage } from '../cloud-foundry/cloud-foundry.po';
import { ServicesPage } from '../services/services.po';
import { SnackBarComponent } from '../po/snackbar.po';
import { SecretsHelpers } from '../helpers/secrets-helpers';
import { MenuComponent } from '../po/menu.po';

describe('Endpoints', () => {
  const helpers = new E2EHelpers();
  const secrets = new SecretsHelpers();
  const resets = new ResetsHelpers();
  const endpointsPage = new EndpointsPage();
  const applications = new ApplicationsPage();
  const services = new ServicesPage();
  const cloudFoundry = new CloudFoundryPage();

  describe('Register Endpoints -', () => {
  });

});


  // // The following tests are all carried out as non-admin
  // describe('Dashboard tests -', () => {

  //   describe('Register endpoints -', () => {

  //     function registerTests(type) {
  //       beforeAll(() => {
  //         resetToLoggedIn(resetTo.removeAllCnsi, true)
  //           .then(() => {
  //             return endpointsPage.isEndpoints();
  //           })
  //           .then(function (isEndpoints) {
  //             expect(isEndpoints).toBe(true);

  //             // No endpoints ... no table
  //             expect(endpointsPage.getEndpointTable().isDisplayed()).toBeFalsy();
  //           });
  //       });

  //       beforeEach(() => {
  //         registerEndpoint.safeClose();
  //       });

  //       it('should show add form detail view when btn in welcome is pressed', () => {
  //         endpointsPage.clickAddClusterInWelcomeMessage().then(() => {
  //           expect(registerEndpoint.isVisible().isDisplayed()).toBeTruthy();
  //         });
  //       });

  //       it('should show add form detail view when btn in tile is pressed', () => {
  //         endpointsPage.headerRegister().then(() => {
  //           expect(registerEndpoint.isVisible().isDisplayed()).toBeTruthy();
  //         });
  //       });

  //       describe('Form', () => {
  //         var service = helpers.getRegisteredService();

  //         beforeEach(() => {
  //           endpointsPage.headerRegister()
  //             .then(() => {
  //               expect(registerEndpoint.isVisible().isDisplayed()).toBeTruthy();
  //               expect(registerEndpoint.getStep()).toBe(2);
  //               registerEndpoint.closeEnabled(true);
  //               // registerEndpoint.selectType(type);
  //             });
  //         });

  //         describe('endpoint details step', () => {
  //           it('is endpoint details step', () => {
  //             expect(registerEndpoint.getStep()).toBe(2);
  //             expect(registerEndpoint.getStepTwoType()).toBe(type);
  //           });

  //           if (type === 'cf') {
  //             describe('Invalid address', () => {

  //               var invalidUrl = 'This is an invalid URL';

  //               beforeEach(() => {
  //                 // Enter a name so the form will become valid on valid address
  //                 registerEndpoint.enterName('abc').then(() => {
  //                   return registerEndpoint.registerEnabled(false);
  //                 });
  //               });

  //               it('Incorrect format', () => {
  //                 registerEndpoint.enterAddress(invalidUrl)
  //                   .then(() => {
  //                     return registerEndpoint.isAddressValid(false);
  //                   })
  //                   .then(() => {
  //                     registerEndpoint.registerEnabled(false);
  //                   });
  //               });

  //               it('Valid format', () => {
  //                 registerEndpoint.enterAddress(service.register.api_endpoint)
  //                   .then(() => {
  //                     return registerEndpoint.isAddressValid(true);
  //                   })
  //                   .then(() => {
  //                     registerEndpoint.registerEnabled(true);
  //                   });
  //               });

  //               it('Invalid to valid to invalid', () => {
  //                 registerEndpoint.enterAddress(invalidUrl)
  //                   .then(() => {
  //                     return registerEndpoint.isAddressValid(false);
  //                   })
  //                   .then(() => {
  //                     return registerEndpoint.registerEnabled(false);
  //                   })
  //                   .then(() => {
  //                     return registerEndpoint.clearAddress();
  //                   })
  //                   .then(() => {
  //                     return registerEndpoint.enterAddress(service.register.api_endpoint);
  //                   })
  //                   .then(() => {
  //                     return registerEndpoint.isAddressValid(true);
  //                   })
  //                   .then(() => {
  //                     return registerEndpoint.registerEnabled(true);
  //                   })
  //                   .then(() => {
  //                     return registerEndpoint.clearAddress();
  //                   })
  //                   .then(() => {
  //                     return registerEndpoint.enterAddress(invalidUrl);
  //                   })
  //                   .then(() => {
  //                     return registerEndpoint.isAddressValid(false);
  //                   })
  //                   .then(() => {
  //                     return registerEndpoint.registerEnabled(false);
  //                   });
  //               });
  //             });

  //             describe('Invalid name', () => {

  //               beforeEach(() => {
  //                 // Enter a url so the form will become valid on valid Name
  //                 registerEndpoint.enterAddress(service.register.api_endpoint).then(() => {
  //                   return registerEndpoint.registerEnabled(false);
  //                 });
  //               });

  //               it('Valid', () => {
  //                 registerEndpoint.enterName(service.register.cnsi_name)
  //                   .then(() => {
  //                     registerEndpoint.isNameValid(true);
  //                     registerEndpoint.registerEnabled(true);
  //                   });
  //               });

  //               it('Invalid to valid to invalid', () => {
  //                 registerEndpoint.enterName(service.register.cnsi_name)
  //                   .then(() => {
  //                     registerEndpoint.isNameValid(true);
  //                     registerEndpoint.registerEnabled(true);
  //                   })
  //                   .then(() => {
  //                     return registerEndpoint.clearName();
  //                   })
  //                   .then(() => {
  //                     registerEndpoint.isNameValid(false);
  //                     registerEndpoint.registerEnabled(false);
  //                   })
  //                   .then(() => {
  //                     return registerEndpoint.enterName(service.register.cnsi_name);
  //                   })
  //                   .then(() => {
  //                     registerEndpoint.isNameValid(true);
  //                     registerEndpoint.registerEnabled(true);
  //                   });
  //               });
  //             });
  //           }

  //           it('Should hint at SSL errors', () => {
  //             registerEndpoint.populateAndRegister(service.register.api_endpoint, service.register.cnsi_name, false)
  //               .then(() => {
  //                 return registerEndpoint.checkError(/SSL/);
  //               });
  //           });

  //           it('Successful register', () => {
  //             var endpointIndex;
  //             registerEndpoint.populateAndRegister(service.register.api_endpoint, service.register.cnsi_name,
  //               service.register.skip_ssl_validation)
  //               .then(() => {
  //                 var toastText = new RegExp("Endpoint '" + service.register.cnsi_name + "' successfully registered");
  //                 return helpers.checkAndCloseToast(toastText);
  //               })
  //               .then(() => {

  //                 var endpointsTable = endpointsPage.getEndpointTable();
  //                 var endpointsRows = helpers.getTableRows(endpointsTable);

  //                 return endpointsRows.each(function (element, index) {
  //                   return element.all(by.css('td')).first().getText().then(function (name) {
  //                     if (name.toLowerCase() === service.register.cnsi_name.toLowerCase()) {
  //                       endpointIndex = index;
  //                     }
  //                   });
  //                 });
  //               })
  //               .then(() => {
  //                 expect(endpointIndex).toBeDefined();
  //                 expect(endpointsPage.endpointIsDisconnected(endpointIndex)).toBeTruthy();
  //               });
  //           });
  //         });
  //       });
  //     }

  //     describe('Register cf -', () => {
  //       registerTests('cf');
  //     });

  //   });
