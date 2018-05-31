import { Component } from './component.po';
import { ElementFinder, by } from 'protractor';
import { promise } from 'selenium-webdriver';

export class MetaCard extends Component {

  constructor(private elementFinder: ElementFinder) {
    super(elementFinder);
  }

  getTitle(): promise.Promise<string> {
    return this.elementFinder.getWebElement().findElement(by.css('meta-card__title')).getText();
  }
}
