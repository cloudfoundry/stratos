import { element, by, ElementFinder } from 'protractor';
import { BASE_CSS_SELECTOR } from './favorite-test-helpers';
export class FavoritesGlobalListEntityListMock {
  static readonly SELECTOR = `${BASE_CSS_SELECTOR}__entities`;

  private element: ElementFinder;

  constructor(selector: string) {
    this.element = element(by.css(selector));
  }

}
