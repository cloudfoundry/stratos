import { browser, by, element } from 'protractor';
import { ElementFinder } from 'protractor/built';
import { E2EEndpointConfig } from '../e2e.types';
import { ConsoleUserType, E2EHelpers } from '../helpers/e2e-helpers';
import { ListComponent, ListTableComponent } from '../po/list.po';
import { Page } from '../po/page.po';
import { SnackBarComponent } from '../po/snackbar.po';

export class EndpointsTable extends ListTableComponent {

  constructor(locator: ElementFinder) {
    super(locator);
  }

  getEndpointData(row: ElementFinder) {
    // Get all of the columns
    return row.all(by.tagName('app-table-cell')).map(col => col.getText()).then((data: string[]) => {
      return {
        name: data[0],
        connected: data[1] === 'cloud_done',
        type: data[2],
        user: data[3],
        isAdmin: data[4].indexOf('Yes') !== -1,
        url: data[5]
      } as EndpointMetadata;
    });
  }

  getAllData() {
    return this.getRows().map(row => this.getEndpointData(row));
  }

  getRowForEndpoint(name: string) {
    return this.getAllData().then(data => {
      const index = data.findIndex((ep: E2EEndpointConfig) => ep.name === name);
      return this.getRows().get(index);
    });
  }

  getEndpointDataForEndpoint(name: string) {
    return this.getAllData().then(data => data.find((d: EndpointMetadata) => d.name === name));
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
}

