import { by, element, promise } from 'protractor';
import { E2EHelpers } from '../helpers/e2e-helpers';
import { Component } from './component.po';

export class TileSelector extends Component {

  private helpers = new E2EHelpers();

  constructor() {
    super(element(by.tagName('app-tile-selector')));
  }

  select(tileText: string): promise.Promise<void> {
    return this.helpers.waitForElementAndClick(element(by.cssContainingText('.tile-selector__content', tileText)));
  }

}
