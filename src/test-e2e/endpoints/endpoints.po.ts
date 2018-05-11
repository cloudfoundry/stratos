import { protractor, ElementFinder } from 'protractor/built';
import { E2EHelpers, ConsoleUserType } from '../helpers/e2e-helpers';
import { browser, element, by, ElementArrayFinder } from 'protractor';
import { Page } from '../po/page.po';
import { ListComponent, ListTableComponent } from '../po/list.po';
import { E2EEndpointConfig } from '../e2e.types';
import { SnackBarComponent } from '../po/snackbar.po';

export function resetToLoggedIn(stateSetter, isAdmin) {
  return browser.driver.wait(stateSetter())
    .then(() => {
      const helpers = new E2EHelpers();
      return helpers.setupApp(isAdmin ? ConsoleUserType.admin : ConsoleUserType.user);
    });
}

const NONE_CONNECTED_MSG = 'There are no connected Cloud Foundry endpoints, connect with your personal credentials to get started.';

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
    return this.checkWelcomeMessageText('There are no registered Cloud Foundry endpoints');
  }

  isWelcomeMessageNonAdmin() {
    return this.checkWelcomeMessageText('There are no registered endpoints');
  }

  isNoneConnectedSnackBar(snackBar: SnackBarComponent) {
    return snackBar.hasMessage(NONE_CONNECTED_MSG);
  }

  private checkWelcomeMessageText(msg: string) {
    const textEl = this.getWelcomeMessage().element(by.css('.first-line'));
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
  connected: boolean;
}

export class EndpointsTable extends ListTableComponent {

  constructor(locator: ElementFinder) {
    super(locator);
  }

  getEndpointData(row: ElementFinder) {
    // Get all of the columns
    return row.all(by.tagName('app-table-cell')).map(col => col.getText()).then(data => {
      return {
        name: data[1],
        connected: data[2] === 'cloud_done',
        type: data[3],
        url: data[4]
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
