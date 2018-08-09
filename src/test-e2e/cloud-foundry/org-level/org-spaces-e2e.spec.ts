import { browser, promise } from 'protractor';

import { IOrganization } from '../../../frontend/app/core/cf-api.types';
import { APIResource } from '../../../frontend/app/store/types/api.types';
import { e2e, E2ESetup } from '../../e2e';
import { E2EConfigCloudFoundry } from '../../e2e.types';
import { CFHelpers } from '../../helpers/cf-helpers';
import { ConsoleUserType, E2EHelpers } from '../../helpers/e2e-helpers';
import { ListComponent } from '../../po/list.po';
import { CfOrgLevelPage } from './cf-org-level-page.po';

const customAppLabel = E2EHelpers.e2eItemPrefix + (process.env.CUSTOM_APP_LABEL || process.env.USER) + '-org-spaces-test-';

fdescribe('Org Spaces - ', () => {

  let e2eSetup: E2ESetup;
  let cfHelper: CFHelpers;
  let defaultCf: E2EConfigCloudFoundry;
  let orgPage: CfOrgLevelPage;

  const spaceNames = [
    E2EHelpers.createCustomName(customAppLabel + '1'),
    E2EHelpers.createCustomName(customAppLabel + '2'),
    E2EHelpers.createCustomName(customAppLabel + '3'),
  ];

  function setup() {
    defaultCf = e2e.secrets.getDefaultCFEndpoint();
    const endpointGuid = e2e.helper.getEndpointGuid(e2e.info, defaultCf.name);
    browser.wait(
      cfHelper.fetchOrg(endpointGuid, defaultCf.testOrg)
        .then((org: APIResource<IOrganization>) => {
          // Chain the creation of the spaces to ensure there's a nice sequential 'created_at' value
          const promisesChain = spaceNames.reduce((promiseChain, name) => {
            return promiseChain.then(() => {
              // Ensure there's a gap so the 'created_at' is different
              browser.sleep(1250);
              return cfHelper.addSpaceIfMissingForEndpointUsers(
                endpointGuid,
                org.metadata.guid,
                org.entity.name,
                name,
                defaultCf);
            });
          }, promise.fullyResolved(''));

          return promisesChain.then(() => org.metadata.guid);
        })
        .then(orgGuid => {
          orgPage = CfOrgLevelPage.forEndpoint(endpointGuid, orgGuid);
          orgPage.navigateTo();
          orgPage.waitForPageOrChildPage();
          orgPage.loadingIndicator.waitUntilNotShown();
          orgPage.goToSpacesTab();
        })
    );
  }

  function tearDown() {
    const endpointGuid = e2e.helper.getEndpointGuid(e2e.info, defaultCf.name);
    spaceNames.forEach(name => cfHelper.deleteSpaceIfExisting(endpointGuid, name));
  }


  beforeAll(() => {
    e2eSetup = e2e.setup(ConsoleUserType.admin)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.admin)
      .loginAs(ConsoleUserType.admin)
      .getInfo();
    cfHelper = new CFHelpers(e2eSetup);
  });

  afterAll(() => {
    tearDown();
  });

  function testSortBy(sortFieldName: string) {
    const spaceList = new ListComponent();
    expect(spaceList.isTableView()).toBeFalsy();

    const sortFieldForm = spaceList.header.getSortFieldForm();
    sortFieldForm.fill({ 'sort-field': sortFieldName });

    let expectedTitleOrder: string[];
    spaceList.cards.getCardsMetadata().then(cards => {
      const originalTitleOrder = cards.map(card => card.title);
      expectedTitleOrder = new Array(originalTitleOrder.length);
      for (let i = 0; i < originalTitleOrder.length; i++) {
        expectedTitleOrder[originalTitleOrder.length - i - 1] = originalTitleOrder[i];
      }
    });

    spaceList.header.toggleSortOrder();

    spaceList.cards.getCardsMetadata().then(cards => {
      const newTitleOrder = cards.map(card => card.title);
      expect(expectedTitleOrder).toEqual(newTitleOrder);
    });
  }

  it('sort by name', () => {

    testSortBy('Name');
  });

  fit('sort by creation', () => {
    setup(); // TODO: RC sort out


    testSortBy('Creation');
  });


});

// TODO: RC empty list
