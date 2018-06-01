import { Component } from './component.po';
import { ElementFinder, by, promise } from 'protractor';

export class MetaCard extends Component {

  constructor(private elementFinder: ElementFinder) {
    super(elementFinder);
  }

  getTitle(): promise.Promise<string> {
    return this.elementFinder.getWebElement().findElement(by.css('meta-card__title')).getText();
  }
}
