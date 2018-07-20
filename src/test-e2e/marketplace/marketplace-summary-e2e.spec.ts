import { MarketplaceSummaryPage } from './marketplace-summary.po';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { e2e } from '../e2e';
import { SecretsHelpers } from '../helpers/secrets-helpers';
import { browser } from 'protractor';
import { ApplicationE2eHelper } from '../application/application-e2e-helpers';

fdescribe('Marketplace Summary', () => {
  let marketplaceSummaryPage: MarketplaceSummaryPage;
  let cfGuid: string;
  let serviceGuid: string;
  let applicationE2eHelper: ApplicationE2eHelper;

  beforeAll((done) => {
   const setup =  e2e.setup(ConsoleUserType.admin)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.admin);
    applicationE2eHelper = new ApplicationE2eHelper(setup);
    
  });

  beforeEach((done)=> {
    const getCfCnsi = applicationE2eHelper.cfRequestHelper.getCfCnsi();
    getCfCnsi.then(endpointModel => {
        cfGuid = endpointModel.guid;
        return applicationE2eHelper.fetchServices(cfGuid);
    }).then(response => {
        const service = response.resources[0];
        serviceGuid = service.metadata.guid;
        marketplaceSummaryPage = new MarketplaceSummaryPage(cfGuid, serviceGuid)
        marketplaceSummaryPage.navigateTo();
        marketplaceSummaryPage.waitForPage();
        done()
    })
  })
  
  it('- should reach marketplace summary page', () => {
    expect(marketplaceSummaryPage.isActivePage()).toBeTruthy();
  });

  it ('- should contain service summary card', () => {
      expect(marketplaceSummaryPage.getServiceSummaryCard().isPresent()).toBeTruthy();
  })


});
