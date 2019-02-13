import { browser, by, ElementFinder, promise, protractor } from 'protractor';
import { By } from 'selenium-webdriver';

import { Component } from './component.po';
import { MenuComponent } from './menu.po';
import { FavoritesStarMock } from './favorites/favorite-star.po';

const until = protractor.ExpectedConditions;

export enum MetaCardTitleType {
  /**
   * Title is in a normal mat-card-title
   */
  MAT_CARD = 'mat-card-title',
  /**
   * Title text is in a custom div (used to inline title with action menu)
   */
  CUSTOM = '.meta-card__title'
}

export interface MetaCardItem {
  key: promise.Promise<string>;
  value: promise.Promise<string>;
}

export class MetaCard extends Component {

  titleBy: By;

  public star: FavoritesStarMock;

  constructor(private elementFinder: ElementFinder, titleType: MetaCardTitleType) {
    super(elementFinder);
    this.titleBy = by.css(titleType);
    this.star = new FavoritesStarMock(
      this.elementFinder.element(FavoritesStarMock.BASE_CLASS_SELECTOR)
    );
  }

  getTitleElement() {
    return this.elementFinder.element(this.titleBy);
  }

  waitForTitle(title: string): promise.Promise<any> {
    return browser.wait(until.textToBePresentInElement(this.getTitleElement(), title), 5000);
  }

  getTitle(): promise.Promise<string> {
    return this.getTitleElement().getText();
  }

  getContent(): promise.Promise<string> {
    return this.elementFinder.element(by.css('mat-card-content')).getText();
  }

  async openActionMenu(): promise.Promise<MenuComponent> {
    await this.elementFinder.element(by.css('.meta-card__header__button')).click();
    // Wait until menu is shown
    const menu = new MenuComponent();
    menu.waitUntilShown();
    return menu;
  }

  async getMetaCardItems(): promise.Promise<MetaCardItem[]> {
    const metaCardRows = this.elementFinder.all(by.css('.meta-card-item-row'));
    const rows = await metaCardRows as ElementFinder[];
    return rows.map(row => ({
      key: row.element(by.css('.meta-card-item__key')).getText(),
      value: row.element(by.css('.meta-card-item__value')).getText()
    }));
  }

  click() {
    return this.elementFinder.click();
  }

  async isFavoriteStarShown() {
    const favoriteStarElement = this.elementFinder.element('.favorite-star mat-icon');
    return await favoriteStarElement.isDisplayed();
  }

}
