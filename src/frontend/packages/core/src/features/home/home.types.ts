import { Observable } from 'rxjs';

import { HomeCardShortcut } from '../../../../store/src/entity-catalog/entity-catalog.types';
import { EndpointModel } from '../../../../store/src/public-api';
import { IHydrationResults } from '../../../../store/src/types/user-favorite-manager.types';

// Layout for a home page card

// Defined in terms of how many cards we are trying to fit vertically and horizontally
export class HomePageCardLayout {

  public id: number;

  constructor(public x: number, public y: number, public title?: string) {
    this.id = x + y * 1000;
  }
}

export abstract class HomePageEndpointCard {
  public layout: HomePageCardLayout;
  public endpoint: EndpointModel;
  public load: () => Observable<boolean>;
}

export interface LinkMetadata {
  favs: IHydrationResults[],
  shortcuts: HomeCardShortcut[]
}

