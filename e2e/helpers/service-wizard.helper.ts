import { Page } from '@playwright/test';
import { expect } from '../fixtures/test-base';
import { CFApiHelper } from './cf-api.helper';

/**
 * The broker the service instance wizard specs create from:
 * cloudfoundry/overview-broker, set in the active secrets profile as
 * cloudFoundry[0].services.testBroker ({url, offering, plan}; see
 * secrets.yaml.template).
 */
export interface TestBroker {
  url: string;
  offering: string;
  plan: string;
}

/** Opens a select in the current wizard step and picks the option named `name`. */
export async function pick(page: Page, index: number, name: string): Promise<void> {
  await page.locator('.steppers [role=combobox]').nth(index).click();
  const exact = new RegExp(`^\\s*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);
  await page.locator('[role=listbox] app-option:visible').filter({ hasText: exact }).first().click();
}

export async function next(page: Page, label: 'Next' | 'Finish' = 'Next'): Promise<void> {
  const button = page.getByRole('button', { name: label });
  await expect(button).toBeEnabled({ timeout: 15000 });
  await button.click();
}

/**
 * Opens the create wizard for the test broker's offering and walks it to the
 * details step (org, space, plan; no app to bind).
 */
export async function openCreateDetails(
  page: Page, cfGuid: string, cfApi: CFApiHelper, secrets: any, broker: TestBroker,
): Promise<void> {
  const cf = secrets.cloudFoundry[0];
  const offeringGuid = await cfApi.findServiceOfferingGuid(broker.offering, cf.testSpaceGuid);
  expect(offeringGuid, `offering ${broker.offering} visible in the test space`).toBeTruthy();
  await page.goto(`/marketplace/${cfGuid}/${offeringGuid}/create`);
  await pick(page, 0, cf.testOrg);
  await pick(page, 1, cf.testSpace);
  await next(page);
  await pick(page, 0, broker.plan);
  await next(page);
  await next(page);
  await expect(page.getByRole('textbox', { name: /Name/ })).toBeVisible();
}
