import { Page } from '../po/page.po';
import { CreateServiceInstanceStepper } from './create-service-instance-stepper.po';

export class CreateServiceInstance extends Page {

  stepper = new CreateServiceInstanceStepper();

  constructor(url = '/services/new') {
    super(url);
  }

}
