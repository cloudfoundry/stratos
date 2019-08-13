import * as moment from 'moment-timezone';
import { browser } from 'protractor';

import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { extendE2ETestTime } from '../helpers/extend-test-helpers';
import { CFPage } from '../po/cf-page.po';
import { createApplicationDeployTests } from './application-deploy-helper';
import { ApplicationE2eHelper } from './application-e2e-helpers';
import { ApplicationPageAutoscalerTab } from './po/application-page-autoscaler.po';
import { ApplicationBasePage } from './po/application-page.po';
import { PageAutoscalerEventBase } from './po/page-autoscaler-event-base.po';
import { PageAutoscalerMetricBase } from './po/page-autoscaler-metric-base.po';

let applicationE2eHelper: ApplicationE2eHelper;

describe('Autoscaler -', () => {

  beforeAll(() => {
    const setup = e2e.setup(ConsoleUserType.user)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.user)
      .connectAllEndpoints(ConsoleUserType.admin)
      .getInfo(ConsoleUserType.admin);
    applicationE2eHelper = new ApplicationE2eHelper(setup);
  });

  beforeAll(() => applicationE2eHelper.cfHelper.updateDefaultCfOrgSpace());

  afterAll(() => {
    browser.waitForAngularEnabled(true);
  });

  const { testAppName, appDetails } = createApplicationDeployTests(true);

  describe('Tab Tests -', () => {
    beforeAll(() => {
      // Should be deployed, no web-socket open, so we can wait for angular again
      browser.waitForAngularEnabled(true);

      expect(appDetails.cfGuid).toBeDefined();
      expect(appDetails.appGuid).toBeDefined();
      // Fresh reload so that we know the app status is correct
      const appBasePage = new ApplicationBasePage(appDetails.cfGuid, appDetails.appGuid);
      return appBasePage.navigateTo();
    });

    it('Autoscale Tab -- Disabled', () => {
      // Does app to be fully started
      const appAutoscaler = new ApplicationPageAutoscalerTab(appDetails.cfGuid, appDetails.appGuid);
      appAutoscaler.goToAutoscalerTab();
      appAutoscaler.cardInstances.waitForRunningInstancesText('1 / 1');
      expect(appAutoscaler.cardStatus.getStatusToggleInput()).toBe('false');
      expect(appAutoscaler.cardStatus.getStatusText()).toBe('Disabled');
      expect(appAutoscaler.tableEvents.getEmptyTableWarningText()).toBe('No events.');
    });
  });

  describe('Autoscaler Attach Policy -', () => {
    const loggingPrefix = 'Edit AutoScaler Policy:';
    let createPolicy;

    extendE2ETestTime(80000);

    beforeAll(() => {
      const appAutoscaler = new ApplicationPageAutoscalerTab(appDetails.cfGuid, appDetails.appGuid);
      appAutoscaler.goToAutoscalerTab();
      createPolicy = appAutoscaler.cardStatus.clickAttachPolicy();
    });

    it('Check edit steps', () => {
      expect(createPolicy.header.getTitleText()).toBe('Edit AutoScaler Policy: ' + testAppName);
      // Check the steps
      e2e.debugLog(`${loggingPrefix} Checking Steps`);
      createPolicy.stepper.getStepNames().then(steps => {
        expect(steps.length).toBe(4);
        expect(steps[0]).toBe('Default Instance Limits');
        expect(steps[1]).toBe('Scaling Rules');
        expect(steps[2]).toBe('Recurring Schedules');
        expect(steps[3]).toBe('Specific Dates');
      });
    });

    it('Should pass DefaultInstanceLimits Step', () => {
      e2e.debugLog(`${loggingPrefix} DefaultInstanceLimits Step`);
      expect(createPolicy.stepper.getActiveStepName()).toBe('Default Instance Limits');
      // Fill in form
      createPolicy.stepper.getStepperForm().fill({ instance_min_count: '1' });
      createPolicy.stepper.getStepperForm().fill({ instance_max_count: '8' });
      createPolicy.stepper.getStepperForm().fill({ timezone: 'UTC' });
      expect(createPolicy.stepper.canNext()).toBeTruthy();
      // Press next to get to source step
      createPolicy.stepper.next();
    });

    it('Should pass ScalingRules Step', () => {
      e2e.debugLog(`${loggingPrefix} ScalingRules Step`);
      expect(createPolicy.stepper.getActiveStepName()).toBe('Scaling Rules');
      expect(createPolicy.stepper.getRuleTilesCount()).toBe(0);

      // Click [Add] button
      createPolicy.stepper.clickAddButton();
      expect(createPolicy.stepper.getRuleTilesCount()).toBe(1);
      expect(createPolicy.stepper.canNext()).toBeFalsy();
      // Fill in form -- valid inputs
      createPolicy.stepper.getStepperForm().fill({ metric_type: 'memoryutil' });
      createPolicy.stepper.getStepperForm().fill({ operator: '>=' });
      createPolicy.stepper.getStepperForm().fill({ threshold: '20' });
      createPolicy.stepper.getStepperForm().fill({ breach_duration_secs: '60' });
      expect(createPolicy.stepper.getMatErrorsCount()).toBe(0);
      expect(createPolicy.stepper.getDoneButtonDisabledStatus()).toBe(null);
      // Fill in form -- invalid inputs
      createPolicy.stepper.getStepperForm().fill({ adjustment: '10' });
      createPolicy.stepper.getStepperForm().fill({ cool_down_secs: '10' });
      expect(createPolicy.stepper.getMatErrorsCount()).toBe(2);
      expect(createPolicy.stepper.getDoneButtonDisabledStatus()).toBe('true');
      // Fill in form -- fix invalid inputs
      createPolicy.stepper.getStepperForm().fill({ adjustment: '2' });
      createPolicy.stepper.getStepperForm().fill({ cool_down_secs: '60' });
      expect(createPolicy.stepper.getMatErrorsCount()).toBe(0);
      expect(createPolicy.stepper.getDoneButtonDisabledStatus()).toBe(null);
      createPolicy.stepper.clickDoneButton();

      // Click [Add] button
      createPolicy.stepper.clickAddButton();
      expect(createPolicy.stepper.getRuleTilesCount()).toBe(2);
      expect(createPolicy.stepper.canNext()).toBeFalsy();
      // Fill in form -- valid inputs
      createPolicy.stepper.getStepperForm().fill({ metric_type: 'throughput' });
      expect(createPolicy.stepper.getMatErrorsCount()).toBe(0);
      expect(createPolicy.stepper.getDoneButtonDisabledStatus()).toBe(null);
      // Fill in form -- invalid inputs
      createPolicy.stepper.getStepperForm().fill({ adjustment: '10' });
      expect(createPolicy.stepper.getMatErrorsCount()).toBe(1);
      expect(createPolicy.stepper.getDoneButtonDisabledStatus()).toBe('true');
      // Fill in form -- fix invalid inputs
      createPolicy.stepper.getStepperForm().fill({ adjustment_type: '% instances' });
      expect(createPolicy.stepper.getMatErrorsCount()).toBe(0);
      expect(createPolicy.stepper.getDoneButtonDisabledStatus()).toBe(null);
      createPolicy.stepper.clickDoneButton();

      // Click [Add] button
      createPolicy.stepper.clickAddButton();
      createPolicy.stepper.clickDoneButton();
      expect(createPolicy.stepper.getRuleTilesCount()).toBe(3);
      // Click [Delete] button
      createPolicy.stepper.clickDeleteButton(2);
      expect(createPolicy.stepper.getRuleTilesCount()).toBe(2);

      expect(createPolicy.stepper.canNext()).toBeTruthy();
      createPolicy.stepper.next();
    });

    it('Should pass RecurringSchedules Step', () => {
      e2e.debugLog(`${loggingPrefix} RecurringSchedules Step`);
      expect(createPolicy.stepper.getActiveStepName()).toBe('Recurring Schedules');
      expect(createPolicy.stepper.getRuleTilesCount()).toBe(0);

      // Click [Add] button
      createPolicy.stepper.clickAddButton();
      expect(createPolicy.stepper.getRuleTilesCount()).toBe(1);
      expect(createPolicy.stepper.canNext()).toBeFalsy();
      // Fill in form -- valid inputs
      // createPolicy.stepper.getStepperForm().fill({ effective_type: 'custom' });
      // createPolicy.stepper.getStepperForm().fill({ start_date: '2100/01/01' });
      // createPolicy.stepper.getStepperForm().fill({ end_date: '2101/01/01' });
      // createPolicy.stepper.getStepperForm().fill({ repeat_type: 'month' });
      // createPolicy.stepper.getStepperForm().fill({ days_of_month: [2, 3] });
      createPolicy.stepper.getStepperForm().fill({ days_of_week: [1, 2, 3] }); // unselect the previous options
      createPolicy.stepper.getStepperForm().fill({ days_of_week: [3, 4, 5] }); // selec the new options
      createPolicy.stepper.getStepperForm().fill({ start_time: '08:00 AM' });
      createPolicy.stepper.getStepperForm().fill({ end_time: '08:00 PM' });
      createPolicy.stepper.getStepperForm().fill({ instance_min_count: '2' });
      createPolicy.stepper.getStepperForm().fill({ initial_min_instance_count: '5' });
      createPolicy.stepper.getStepperForm().fill({ instance_max_count: '10' });
      expect(createPolicy.stepper.getMatErrorsCount()).toBe(0);
      expect(createPolicy.stepper.getDoneButtonDisabledStatus()).toBe(null);
      createPolicy.stepper.clickDoneButton();

      expect(createPolicy.stepper.canNext()).toBeTruthy();
      createPolicy.stepper.next();
    });

    it('Should pass SpecificDates Step', () => {
      e2e.debugLog(`${loggingPrefix} SpecificDates Step`);
      expect(createPolicy.stepper.getActiveStepName()).toBe('Specific Dates');
      expect(createPolicy.stepper.getRuleTilesCount()).toBe(0);

      // Click [Add] button
      createPolicy.stepper.clickAddButton();
      expect(createPolicy.stepper.getRuleTilesCount()).toBe(1);
      expect(createPolicy.stepper.canNext()).toBeFalsy();
      // Fill in form -- valid inputs
      const start = moment().tz('UTC').add(1, 'minutes').format('YYYY/MM/DD,hh:mm A');
      createPolicy.stepper.getStepperForm().fill({ start_date_time: start });
      createPolicy.stepper.getStepperForm().fill({ instance_min_count: '2' });
      createPolicy.stepper.getStepperForm().fill({ initial_min_instance_count: '2' });
      createPolicy.stepper.getStepperForm().fill({ instance_max_count: '10' });
      expect(createPolicy.stepper.getMatErrorsCount()).toBe(0);
      expect(createPolicy.stepper.getDoneButtonDisabledStatus()).toBe(null);
      createPolicy.stepper.clickDoneButton();

      // Click [Add] button
      createPolicy.stepper.clickAddButton();
      expect(createPolicy.stepper.getRuleTilesCount()).toBe(2);
      expect(createPolicy.stepper.canNext()).toBeFalsy();
      // Fill in form -- invalid inputs
      createPolicy.stepper.getStepperForm().fill({ instance_min_count: '20' });
      expect(createPolicy.stepper.getMatErrorsCount()).toBe(4);
      // Fill in form -- fix invalid inputs
      createPolicy.stepper.getStepperForm().fill({ instance_min_count: '2' });
      createPolicy.stepper.getStepperForm().fill({ start_date_time: '2099/01/01,08:00 AM' });
      createPolicy.stepper.getStepperForm().fill({ end_date_time: '2099/01/01,08:00 PM' });
      expect(createPolicy.stepper.getMatErrorsCount()).toBe(0);
      createPolicy.stepper.clickDoneButton();

      expect(createPolicy.stepper.canNext()).toBeTruthy();
      createPolicy.stepper.next();
    });

    it('Should go to App Autoscaler Tab', () => {
      e2e.sleep(1000);
      e2e.debugLog(`${loggingPrefix} Waiting For App Autoscaler Tab`);
      // Should be app autoscaler tab
      const appSummaryPage = new CFPage('/applications/');
      appSummaryPage.waitForPageOrChildPage();
      appSummaryPage.header.waitForTitleText(testAppName);
      browser.wait(ApplicationPageAutoscalerTab.detect()
        .then(appAutoscaler => {
          appDetails.cfGuid = appAutoscaler.cfGuid;
          appDetails.appGuid = appAutoscaler.appGuid;
          expect(appAutoscaler.cardStatus.getStatusToggleInput()).toBe('true');
          expect(appAutoscaler.cardStatus.getStatusText()).toBe('Enabled');

          expect(appAutoscaler.cardDefault.getRunningInstancesText()).toBe('1 / 1');
          expect(appAutoscaler.cardDefault.getDefaultMinText()).toBe('1');
          expect(appAutoscaler.cardDefault.getDefaultMaxText()).toBe('8');

          expect(appAutoscaler.cardMetric.getMetricChartsCount()).toBe(2);
          expect(appAutoscaler.cardMetric.getMetricChartTitleText(0)).toContain('memoryutil');
          expect(appAutoscaler.cardMetric.getMetricChartTitleText(1)).toContain('throughput');

          expect(appAutoscaler.tableTriggers.getTableRowsCount()).toBe(2);
          expect(appAutoscaler.tableTriggers.getTableRowCellContent(0, 0)).toBe('memoryutil');
          expect(appAutoscaler.tableTriggers.getTableRowCellContent(0, 1)).toBe('>=20 % for 60 secs.');
          expect(appAutoscaler.tableTriggers.getTableRowCellContent(0, 2)).toBe('+2 instances');
          expect(appAutoscaler.tableTriggers.getTableRowCellContent(1, 0)).toBe('throughput');
          expect(appAutoscaler.tableTriggers.getTableRowCellContent(1, 1)).toBe('<=10rps for 120 secs.');
          expect(appAutoscaler.tableTriggers.getTableRowCellContent(1, 2)).toBe('-10% instances');

          expect(appAutoscaler.tableSchedules.getScheduleTableTitleText()).toBe('Scheduled Limit Rules in UTC');
          expect(appAutoscaler.tableSchedules.getRecurringTableRowsCount()).toBe(1);
          expect(appAutoscaler.tableSchedules.getRecurringTableRowCellContent(0, 0)).toBe('Always');
          expect(appAutoscaler.tableSchedules.getRecurringTableRowCellContent(0, 1)).toBe('3,4,5 of the week');
          expect(appAutoscaler.tableSchedules.getRecurringTableRowCellContent(0, 2)).toBe('08:00');
          expect(appAutoscaler.tableSchedules.getRecurringTableRowCellContent(0, 3)).toBe('20:00');
          expect(appAutoscaler.tableSchedules.getRecurringTableRowCellContent(0, 4)).toBe('5');
          expect(appAutoscaler.tableSchedules.getRecurringTableRowCellContent(0, 5)).toBe('2');
          expect(appAutoscaler.tableSchedules.getRecurringTableRowCellContent(0, 6)).toBe('10');
          expect(appAutoscaler.tableSchedules.getSpecificTableRowsCount()).toBe(2);
          expect(appAutoscaler.tableSchedules.getSpecificTableRowCellContent(0, 1))
            .toBe(moment().add(1, 'days').format('YYYY-MM-DD') + 'T18:00');
          expect(appAutoscaler.tableSchedules.getSpecificTableRowCellContent(0, 2)).toBe('2');
          expect(appAutoscaler.tableSchedules.getSpecificTableRowCellContent(0, 3)).toBe('2');
          expect(appAutoscaler.tableSchedules.getSpecificTableRowCellContent(0, 4)).toBe('10');
          expect(appAutoscaler.tableSchedules.getSpecificTableRowCellContent(1, 0)).toBe('2099-01-01T08:00');
          expect(appAutoscaler.tableSchedules.getSpecificTableRowCellContent(1, 1)).toBe('2099-01-01T20:00');
          expect(appAutoscaler.tableSchedules.getSpecificTableRowCellContent(1, 2)).toBe('5');
          expect(appAutoscaler.tableSchedules.getSpecificTableRowCellContent(1, 3)).toBe('2');
          expect(appAutoscaler.tableSchedules.getSpecificTableRowCellContent(1, 4)).toBe('10');
        }), 10000, 'Failed to wait for App Autoscaler Tab after attach policy'
      );
    });
  });

  describe('Autoscaler Edit Policy -', () => {
    const loggingPrefix = 'Edit AutoScaler Policy:';
    let createPolicy;

    extendE2ETestTime(60000);

    describe('From autoscaler default card', () => {
      beforeAll(() => {
        const appAutoscaler = new ApplicationPageAutoscalerTab(appDetails.cfGuid, appDetails.appGuid);
        appAutoscaler.goToAutoscalerTab();
        createPolicy = appAutoscaler.cardDefault.clickEditPolicy();
      });

      it('Check edit steps', () => {
        expect(createPolicy.header.getTitleText()).toBe('Edit AutoScaler Policy: ' + testAppName);
        // Check the steps
        e2e.debugLog(`${loggingPrefix} Checking Steps`);
        createPolicy.stepper.getStepNames().then(steps => {
          expect(steps.length).toBe(4);
          expect(steps[0]).toBe('Default Instance Limits');
        });
      });

      it('Should pass DefaultInstanceLimits Step', () => {
        createPolicy.stepper.getStepperForm().fill({ instance_max_count: '2' });
        expect(createPolicy.stepper.canNext()).toBeTruthy();
        createPolicy.stepper.next();
      });

      it('Should pass ScalingRules Step', () => {
        expect(createPolicy.stepper.canNext()).toBeTruthy();
        createPolicy.stepper.next();
      });

      it('Should pass RecurringSchedules Step', () => {
        expect(createPolicy.stepper.canNext()).toBeTruthy();
        createPolicy.stepper.next();
      });

      it('Should pass SpecificDates Step', () => {
        expect(createPolicy.stepper.canNext()).toBeTruthy();
        createPolicy.stepper.next();
      });

      it('Should go to App Autoscaler Tab', () => {
        e2e.sleep(1000);
        e2e.debugLog(`${loggingPrefix} Waiting For App Autoscaler Tab`);
        // Should be app autoscaler tab
        const appSummaryPage = new CFPage('/applications/');
        appSummaryPage.waitForPageOrChildPage();
        appSummaryPage.header.waitForTitleText(testAppName);
        browser.wait(ApplicationPageAutoscalerTab.detect()
          .then(appAutoscaler => {
            expect(appAutoscaler.cardDefault.getDefaultMaxText()).toBe('2');
          }), 10000, 'Failed to wait for App Autoscaler Tab after edit policy'
        );
      });
    });

    describe('From autoscaler trigger table', () => {
      beforeAll(() => {
        const appAutoscaler = new ApplicationPageAutoscalerTab(appDetails.cfGuid, appDetails.appGuid);
        appAutoscaler.goToAutoscalerTab();
        createPolicy = appAutoscaler.tableTriggers.clickEditPolicy();
      });

      it('Check edit steps', () => {
        expect(createPolicy.header.getTitleText()).toBe('Edit AutoScaler Policy: ' + testAppName);
        createPolicy.stepper.getStepNames().then(steps => {
          expect(steps.length).toBe(4);
          expect(steps[1]).toBe('Scaling Rules');
        });
      });

      it('Should pass DefaultInstanceLimits Step', () => {
        expect(createPolicy.stepper.canNext()).toBeTruthy();
        createPolicy.stepper.next();
      });

      it('Should pass ScalingRules Step', () => {
        createPolicy.stepper.clickAddButton();
        createPolicy.stepper.clickDoneButton();
        expect(createPolicy.stepper.canNext()).toBeTruthy();
        createPolicy.stepper.next();
      });

      it('Should pass RecurringSchedules Step', () => {
        expect(createPolicy.stepper.canNext()).toBeTruthy();
        createPolicy.stepper.next();
      });

      it('Should pass SpecificDates Step', () => {
        expect(createPolicy.stepper.canNext()).toBeTruthy();
        createPolicy.stepper.next();
      });

      it('Should go to App Autoscaler Tab', () => {
        e2e.sleep(1000);
        e2e.debugLog(`${loggingPrefix} Waiting For App Autoscaler Tab`);
        // Should be app autoscaler tab
        const appSummaryPage = new CFPage('/applications/');
        appSummaryPage.waitForPageOrChildPage();
        appSummaryPage.header.waitForTitleText(testAppName);
        browser.wait(ApplicationPageAutoscalerTab.detect()
          .then(appAutoscaler => {
            expect(appAutoscaler.cardMetric.getMetricChartsCount()).toBe(3);
            expect(appAutoscaler.cardMetric.getMetricChartTitleText(2)).toContain('memoryused');
            expect(appAutoscaler.tableTriggers.getTableRowsCount()).toBe(3);
            expect(appAutoscaler.tableTriggers.getTableRowCellContent(2, 0)).toBe('memoryused');
            expect(appAutoscaler.tableTriggers.getTableRowCellContent(2, 1)).toBe('<=10MB for 120 secs.');
            expect(appAutoscaler.tableTriggers.getTableRowCellContent(2, 2)).toBe('-1 instances');
          }), 10000, 'Failed to wait for App Autoscaler Tab after edit policy'
        );
      });
    });

    describe('From autoscaler schedule table', () => {
      beforeAll(() => {
        const appAutoscaler = new ApplicationPageAutoscalerTab(appDetails.cfGuid, appDetails.appGuid);
        appAutoscaler.goToAutoscalerTab();
        createPolicy = appAutoscaler.tableTriggers.clickEditPolicy();
      });

      it('Check edit steps', () => {
        expect(createPolicy.header.getTitleText()).toBe('Edit AutoScaler Policy: ' + testAppName);
        createPolicy.stepper.getStepNames().then(steps => {
          expect(steps.length).toBe(4);
          expect(steps[2]).toBe('Recurring Schedules');
          expect(steps[3]).toBe('Specific Dates');
        });
      });

      it('Should pass DefaultInstanceLimits Step', () => {
        expect(createPolicy.stepper.canNext()).toBeTruthy();
        createPolicy.stepper.next();
      });

      it('Should pass ScalingRules Step', () => {
        expect(createPolicy.stepper.canNext()).toBeTruthy();
        createPolicy.stepper.next();
      });

      it('Should pass RecurringSchedules Step', () => {
        createPolicy.stepper.clickDeleteButton(0);
        expect(createPolicy.stepper.canNext()).toBeTruthy();
        createPolicy.stepper.next();
      });

      it('Should pass SpecificDates Step', () => {
        createPolicy.stepper.clickDeleteButton(1);
        expect(createPolicy.stepper.canNext()).toBeTruthy();
        createPolicy.stepper.next();
      });

      it('Should go to App Autoscaler Tab', () => {
        e2e.sleep(1000);
        e2e.debugLog(`${loggingPrefix} Waiting For App Autoscaler Tab`);
        // Should be app autoscaler tab
        const appSummaryPage = new CFPage('/applications/');
        appSummaryPage.waitForPageOrChildPage();
        appSummaryPage.header.waitForTitleText(testAppName);
        browser.wait(ApplicationPageAutoscalerTab.detect()
          .then(appAutoscaler => {
            expect(appAutoscaler.tableSchedules.getRecurringTableRowsCount()).toBe(0);
            expect(appAutoscaler.tableSchedules.getEmptyRecurringTableWarningText()).toBe('No recurring schedule.');
            expect(appAutoscaler.tableSchedules.getSpecificTableRowsCount()).toBe(1);
            // expect(appAutoscaler.tableSchedules.getEmptySpecificTableWarningText()).toBe('No specific date schedule.');
          }), 10000, 'Failed to wait for App Autoscaler Tab after edit policy'
        );
      });
    });

  });

  describe('Autoscaler Metric Page -', () => {
    const loggingPrefix = 'AutoScaler Metric Charts:';
    let metricPageBase: PageAutoscalerMetricBase;
    describe('From autoscaler metric card', () => {
      beforeAll(() => {
        const appAutoscaler = new ApplicationPageAutoscalerTab(appDetails.cfGuid, appDetails.appGuid);
        appAutoscaler.goToAutoscalerTab();
        metricPageBase = appAutoscaler.cardMetric.clickGotoMetricDashboard();
      });

      it('Go to metric page', () => {
        e2e.sleep(1000);
        e2e.debugLog(`${loggingPrefix} Waiting For Autoscale Metric Page`);
        metricPageBase.waitForPage();
        expect(metricPageBase.header.getTitleText()).toBe('AutoScaler Metric Charts: ' + testAppName);
        expect(metricPageBase.list.cards.getCardCount()).toBe(3);
        metricPageBase.header.clickIconButton('clear');
      });

      it('Should go to App Autoscaler Tab', () => {
        e2e.sleep(1000);
        e2e.debugLog(`${loggingPrefix} Waiting For App Autoscaler Tab`);
        // Should be app autoscaler tab
        const appSummaryPage = new CFPage('/applications/');
        appSummaryPage.waitForPageOrChildPage();
        appSummaryPage.header.waitForTitleText(testAppName);
        browser.wait(ApplicationPageAutoscalerTab.detect()
          .then(appAutoscaler => {
            expect(appAutoscaler.cardStatus.getStatusToggleInput()).toBe('true');
            expect(appAutoscaler.cardStatus.getStatusText()).toBe('Enabled');
          }), 10000, 'Failed to wait for App Autoscaler Tab after view metric charts'
        );
      });
    });
  });

  describe('Autoscaler Event Page - ', () => {
    const loggingPrefix = 'AutoScaler Event Table:';
    let eventPageBase: PageAutoscalerEventBase;
    describe('From autoscaler event card', () => {
      beforeAll(() => {
        const appAutoscaler = new ApplicationPageAutoscalerTab(appDetails.cfGuid, appDetails.appGuid);
        appAutoscaler.goToAutoscalerTab();
        e2e.sleep(30000);
        eventPageBase = appAutoscaler.tableEvents.clickGotoEventPage();
      });

      it('Go to events page', () => {
        e2e.sleep(1000);
        e2e.debugLog(`${loggingPrefix} Waiting For Autoscale Event Page`);
        eventPageBase.waitForPage();
        expect(eventPageBase.header.getTitleText()).toBe('AutoScaler Scaling Events: ' + testAppName);
        // expect(eventPageBase.list.empty.getDefault().isDisplayed()).toBeTruthy();
        // expect(eventPageBase.list.empty.getDefault().getComponent().getText()).toBe('There are no scaling events');
        expect(eventPageBase.list.table.getRowCount()).toBe(1);
        expect(eventPageBase.list.table.getCell(0, 2).getText()).toBe('schedule');
        expect(eventPageBase.list.table.getCell(0, 4).getText()).toBe('+1 instance(s) because limited by min instances 2');
        eventPageBase.header.clickIconButton('clear');
      });

      it('Should go to App Autoscaler Tab', () => {
        e2e.sleep(1000);
        e2e.debugLog(`${loggingPrefix} Waiting For App Autoscaler Tab`);
        // Should be app autoscaler tab
        const appSummaryPage = new CFPage('/applications/');
        appSummaryPage.waitForPageOrChildPage();
        appSummaryPage.header.waitForTitleText(testAppName);
        browser.wait(ApplicationPageAutoscalerTab.detect()
          .then(appAutoscaler => {
            expect(appAutoscaler.cardStatus.getStatusToggleInput()).toBe('true');
            expect(appAutoscaler.cardStatus.getStatusText()).toBe('Enabled');
          }), 10000, 'Failed to wait for App Autoscaler Tab after view scaling events'
        );
      });
    });
  });

  afterAll(() => applicationE2eHelper.deleteApplication(null, { appName: testAppName }));

});
