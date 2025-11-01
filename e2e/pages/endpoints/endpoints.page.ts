import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Endpoint Metadata Interface
 */
export interface EndpointMetadata {
  name: string;
  url: string;
  type: string;
  user: string;
  isAdmin: boolean;
  connected: boolean;
  favorite?: string;
}

/**
 * Endpoints Page Object
 * Migrated from src/test-e2e/endpoints/endpoints.po.ts
 *
 * Represents the endpoints management page with list/table/card views
 */
export class EndpointsPage extends BasePage {
  private readonly addButton: Locator;
  private readonly welcomeMessage: Locator;
  private readonly welcomeFirstLine: Locator;
  private readonly welcomeSecondLine: Locator;
  private readonly listComponent: Locator;
  private readonly tableRows: Locator;
  private readonly cardElements: Locator;

  constructor(page: Page) {
    super(page);

    this.addButton = page.locator('app-page-header button[aria-label="add"]');
    this.welcomeMessage = page.locator('.app-no-content-container');
    this.welcomeFirstLine = this.welcomeMessage.locator('.first-line');
    this.welcomeSecondLine = this.welcomeMessage.locator('.second-line');
    this.listComponent = page.locator('app-list');
    this.tableRows = page.locator('app-table tbody tr');
    this.cardElements = page.locator('app-card');
  }

  /**
   * Navigate to endpoints page
   */
  async navigateTo(): Promise<void> {
    await this.page.goto('/endpoints');
  }

  /**
   * Click register button to add new endpoint
   */
  async register(): Promise<void> {
    await this.addButton.click();
  }

  /**
   * Check if on non-admin no endpoints page
   */
  async isNonAdminNoEndpointsPage(): Promise<boolean> {
    return this.page.url().endsWith('/noendpoints');
  }

  /**
   * Check if admin welcome message is displayed
   */
  async isWelcomeMessageAdmin(shouldHavePrompt: boolean = true): Promise<boolean> {
    const isNonAdmin = await this.isWelcomeMessageNonAdmin();
    if (isNonAdmin) {
      return shouldHavePrompt ? await this.isWelcomePromptAdmin() : true;
    }
    return false;
  }

  /**
   * Check if admin welcome prompt is displayed
   */
  async isWelcomePromptAdmin(): Promise<boolean> {
    return await this.checkWelcomePromptText('Use the Endpoints view to register');
  }

  /**
   * Check if non-admin welcome message is displayed
   */
  async isWelcomeMessageNonAdmin(): Promise<boolean> {
    return await this.checkWelcomeMessageText('There are no registered endpoints');
  }

  /**
   * Check if "none connected" snackbar message is present
   */
  async isNoneConnectedSnackBar(): Promise<boolean> {
    const snackbar = this.page.locator('snack-bar-container');
    const text = (await snackbar.textContent().catch(() => null)) ?? '';
    return text.includes('There are no connected endpoints, connect with your personal credentials to get started.');
  }

  /**
   * Wait for "none connected" snackbar message
   */
  async waitForNoneConnectedSnackBar(): Promise<void> {
    await this.page.locator('snack-bar-container').filter({
      hasText: 'There are no connected endpoints, connect with your personal credentials to get started.'
    }).waitFor({ timeout: 5000 });
  }

  /**
   * Get all endpoint data from table view
   */
  async getAllEndpointData(): Promise<EndpointMetadata[]> {
    const rows = await this.tableRows.all();
    const data: EndpointMetadata[] = [];

    for (const row of rows) {
      const cells = await row.locator('app-table-cell').all();
      const cellTexts = await Promise.all(cells.map(cell => cell.textContent()));

      data.push({
        name: cellTexts[0]?.trim() || '',
        connected: cellTexts[1]?.includes('endpoints_connected') || false,
        type: cellTexts[2]?.trim() || '',
        user: cellTexts[3]?.trim() || '',
        isAdmin: cellTexts[4]?.includes('Yes') || false,
        url: cellTexts[5]?.trim() || '',
        favorite: cellTexts[6]?.trim()
      });
    }

    return data;
  }

  /**
   * Get endpoint data for specific endpoint by name
   */
  async getEndpointDataForEndpoint(name: string): Promise<EndpointMetadata | undefined> {
    const allData = await this.getAllEndpointData();
    return allData.find(d => d.name === name);
  }

  /**
   * Get table row for specific endpoint
   */
  async getRowForEndpoint(name: string): Promise<Locator | null> {
    const allData = await this.getAllEndpointData();
    const index = allData.findIndex(ep => ep.name === name);

    if (index === -1) {
      return null;
    }

    return this.tableRows.nth(index);
  }

  /**
   * Open action menu for a table row
   */
  async openActionMenu(row: Locator): Promise<void> {
    await row.locator('app-table-cell-actions button').click();
  }

  /**
   * Find card by title
   */
  async findCardByTitle(title: string, subtitle: string = 'Cloud Foundry'): Promise<Locator> {
    const fullTitle = `${title}\n${subtitle}`;
    return this.cardElements.filter({ hasText: fullTitle }).first();
  }

  /**
   * Get endpoint data from card view
   */
  async getEndpointDataFromCard(title: string, subtitle: string = 'Cloud Foundry'): Promise<EndpointMetadata> {
    const card = await this.findCardByTitle(title, subtitle);
    const cardText = await card.textContent() || '';

    // Parse card metadata
    const nameMatch = cardText.match(/^([^\n]+)/);
    const name = nameMatch ? nameMatch[1].trim() : '';

    const urlMatch = cardText.match(/Address\s*([^\n]+)/);
    const url = urlMatch ? urlMatch[1].replace('content_copy', '').trim() : '';

    const userMatch = cardText.match(/Details\s*([^\n]+)/);
    const userText = userMatch ? userMatch[1].trim() : '';
    const user = userText.replace(' (Administrator)', '');
    const isAdmin = userText.includes('(Administrator)');

    const connected = cardText.includes('Connected') && cardText.includes('endpoints_connected');

    return {
      name,
      url,
      type: subtitle,
      user,
      isAdmin,
      connected
    };
  }

  /**
   * Check welcome message text
   */
  private async checkWelcomeMessageText(msg: string): Promise<boolean> {
    return await this.checkWelcomeText(this.welcomeFirstLine, msg);
  }

  /**
   * Check welcome prompt text
   */
  private async checkWelcomePromptText(msg: string): Promise<boolean> {
    return await this.checkWelcomeText(this.welcomeSecondLine, msg);
  }

  /**
   * Check welcome text contains message
   */
  private async checkWelcomeText(locator: Locator, msg: string): Promise<boolean> {
    try {
      const text = await locator.textContent({ timeout: 2000 });
      return text?.trim().startsWith(msg) || false;
    } catch {
      return false;
    }
  }
}
