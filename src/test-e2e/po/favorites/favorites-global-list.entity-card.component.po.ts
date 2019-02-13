import { element, by, ElementFinder } from 'protractor';
import { BASE_CSS_SELECTOR } from './favorite-test-helpers';
const FAVORITE_ENDPOINT_ENTITIES = `${BASE_CSS_SELECTOR}__fav-meta-card`;
export class FavoritesGlobalListEntityCardMock {
  static readonly SELECTOR = `${BASE_CSS_SELECTOR}__fav-meta-card`;
  readonly element: ElementFinder;
  constructor(selector: string) {
    this.element = element(by.css(selector));
  }
}
