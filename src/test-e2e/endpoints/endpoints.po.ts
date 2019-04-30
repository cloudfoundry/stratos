import { FavoritesStarMock } from '../po/favorites/favorite-star.po';

import { browser, by, element, promise } from 'protractor';
import { ElementFinder } from 'protractor/built';

import { ConsoleUserType, E2EHelpers } from '../helpers/e2e-helpers';
import { ListCardComponent, ListComponent, ListHeaderComponent, ListTableComponent } from '../po/list.po';
import { MetaCard, MetaCardItem } from '../po/meta-card.po';
import { Page } from '../po/page.po';
import { SnackBarPo } from '../po/snackbar.po';

export class EndpointCards extends ListCardComponent {
  constructor(locator: ElementFinder, header: ListHeaderComponent) {
    super(locator, header);
  }

  findCardByTitle(title: string, subtitle = 'Cloud Foundry'): promise.Promise<MetaCard> {
    return super.findCardByTitle(`${title}\n${subtitle}`);
  }

  getEndpointDataForEndpoint(title: string, subtitle = 'Cloud Foundry'): promise.Promise<EndpointMetadata> {
    return this.findCardByTitle(title, subtitle).then(card => this.getEndpointData(card));
  }

  getEndpointData(card: MetaCard): promise.Promise<EndpointMetadata> {
    const title = card.getTitle();
    const metaCardItems = card.getMetaCardItemsAsText();
    return promise.all<string | MetaCardItem<string>[]>([
      title,
      metaCardItems
    ]).then(([t, m]: [string, MetaCardItem<string>[]]) => {
      const details = m.find(item => item.key === 'Details');
      // Protect against zero details
      const safeDetails = details ? details.value : '';
      // If we have details, assume they're cf details
      const cleanDetails = safeDetails.split('\n');
      const user = cleanDetails[1] ? cleanDetails[1].replace(' (Administrator)', '') : '';
      const isAdmin = safeDetails.endsWith(' (Administrator)');
      return {
        name: t.substring(0, t.indexOf('\n')),
        connected: m.find(item => item.key === 'Status').value === 'Connected\ncloud_done',
        type: t.substring(t.indexOf('\n') + 1, t.length),
        user,
        isAdmin,
        url: m.find(item => item.key === 'Address').value,
        // favorite: data[6]
      } as EndpointMetadata;
    });
  }
}

export class EndpointsTable extends ListTableComponent {

  constructor(locator: ElementFinder) {
    super(locator);
  }

<<<<<<< HEAD
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
=======
  getEndpointData(row: ElementFinder): promise.Promise<EndpointMetadata> {
    // Get all of the columns
    return row.all(by.tagName('app-table-cell')).map(col => col.getText()).then((data: string[]) => {
      return {
        name: data[0],
        connected: data[1] === 'cloud_done',
        type: data[2],
        user: data[3],
        isAdmin: data[4].indexOf('Yes') !== -1,
        url: data[5],
        favorite: data[6]
      } as EndpointMetadata;
    });
>>>>>>> v2-master
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
  public cards = new EndpointCards(this.list.locator, this.list.header);

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

  isNoneConnectedSnackBar(snackBar: SnackBarPo) {
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

