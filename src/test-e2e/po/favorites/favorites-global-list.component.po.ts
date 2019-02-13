
import { ElementFinder, element, by } from 'protractor';
import { FavoritesGlobalListEndpointMock } from './favorites-global-list.endpoint.component.po';
import { FavoritesGlobalListEntityListMock } from './favorites-global-list.entities-list.component.po';
import { Component } from '../component.po';

export class FavoritesGlobalListMock extends Component {

  public endpointCard: FavoritesGlobalListEndpointMock;
  public entitiesList: FavoritesGlobalListEntityListMock;

  constructor(selector: ElementFinder = element(by.css('app-favorites-global-list'))) {
    super(selector);
    this.endpointCard = new FavoritesGlobalListEndpointMock(selector);
  }
}
