import { by, element, ElementFinder } from 'protractor';

import { Page } from '../../po/page.po';
import { RadioGroup } from '../../po/radio-group.po';
import { StepperComponent } from '../../po/stepper.po';
import { FormComponent } from '../../po/form.po';
import { ListComponent } from '../../po/list.po';

export class CreateRoutesPage extends Page {

  stepper: StepperComponent;
  type: RadioGroup;

  private locator: ElementFinder;

  constructor(cfGuid: string, appGuid: string, spaceGuid?: string) {
    super(`/applications/${cfGuid}/${appGuid}/add-route${!!spaceGuid ? `?spaceGuid=${spaceGuid}` : ''}`);
    this.locator = element(by.css('app-add-route-stepper'));
    this.type = new RadioGroup(this.locator);
    this.stepper = new StepperComponent();
  }

  getHttpForm(): FormComponent {
    // I'm guessing if the type is toggled this might need to be recalled after change?
    return new FormComponent(this.locator.element(by.css('app-steppers:last-of-type')));
  }

  getMapExistingList(): ListComponent {
    return new ListComponent(this.locator);
  }

}
