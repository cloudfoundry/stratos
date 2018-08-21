import { browser, by, element, ElementFinder, promise, protractor } from 'protractor';

import { Component } from '../../po/component.po';
import { FormComponent } from '../../po/form.po';

const until = protractor.ExpectedConditions;

export class CardAppInstances extends Component {

  constructor(locator: ElementFinder = element(by.tagName('app-card-app-instances'))) {
    super(locator);
  }

  private getRunningInstances(): ElementFinder {
    return this.locator.element(by.tagName('app-running-instances'));
  }

  getRunningInstancesText(): promise.Promise<string> {
    return this.getRunningInstances().getText();
  }

  waitForRunningInstancesText(status: string): promise.Promise<any> {
    return browser.wait(until.textToBePresentInElement(this.getRunningInstances(), status));
  }

  editCountButton(): ElementFinder {
    return this.locator.element(by.cssContainingText('.card-app-instances__actions button:first-of-type mat-icon', 'edit'));
  }

  editCountCancelButton(): ElementFinder {
    return this.locator.element(by.cssContainingText('.card-app-instances__actions button:first-of-type mat-icon', 'clear'));
  }

  editCountDoneButton(): ElementFinder {
    return this.locator.element(by.cssContainingText('.card-app-instances__actions button:nth-of-type(2) mat-icon', 'done'));
  }

  editInstanceCount(newInstanceCount: number): promise.Promise<void> {
    expect(newInstanceCount).toBeGreaterThanOrEqual(1, 'Confirmation dialog not wired in for instance count of 0');
    return this.editCountButton().click()
      .then(() => {
        const form = new FormComponent(this.locator.element(by.css('form.card-app-instances__form')));
        return form.fill({ instances: newInstanceCount.toString() });
      })
      .then(() => {
        expect(this.editCountDoneButton().isDisplayed()).toBeTruthy();
        return this.editCountDoneButton().click();
      });
  }

  decreaseCountButton(): ElementFinder {
    return this.locator.element(
      by.cssContainingText('.card-app-instances__actions button:nth-of-type(2) mat-icon', 'remove_circle_outline')
    );
  }

  increaseCountButton(): ElementFinder {
    return this.locator.element(by.cssContainingText('.card-app-instances__actions button:nth-of-type(3) mat-icon', 'add_circle_outline'));
  }

}
