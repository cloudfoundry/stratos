import { Page } from '../po/page.po';
import { CreateServiceInstanceStepper } from './create-service-instance-stepper.po';


export class CreateMarketplaceServiceInstance extends Page {

  public stepper: CreateServiceInstanceStepper;

  constructor(url = '/services/new/service?base-previous-redirect=%2Fservices%2Fnew') {
    super(url);
    this.stepper = new CreateServiceInstanceStepper();
  }

}
