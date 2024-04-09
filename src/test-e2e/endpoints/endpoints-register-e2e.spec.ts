import { by, element } from 'protractor';

import { e2e, E2ESetup } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { ResetsHelpers } from '../helpers/reset-helpers';
import { SideNavMenuItem } from '../po/side-nav.po';
import { SnackBarPo } from '../po/snackbar.po';
import { TileSelector } from '../po/tile-selector.po';
import { EndpointMetadata, EndpointsPage } from './endpoints.po';
import { RegisterStepper } from './register-dialog.po';

describe('Endpoints', () => {
  const endpointsPage = new EndpointsPage();
  const tileSelector = new TileSelector();
  const register = new RegisterStepper();

  const validEndpoint = e2e.secrets.getDefaultCFEndpoint();

  // If there is an endpoint named 'selfsignecf' use that for self signed cert test - otherwise use default
  const selfSignedEndpoint = e2e.secrets.getEndpointByName('selfsignedcf') || validEndpoint;

  let e2eSetup: E2ESetup;

  describe('Register Endpoints -', () => {

    function navToRegCf() {
      endpointsPage.sideNav.goto(SideNavMenuItem.Endpoints);
      endpointsPage.register();
      tileSelector.select('Cloud Foundry');
      expect(register.isRegisterDialog()).toBeTruthy();
      expect(register.stepper.canCancel()).toBeTruthy();
    }

    beforeAll(() => {
      e2eSetup = e2e.setup(ConsoleUserType.admin);
      e2eSetup.clearAllEndpoints();
    });

    describe('', () => {
      beforeEach(() => {
        navToRegCf();
      });

      it('should show add form detail view when btn in tile is pressed', () => {
        expect(register.stepper.canNext()).toBeFalsy();
        expect(register.stepper.canCancel()).toBeTruthy();
        expect(register.stepper.canPrevious()).toBeTruthy();
      });

      describe('Form -', () => {

        let name;
        let address;
        beforeEach(() => {
          name = register.getName();
          address = register.getAddress();
        });

        describe('Invalid address -', () => {

          const invalidUrl = 'Invalid API URL';

          beforeEach(() => {
            // Enter a name so the form will become valid on valid address
            name.set('abc');
            expect(register.stepper.canNext()).toBeFalsy();
          });

          it('Incorrect format', () => {
            address.set(invalidUrl);
            // Move focus so that we get the validation of the address field
            name.focus();

            // Check address is invalid
            expect(register.stepper.canNext()).toBeFalsy();
            expect(address.isInvalid()).toBeTruthy();
            expect(address.getError()).toEqual(invalidUrl);
          });

          it('Valid format', () => {
            address.set(validEndpoint.url);
            // Move focus so that we get the validation of the address field
            name.focus();

            expect(register.stepper.canNext()).toBeTruthy();
            expect(address.isInvalid()).toBeFalsy();
          });

          it('Invalid to valid to invalid', () => {
            // Invalid
            address.set(invalidUrl);
            // Move focus so that we get the validation of the address field
            name.focus();
            expect(register.stepper.canNext()).toBeFalsy();
            expect(address.isInvalid()).toBeTruthy();
            expect(address.getError()).toEqual(invalidUrl);

            // Valid
            address.clear();
            address.set(validEndpoint.url);
            // Move focus so that we get the validation of the address field
            name.focus();

            expect(register.stepper.canNext()).toBeTruthy();
            expect(address.isInvalid()).toBeFalsy();

            // Invalid
            address.set(invalidUrl);
            // Move focus so that we get the validation of the address field
            name.focus();
            expect(register.stepper.canNext()).toBeFalsy();
            expect(address.isInvalid()).toBeTruthy();
            expect(address.getError()).toEqual(invalidUrl);

          });
        });

        describe('Invalid name -', () => {

          beforeEach(() => {
            // Enter a url so the form will become valid on valid Name
            address.set(validEndpoint.url);
            expect(register.stepper.canNext()).toBeFalsy();
          });

          it('Valid', () => {
            name.set(validEndpoint.name);
            expect(register.stepper.canNext()).toBeTruthy();
            expect(name.isInvalid()).toBeFalsy();
          });

          it('Invalid', () => {
            name.clear();
            address.focus();
            expect(register.stepper.canNext()).toBeFalsy();
            expect(name.isInvalid()).toBeTruthy();
            expect(name.getError()).toEqual('Name is required');
          });

          it('Valid to invalid to valid', () => {
            name.set(validEndpoint.name);
            expect(register.stepper.canNext()).toBeTruthy();
            expect(name.isInvalid()).toBeFalsy();

            name.clear();
            expect(register.stepper.canNext()).toBeFalsy();
            // input has been touched so 'required' validation kicks in
            expect(name.isInvalid()).toBeTruthy();

            name.set(validEndpoint.name);
            expect(register.stepper.canNext()).toBeTruthy();
            expect(name.isInvalid()).toBeFalsy();
          });
        });

        it('Should hint at SSL errors', () => {
          register.form.fill({
            name: selfSignedEndpoint.name,
            url: selfSignedEndpoint.url,
            skipssl: false
          });
          register.stepper.next();

          const snackBar = new SnackBarPo();
          snackBar.waitUntilShown();

          // Handle the error case for invalid certificate - could be unknown authority or bad certificate
          // so check for correct message at the start and the helpful message for the user to correct the problem
          expect(snackBar.hasMessage('SSL error - x509: certificate')).toBeTruthy();
          expect(snackBar.messageContains('Please check "Skip SSL validation for the endpoint" if the certificate issuer is trusted'))
            .toBeTruthy();
        });

        it('Successful register (no connect)', () => {
          register.form.fill({
            name: validEndpoint.name,
            url: validEndpoint.url,
            skipssl: true
          });

          expect(register.stepper.canNext()).toBeTruthy();
          register.stepper.next();

          register.stepper.waitForStep('Connect (Optional)');
          register.stepper.next();

          expect(endpointsPage.isActivePage()).toBeTruthy();
          expect(endpointsPage.cards.isPresent()).toBeTruthy();

          endpointsPage.cards.getEndpointDataForEndpoint(validEndpoint.name).then((data: EndpointMetadata) => {
            expect(data.name).toEqual(validEndpoint.name);
            expect(data.url).toEqual(validEndpoint.url);
            expect(data.connected).toBeFalsy();
          });
        });
      });
    });


    describe('Successful register (with connect) - ', () => {
      beforeAll(() => {
        navToRegCf();
      });

      it('Register', () => {
        const resetHelper = new ResetsHelpers();
        resetHelper.removeEndpoint(e2eSetup.adminReq, validEndpoint.name);

        endpointsPage.sideNav.goto(SideNavMenuItem.Endpoints);
        endpointsPage.list.header.refresh();

        navToRegCf();

        register.form.fill({
          name: validEndpoint.name,
          url: validEndpoint.url,
          skipssl: true
        });

        expect(register.stepper.canNext()).toBeTruthy();
        register.stepper.next();

      });
      it('Connect', () => {
        register.stepper.waitForStep('Connect (Optional)');
        expect(register.stepper.canPrevious()).toBeFalsy();
        expect(register.stepper.canNext()).toBeTruthy();

        element(by.css('.connect__checkbox')).click();

        const toConnect = e2e.secrets.getDefaultCFEndpoint();
        register.stepper.getStepperForm().fill({
          username: 'junk',
          password: 'junk'
        });

        expect(register.stepper.canNext()).toBeTruthy();
        register.stepper.next();

        const snackBar = new SnackBarPo();
        snackBar.waitForMessage('Could not connect to the endpoint');

        register.stepper.getStepperForm().fill({
          username: toConnect.creds.admin.username,
          password: toConnect.creds.admin.password
        });

        expect(register.stepper.canNext()).toBeTruthy();
        register.stepper.next();
      });
      it('Check result', () => {
        endpointsPage.waitForPage();
        expect(endpointsPage.cards.isPresent()).toBeTruthy();
        endpointsPage.cards.getEndpointDataForEndpoint(validEndpoint.name).then((data: EndpointMetadata) => {
          expect(data.name).toEqual(validEndpoint.name);
          expect(data.url).toEqual(validEndpoint.url);
          expect(data.connected).toBeTruthy();
        });
      });
    });
  });
});
