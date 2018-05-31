import { ApplicationsPage } from '../applications/applications.po';
import { CloudFoundryPage } from '../cloud-foundry/cloud-foundry.po';
import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { SideNavMenuItem } from '../po/side-nav.po';
import { ServicesPage } from '../services/services.po';
import { EndpointMetadata, EndpointsPage } from './endpoints.po';
import { RegisterDialog } from './register-dialog.po';

describe('Endpoints', () => {
  const endpointsPage = new EndpointsPage();
  const applications = new ApplicationsPage();
  const services = new ServicesPage();
  const cloudFoundry = new CloudFoundryPage();
  const register = new RegisterDialog();

  const validEndpoint = e2e.secrets.getDefaultCFEndpoint();


  describe('Register Endpoints -', () => {

    beforeAll(() => {
      e2e.setup(ConsoleUserType.admin)
        .clearAllEndpoints();
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

      let name, address;
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
          expect(name.isInvalid()).toBeFalsy();

          name.set(validEndpoint.name);
          expect(register.stepper.canNext()).toBeTruthy();
          expect(name.isInvalid()).toBeFalsy();
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
