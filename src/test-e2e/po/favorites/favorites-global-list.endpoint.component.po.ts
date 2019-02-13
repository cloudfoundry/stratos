
import { by, ElementFinder } from 'protractor';
import { BASE_CSS_SELECTOR } from './favorite-test-helpers';
import { MetaCard, MetaCardTitleType } from '../meta-card.po';

export class FavoritesGlobalListEndpointMock extends MetaCard {
  static readonly SELECTOR = `${BASE_CSS_SELECTOR}__endpoint-card`;
  constructor(groupElementFinder: ElementFinder) {
    groupElementFinder.getText().then(console.log);
    const endpointCard = groupElementFinder.element(by.css(FavoritesGlobalListEndpointMock.SELECTOR));
    super(endpointCard, MetaCardTitleType.CUSTOM);
  }
}
