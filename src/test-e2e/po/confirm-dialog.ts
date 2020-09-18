import { browser, by, element, ElementFinder, promise, protractor } from 'protractor';

import { e2e } from './../e2e';
import { Component } from './component.po';
import { FormComponent } from './form.po';

const until = protractor.ExpectedConditions;

export class DialogButton {
  index: number;
  label: string;
  class: string;
  click: Function;
  isWarning: boolean;
  isEnabled: boolean;
}

/**
 * Page Object for confirmation dialog component
 */
export class ConfirmDialogComponent extends Component {

  // Helper to wait for a dialog to be shown, check button, title then click confirm button and wait for dialog to close
  public static expectDialogAndConfirm(confirmButtonLabel, title = null, enterNameText: string = null) {
    const dialog = new ConfirmDialogComponent();
    dialog.waitUntilShown();
    dialog.getButtons().then(btns => {
      const confirmButton = btns[1];
      expect(confirmButton.label).toBe(confirmButtonLabel);
    });
    if (title) {
      expect(dialog.getTitle()).toBe(title);
    }

    if (enterNameText) {
      expect(dialog.confirmEnabled()).toBeFalsy();
      dialog.enterConfirmText('JUNK132434325365$');
      expect(dialog.confirmEnabled()).toBeFalsy();
      dialog.enterConfirmText(enterNameText);
      expect(dialog.confirmEnabled()).toBeTruthy();
    }

    dialog.confirm();
    // Wait until not shown
    return dialog.waitUntilNotShown();
  }

  constructor(locator = element(by.css('app-dialog-confirm'))) {
    super(locator);
  }

  // Cancel
  cancel(): promise.Promise<void> {
    return this.getButtons().then(btns => btns[0].click()).then(() => e2e.sleep(50));
  }

  // Confirm
  confirm(): promise.Promise<void> {
    return this.getButtons().then(btns => btns[1].click()).then(() => e2e.sleep(50));
  }

  confirmEnabled(): promise.Promise<boolean> {
    return this.getButtons().then(btns => btns[1].isEnabled);
  }

  enterConfirmText(text: string): promise.Promise<void> {
    const form = new FormComponent(this.locator);
    return form.fill({ typetoconfirm: text });
  }

  getTitle(): promise.Promise<string> {
    return this.locator.element(by.className('confirm-dialog__header-title')).getText();
  }

  getMessageElement(): ElementFinder {
    return this.locator.element(by.className('confirm-dialog__message'));
  }

  getMessage(): promise.Promise<string> {
    return this.getMessageElement().getText();
  }

  waitForMessage(message: string): promise.Promise<any> {
    return browser.wait(until.textToBePresentInElement(this.getMessageElement(), message), 5000);
  }

  // Get metadata for all of the fields in the form
  getButtons(): promise.Promise<DialogButton[]> {
    return this.locator.all(by.tagName('button')).map((elm, index) => {
      return {
        index,
        label: elm.getText(),
        class: elm.getAttribute('class'),
        isWarning: elm.getAttribute('class').then(v => v.indexOf('mat-warn') >= 0),
        click: elm.click,
        isEnabled: elm.isEnabled()
      };
    });
  }

}
