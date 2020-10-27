import { promise } from 'protractor';

import { MessageNoContentPo } from '../application/po/message-no-autoscaler-policy';
import { e2e } from '../e2e';
import { EndpointsPage } from '../endpoints/endpoints.po';
import { ConsoleUserType, E2EHelpers } from '../helpers/e2e-helpers';
import { Component } from '../po/component.po';
import { ConfirmDialogComponent } from '../po/confirm-dialog';
import { ApiKeyE2eHelper } from './apikey-e2e-helper';
import { ApiKeyAddDialogPo } from './po/apikey-add-dialog.po';
import { APIKeyListPage } from './po/apikeys-list-page.po';

const customApiKeyLabel = E2EHelpers.e2eItemPrefix + (process.env.CUSTOM_APP_LABEL || process.env.USER) + '-api-key';

describe('API Keys -', () => {

  let helper: ApiKeyE2eHelper;
  let newKeysComment: string;
  const page = new APIKeyListPage();
  const endpointsPage = new EndpointsPage();

  let currentKeysCount = promise.fullyResolved(0);

  beforeAll(() => {
    const setup = e2e.setup(ConsoleUserType.admin)
      .clearAllEndpoints()
      .getInfo(ConsoleUserType.admin);
    helper = new ApiKeyE2eHelper(setup);

    newKeysComment = E2EHelpers.createCustomName(customApiKeyLabel).toLowerCase();
  });

  // Should be ran in sequence
  describe('Ordered Tests - ', () => {

    it('Should load UI', () => {
      // Wait for the UI to load - should go to the endpoints page
      endpointsPage.waitForPage();
    });

    it('Navigate to api key page', () => {
      page.header.clickUserMenuItem('API Keys');
      page.waitForPage();
    });

    it('New key does not exist', () => {
      // Validation check
      return page.list.isPresent().then(isDisplayed => {
        if (isDisplayed) {
          expect(page.list.table.findRow('comment', newKeysComment, false)).toBeLessThan(0);
          currentKeysCount = page.list.table.getRowCount();
        } else {
          const noContentComponent = new MessageNoContentPo();
          expect(noContentComponent.isDisplayed()).toBeTruthy();
        }
      });
    });

    describe('Add Dialog - ', () => {
      it('Basic Dialog tests', () => {
        expect(page.addKeyButton().isDisplayed()).toBeTruthy();
        page.addKeyButton().click();

        const dialog = new ApiKeyAddDialogPo();
        expect(dialog.isDisplayed()).toBeTruthy();
        expect(dialog.canClose()).toBeTruthy();
        expect(dialog.canCreate()).toBeFalsy();

        dialog.close();

        dialog.waitUntilNotShown();

        page.waitForPage();

      });

      it('Add a new key', () => {
        expect(page.addKeyButton().isDisplayed()).toBeTruthy();
        page.addKeyButton().click();

        const dialog = new ApiKeyAddDialogPo();
        dialog.waitUntilShown();
        expect(dialog.canCreate()).toBeFalsy();

        dialog.form.fill({
          comment: newKeysComment
        });

        expect(dialog.canClose()).toBeTruthy();
        expect(dialog.canCreate()).toBeTruthy();

        dialog.create();
        dialog.waitUntilNotShown();
      });
    });

    it('New key has a secret', () => {
      const secret = new Component(page.getKeySecret());
      secret.waitUntilShown();
      expect(secret.getComponent().getText()).toBeDefined();
      page.closeKeySecret();
      secret.waitUntilNotShown();
    });

    it('New key is in updated table', () => {
      expect(page.list.table.findRow('description', newKeysComment, true)).toBeGreaterThanOrEqual(0);
    });

    it('Delete new key', () => {
      return page.list.table.findRow('description', newKeysComment, true)
        .then(rowIndex => {
          page.list.table.openRowActionMenuByIndex(rowIndex).clickItem('Delete');
          ConfirmDialogComponent.expectDialogAndConfirm('Delete', 'Delete Key');
          page.waitForPage();
          return page.list.isPresent();
        })
        .then(isListDisplayed => {
          if (isListDisplayed) {
            page.list.waitForNoLoadingIndicator();
            expect(page.list.table.getRowCount()).toEqual(currentKeysCount);
          } else {
            expect(0).toEqual(currentKeysCount);
          }
        });
    });
  });

});