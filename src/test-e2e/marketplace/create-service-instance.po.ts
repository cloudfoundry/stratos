import { protractor, ElementArrayFinder, ElementFinder } from 'protractor';
import { browser, promise } from 'protractor';
import { Page } from '../po/page.po';
import { ListComponent } from '../po/list.po';
import { CreateServiceInstanceStepper } from './create-service-instance-stepper.po';

export class CreateServiceInstance extends Page {

  stepper = new CreateServiceInstanceStepper();

  constructor(url = '/services/new') {
    super(url);
  }

}
