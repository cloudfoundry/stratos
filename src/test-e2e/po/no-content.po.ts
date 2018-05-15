import { protractor, ElementFinder } from 'protractor/built';
import { browser, element, by, promise } from 'protractor';
import { Component } from './component.po';


/**
 * Page Object for app-no-content component
 */
export class NoContentComponent extends Component {

  constructor() {
    super(element(by.css('.app-no-content-container')));
  }

  checkFirstLineMessage(msg: string): promise.Promise<boolean> {
    const textEl = this.getComponent().element(by.css('.first-line'));
    return textEl.getText().then((text) => {
      return text.trim().indexOf(msg) === 0;
    });
  }

  checkSecondLineMessage(msg: string): promise.Promise<boolean> {
    const textEl = this.getComponent().element(by.css('.second-line'));
    return textEl.getText().then((text) => {
      return text.trim().indexOf(msg) === 0;
    });
  }

}
