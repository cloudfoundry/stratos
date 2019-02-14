import { ElementFinder } from 'protractor';
import { Component } from '../component.po';

export class FavoritesStarMock extends Component {
  static readonly BASE_CLASS_SELECTOR = '.favorite-star';
  constructor(private finder: ElementFinder) {
    super(finder);
  }

  public async isFavorite() {
    const favoriteIcon = this.finder;
    const icon = await favoriteIcon.getText();
    console.log(icon)
    return icon === 'star';
  }

  public async set() {
    const isFavorite = await this.isFavorite();
    if (!isFavorite) {
      this.getComponent().click();
    }
  }

  public async unSet() {
    const isFavorite = await this.isFavorite();
    if (isFavorite) {
      this.getComponent().click();
    }
  }
}
