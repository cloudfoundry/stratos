import { Page } from '../po/page.po';
import { CreateServiceInstanceStepper } from './create-service-instance-stepper.po';


export class CreateUserProvidedServiceInstance extends Page {

  public stepper: CreateServiceInstanceStepper;

  constructor(url = '/services/new/user-service?base-previous-redirect=%2Fservices%2Fnew') {
    super(url);
    this.stepper = new CreateServiceInstanceStepper();
  }

  isActivePage() {
    return super.isActivePage(true);
  }

  waitForPage() {
    return super.waitForPage(undefined, true);
  }

}
