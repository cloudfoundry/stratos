import { FavoritesStarMock } from '../po/favorites/favorite-star.po';

import { browser, by, element, promise } from 'protractor';
import { ElementFinder } from 'protractor/built';

import { ConsoleUserType, E2EHelpers } from '../helpers/e2e-helpers';
import { ListComponent, ListTableComponent } from '../po/list.po';
import { Page } from '../po/page.po';
import { SnackBarComponent } from '../po/snackbar.po';

export class EndpointsTable extends ListTableComponent {

  constructor(locator: ElementFinder) {
    super(locator);
  }

  async getEndpointData(row: ElementFinder) {
    const allRows = row.all(by.tagName('app-table-cell') as ElementFinder);
    const star = await allRows.get(6).getWebElement();
    const favorite = new FavoritesStarMock(
      element(star)
    );
    const data = {
      name: await allRows.get(0).getText(),
      connected: await allRows.get(1).getText() === 'cloud_done',
      type: await allRows.get(2).getText(),
      user: await allRows.get(3).getText(),
      isAdmin: (await allRows.get(4).getText()).indexOf('Yes') !== -1,
      url: await allRows.get(5).getText(),
      favorite
    } as EndpointMetadata;
    return data;
  }


  async getAllData() {
    const rows = await this.getRows() as ElementFinder[];
    const endpointRows = await promise.all(rows.map(row => this.getEndpointData(row)));

    return endpointRows;
  }

  async getRowForEndpoint(name: string) {
    const data = await this.getAllData();
    const index = data.findIndex(ep => ep.name === name);
    return this.getRows().get(index);
  }

  async getEndpointDataForEndpoint(name: string) {
    const allData = await this.getAllData();
    return allData.find((d: EndpointMetadata) => d.name === name);
  }

  async setEndpointAsFavorite(name: string) {
    const data = await this.getEndpointDataForEndpoint(name);
    await data.favorite.set();
  }

  openActionMenu(row: ElementFinder) {
    row.element(by.css('app-table-cell-actions button')).click();
  }

}
export function resetToLoggedIn(stateSetter, isAdmin) {
  return browser.driver.wait(stateSetter())
    .then(() => {
      const helpers = new E2EHelpers();
      return helpers.setupApp(isAdmin ? ConsoleUserType.admin : ConsoleUserType.user);
    });
}

const NONE_CONNECTED_MSG = 'There are no connected endpoints, connect with your personal credentials to get started.';

export class EndpointsPage extends Page {
  helpers = new E2EHelpers();

  public list = new ListComponent();

  // Endpoints table (as opposed to generic list.table)
  public table = new EndpointsTable(this.list.getComponent());

  constructor() {
    super('/endpoints');
  }

  register() {
    return this.header.getIconButton('add').then(elm => elm.click());
  }

  isNonAdminNoEndpointsPage() {
    return browser.getCurrentUrl().then(url => {
      return url === browser.baseUrl + '/noendpoints';
    });
  }

  isWelcomeMessageAdmin() {
    return this.isWelcomeMessageNonAdmin().then(okay => {
      return okay ? this.isWelcomePromptAdmin() : false;
    });
  }

  isWelcomePromptAdmin() {
    return this.checkWelcomePromptText('Use the Endpoints view to register');
  }

  isWelcomeMessageNonAdmin() {
    return this.checkWelcomeMessageText('There are no registered endpoints');
  }

  isNoneConnectedSnackBar(snackBar: SnackBarComponent) {
    return snackBar.hasMessage(NONE_CONNECTED_MSG);
  }

  private checkWelcomeMessageText(msg: string) {
    return this.checkWelcomeText('.first-line', msg);
  }

  private checkWelcomePromptText(msg: string) {
    return this.checkWelcomeText('.second-line', msg);
  }

  private checkWelcomeText(css: string, msg: string) {
    const textEl = this.getWelcomeMessage().element(by.css(css));
    return textEl.getText().then((text) => {
      return text.trim().indexOf(msg) === 0;
    });
  }

  private getWelcomeMessage(): ElementFinder {
    return element(by.css('.app-no-content-container'));
  }

}

export interface EndpointMetadata {
  name: string;
  url: string;
  type: string;
  user: string;
  isAdmin: boolean;
  connected: boolean;
  favorite: FavoritesStarMock;
}

