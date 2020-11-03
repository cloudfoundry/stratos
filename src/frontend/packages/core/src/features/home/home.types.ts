import { HomeCardShortcut } from '../../../../store/src/entity-catalog/entity-catalog.types';
import { EndpointModel } from '../../../../store/src/public-api';

// Layout for a home page card

// Defined in terms of how many cards we are trying to fit vertically and horizontally
export class HomePageCardLayout {

  public id: number;

  constructor(public x: number, public y: number, public title?: string) {
    this.id = x + y * 1000;
  }

  public static fromLayout(layout: string, title?: string): HomePageCardLayout {
    const parts = layout.split('-');
    const x = parseInt(parts[0], 10);
    let y = 1;
    if (parts.length > 1) {
      y = parseInt(parts[1], 10);
    }

    return new HomePageCardLayout(x, y, title ? title : `${x}-${y} Layout`);
  }
}

export abstract class HomePageEndpointCard {
  public layout: HomePageCardLayout;
  public endpoint: EndpointModel;
}

export interface LinkMetadata {
  favs: any[],
  shortcuts: HomeCardShortcut[]
}

