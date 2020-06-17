import { Page } from '../po/page.po';
import { CreateServiceInstanceStepper } from './create-service-instance-stepper.po';


export class CreateMarketplaceServiceInstance extends Page {

  public stepper: CreateServiceInstanceStepper;

  constructor(url = '/services/new/service') {
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
