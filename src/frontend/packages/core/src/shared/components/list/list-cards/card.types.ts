import { CardComponent, listCards } from './card/card.component';
import { CardsComponent } from './cards.component';

export const listCardComponents = [
  CardsComponent,
  CardComponent,
  ...listCards
];
