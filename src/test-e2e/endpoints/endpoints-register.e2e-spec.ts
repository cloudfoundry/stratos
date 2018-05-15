import { ApplicationsPage } from '../applications/applications.po';
import { CloudFoundryPage } from '../cloud-foundry/cloud-foundry.po';
import { E2EHelpers } from '../helpers/e2e-helpers';
import { ResetsHelpers } from '../helpers/reset-helpers';
import { SecretsHelpers } from '../helpers/secrets-helpers';
import { SideNavMenuItem } from '../po/side-nav.po';
import { ServicesPage } from '../services/services.po';
import { EndpointMetadata, EndpointsPage, resetToLoggedIn } from './endpoints.po';
import { RegisterDialog } from './register-dialog.po';

describe('Endpoints', () => {
  const helpers = new E2EHelpers();
  const secrets = new SecretsHelpers();
  const resets = new ResetsHelpers();
  const endpointsPage = new EndpointsPage();
  const applications = new ApplicationsPage();
  const services = new ServicesPage();
  const cloudFoundry = new CloudFoundryPage();
  const register = new RegisterDialog();

  describe('Register Endpoints -', () => {

    beforeAll(() => {
      resetToLoggedIn(resets.removeAllEndpoints, true);
    });

    beforeEach(() => {
      endpointsPage.sideNav.goto(SideNavMenuItem.Endpoints);
      endpointsPage.register();
      expect(register.isRegisterDialog()).toBeTruthy();
      expect(register.stepper.canCancel()).toBeTruthy();
    });

    it('should show add form detail view when btn in tile is pressed', () => {
      expect(register.stepper.canNext()).toBeFalsy();
      expect(register.stepper.canCancel()).toBeTruthy();
      expect(register.stepper.canPrevious()).toBeFalsy();
    });

    describe('Form -', () => {

      const validEndpoint = secrets.getDefaultCFEndpoint();

      describe('Invalid address -', () => {

        const invalidUrl = 'Invalid API URL';

        beforeEach(() => {
          // Enter a name so the form will become valid on valid address
          register.name.set('abc');
          expect(register.stepper.canNext()).toBeFalsy();
        });

        it('Incorrect format', () => {
          register.address.set(invalidUrl);
          // Move focus so that we get the validation of the address field
          register.name.focus();

          // Check address is invalid
          expect(register.stepper.canNext()).toBeFalsy();
          expect(register.address.isInvalid()).toBeTruthy();
          expect(register.address.getError()).toEqual(invalidUrl);
        });

        it('Valid format', () => {
          register.address.set(validEndpoint.url);
          // Move focus so that we get the validation of the address field
          register.name.focus();

          expect(register.stepper.canNext()).toBeTruthy();
          expect(register.address.isInvalid()).toBeFalsy();
        });

        it('Invalid to valid to invalid', () => {
          // Invalid
          register.address.set(invalidUrl);
          // Move focus so that we get the validation of the address field
          register.name.focus();
          expect(register.stepper.canNext()).toBeFalsy();
          expect(register.address.isInvalid()).toBeTruthy();
          expect(register.address.getError()).toEqual(invalidUrl);

          // Valid
          register.address.clear();
          register.address.set(validEndpoint.url);
          // Move focus so that we get the validation of the address field
          register.name.focus();

          expect(register.stepper.canNext()).toBeTruthy();
          expect(register.address.isInvalid()).toBeFalsy();

          // Invalid
          register.address.set(invalidUrl);
          // Move focus so that we get the validation of the address field
          register.name.focus();
          expect(register.stepper.canNext()).toBeFalsy();
          expect(register.address.isInvalid()).toBeTruthy();
          expect(register.address.getError()).toEqual(invalidUrl);

        });
      });

      describe('Invalid name -', () => {

        beforeEach(() => {
          // Enter a url so the form will become valid on valid Name
          register.address.set(validEndpoint.url);
          expect(register.stepper.canNext()).toBeFalsy();
        });

        it('Valid', () => {
          register.name.set(validEndpoint.name);
          expect(register.stepper.canNext()).toBeTruthy();
          expect(register.name.isInvalid()).toBeFalsy();
        });

        it('Invalid', () => {
          register.name.clear();
          register.address.focus();
          expect(register.stepper.canNext()).toBeFalsy();
          expect(register.name.isInvalid()).toBeTruthy();
          expect(register.name.getError()).toEqual('Name is required');
        });

        it('Valid to invalid to valid', () => {
          register.name.set(validEndpoint.name);
          expect(register.stepper.canNext()).toBeTruthy();
          expect(register.name.isInvalid()).toBeFalsy();

          register.name.clear();
          expect(register.stepper.canNext()).toBeFalsy();
          expect(register.name.isInvalid()).toBeFalsy();

          register.name.set(validEndpoint.name);
          expect(register.stepper.canNext()).toBeTruthy();
          expect(register.name.isInvalid()).toBeFalsy();
        });
      });

      it('Should hint at SSL errors', () => {
        register.form.fill({
          name: validEndpoint.name,
          url: validEndpoint.url,
          skipsll: false
        });
        register.stepper.next();

        // NOTE: The dialog should stay and show an error
        // Fix this test once this is implemented
        fail('not complete');
      });

      it('Successful register', () => {
        register.form.fill({
          name: validEndpoint.name,
          url: validEndpoint.url,
          skipsll: true
        });
        register.stepper.next();

        expect(endpointsPage.isActivePage()).toBeTruthy();
        expect(endpointsPage.table.isPresent()).toBeTruthy();

        endpointsPage.table.getEndpointDataForEndpoint(validEndpoint.name).then((data: EndpointMetadata) => {
          expect(data.name).toEqual(validEndpoint.name);
          expect(data.url).toEqual(validEndpoint.url);
          expect(data.connected).toBeFalsy();
        });
      });
    });
  });
});
