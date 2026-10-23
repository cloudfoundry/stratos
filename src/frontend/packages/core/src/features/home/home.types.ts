import { Observable } from 'rxjs';

import { HomeCardShortcut } from '../../../../store/src/entity-catalog/entity-catalog.types';
import { UserFavorite } from './../../../../store/src/types/user-favorites.types';

// Layout for a home page card

// Defined in terms of how many cards we are trying to fit vertically and horizontally
export class HomePageCardLayout {

  public id: number;

  constructor(public x: number, public y: number, public title?: string) {
    this.id = x + y * 1000;
  }
}

// A card component declares `endpoint` (EndpointModel) and `layout`
// (HomePageCardLayout) inputs. The host sets them with
// ComponentRef.setInput, so a card may use signal or decorator inputs;
// load() is the only member the host calls on the instance.
export abstract class HomePageEndpointCard {
  public load!: () => Observable<boolean>;
}

export interface LinkMetadata {
  favs: UserFavorite[];
  shortcuts: HomeCardShortcut[];
}
