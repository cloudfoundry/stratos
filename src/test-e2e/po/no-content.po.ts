import { protractor, ElementFinder } from 'protractor/built';
import { browser, element, by } from 'protractor';
import { Component } from './component.po';


/**
 * Page Objeect for app-no-content component
 */
export class NoContentComponent extends Component {

  constructor() {
    super(element(by.css('.app-no-content-container')));
  }

  checkFirstLineMessage(msg: string) {
    const textEl = this.getComponent().element(by.css('.first-line'));
    return textEl.getText().then((text) => {
      return text.trim().indexOf(msg) === 0;
    });
  }

  checkSecondLineMessage(msg: string) {
    const textEl = this.getComponent().element(by.css('.second-line'));
    return textEl.getText().then((text) => {
      return text.trim().indexOf(msg) === 0;
    });
  }

}
