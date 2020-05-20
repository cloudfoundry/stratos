import * as moment from 'moment-timezone';
import { browser, promise } from 'protractor';
import { timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { extendE2ETestTime } from '../helpers/extend-test-helpers';
import { LocaleHelper } from '../locale.helper';
import { CFPage } from '../po/cf-page.po';
import { ConfirmDialogComponent } from '../po/confirm-dialog';
import { CREATE_APP_DEPLOY_TEST_TYPE, createApplicationDeployTests } from './application-deploy-helper';
import { ApplicationE2eHelper } from './application-e2e-helpers';
import { ApplicationPageAutoscalerTab } from './po/application-page-autoscaler.po';
import { ApplicationBasePage } from './po/application-page.po';
import { CreateAutoscalerPolicy } from './po/create-autoscaler-policy.po';
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

  const { testAppName, appDetails } = createApplicationDeployTests(CREATE_APP_DEPLOY_TEST_TYPE.GIT_URL);

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
      appAutoscaler.waitForAutoscalerTab();
      appAutoscaler.goToAutoscalerTab();
      appAutoscaler.waitForPage();
      expect(appAutoscaler.bannerAutoscalerTab.getButtonsCount()).toBe(1);
      expect(appAutoscaler.bannerAutoscalerTab.getCreateButtonExistence()).toBe(true);
      expect(appAutoscaler.messageNoPolicy.getTitleText()).toBe('This application has no Autoscaler Policy');
    });
  });

  describe('Autoscaler Attach Policy -', () => {
    const loggingPrefix = 'Edit AutoScaler Policy:';
    let createPolicy: CreateAutoscalerPolicy;
    let scheduleEndDate1: moment.Moment;

    let scheduleStartDate2: moment.Moment;
    let scheduleEndDate2: moment.Moment;

    let timeFormat: string;
    let dateAndTimeFormat: string;

    extendE2ETestTime(80000);

    beforeAll(() => new LocaleHelper().getWindowDateTimeFormats().then(formats => {
      timeFormat = formats.timeFormat;
      dateAndTimeFormat = `${formats.dateFormat},${timeFormat}`;
    }));

    beforeAll(() => {
      const appAutoscaler = new ApplicationPageAutoscalerTab(appDetails.cfGuid, appDetails.appGuid);
      appAutoscaler.goToAutoscalerTab();
      createPolicy = appAutoscaler.bannerAutoscalerTab.clickCreatePolicy();
    });

    it('Check edit steps', () => {
      createPolicy.header.waitForTitleText('Create AutoScaler Policy: ' + testAppName)
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
      createPolicy.stepper.getStepperForm().fill({ threshold: '60' });
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
      const startTime = moment().set('hours', 8).set('minutes', 0);
      const endTime = moment().set('hours', 20).set('minutes', 0);
      createPolicy.stepper.getStepperForm().fill({ days_of_week: [1, 2, 3] }); // unselect the previous options
      createPolicy.stepper.getStepperForm().fill({ days_of_week: [3, 4, 5] }); // select the new options
      createPolicy.stepper.getStepperForm().fill({ start_time: startTime.format(timeFormat) });
      createPolicy.stepper.getStepperForm().fill({ end_time: endTime.format(timeFormat) });
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

      // Schedule dates should not overlap
      // scheduleStartDate1 should be set close to time it's entered, this is what triggers the scaling event tested below
      const scheduleStartDate1 = moment().tz('UTC').add(1, 'minutes').add(30, 'seconds');
      scheduleEndDate1 = moment().tz('UTC').add(2, 'days');
      scheduleStartDate2 = moment().tz('UTC').add(3, 'days');
      scheduleEndDate2 = moment().tz('UTC').add(4, 'days');

      // Fill in form -- valid inputs
      createPolicy.stepper.getStepperForm().fill({ start_date_time: scheduleStartDate1.format(dateAndTimeFormat) });
      createPolicy.stepper.getStepperForm().fill({ end_date_time: scheduleEndDate1.format(dateAndTimeFormat) });
      createPolicy.stepper.getStepperForm().fill({ instance_min_count: '2' });
      createPolicy.stepper.getStepperForm().fill({ initial_min_instance_count: '2' });
      createPolicy.stepper.getStepperForm().fill({ instance_max_count: '10' });
      expect(createPolicy.stepper.getMatErrorsCount()).toBe(0);
      expect(createPolicy.stepper.getDoneButtonDisabledStatus()).toBe(null);
      createPolicy.stepper.clickDoneButton();

      // Bad form, have seen errors where the first schedule isn't shown in ux but is submitted. When submitted the start time is already
      // in the past and the create policy request fails. Needs a better solution
      e2e.sleep(1000);

      // Click [Add] button
      createPolicy.stepper.clickAddButton();
      expect(createPolicy.stepper.getRuleTilesCount()).toBe(2);
      expect(createPolicy.stepper.canNext()).toBeFalsy();
      // Fill in form -- invalid inputs
      createPolicy.stepper.getStepperForm().fill({ instance_min_count: '20' });
      expect(createPolicy.stepper.getMatErrorsCount()).toBe(4);
      // Fill in form -- fix invalid inputs
      createPolicy.stepper.getStepperForm().fill({ instance_min_count: '2' });
      // Fill in form -- valid inputs
      createPolicy.stepper.getStepperForm().fill({ start_date_time: scheduleStartDate2.format(dateAndTimeFormat) });
      createPolicy.stepper.getStepperForm().fill({ end_date_time: scheduleEndDate2.format(dateAndTimeFormat) });
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
          expect(appAutoscaler.bannerAutoscalerTab.getButtonsCount()).toBe(2);
          expect(appAutoscaler.bannerAutoscalerTab.getEditButtonExistence()).toBe(true);
          expect(appAutoscaler.bannerAutoscalerTab.getDeleteButtonExistence()).toBe(true);

          expect(appAutoscaler.cardDefault.getRunningInstancesText()).toBe('1 / 1');
          expect(appAutoscaler.cardDefault.getDefaultMinText()).toBe('1');
          expect(appAutoscaler.cardDefault.getDefaultMaxText()).toBe('8');

          appAutoscaler.cardMetric.waitUntilShown();
          appAutoscaler.cardMetric.waitForMetricsChartContainer();
          appAutoscaler.cardMetric.waitForMetricsChart(0);
          appAutoscaler.cardMetric.waitForMetricsChart(1);
          expect(appAutoscaler.cardMetric.getMetricChartsCount()).toBe(2);
          expect(appAutoscaler.cardMetric.getMetricChartTitleText(0)).toContain('memoryutil');
          expect(appAutoscaler.cardMetric.getMetricChartTitleText(1)).toContain('throughput');

          expect(appAutoscaler.tableTriggers.getTableRowsCount()).toBe(2);
          expect(appAutoscaler.tableTriggers.getTableRowCellContent(0, 0)).toBe('memoryutil');
          expect(appAutoscaler.tableTriggers.getTableRowCellContent(0, 1)).toBe('>=60 % for 60 secs.');
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
          const dateFormat2 = 'YYYY-MM-DDTHH:mm';
          expect(appAutoscaler.tableSchedules.getSpecificTableRowCellContent(0, 1)).toBe(scheduleEndDate1.format(dateFormat2));
          expect(appAutoscaler.tableSchedules.getSpecificTableRowCellContent(0, 2)).toBe('2');
          expect(appAutoscaler.tableSchedules.getSpecificTableRowCellContent(0, 3)).toBe('2');
          expect(appAutoscaler.tableSchedules.getSpecificTableRowCellContent(0, 4)).toBe('10');
          expect(appAutoscaler.tableSchedules.getSpecificTableRowCellContent(1, 0)).toBe(scheduleStartDate2.format(dateFormat2));
          expect(appAutoscaler.tableSchedules.getSpecificTableRowCellContent(1, 1)).toBe(scheduleEndDate2.format(dateFormat2));
          expect(appAutoscaler.tableSchedules.getSpecificTableRowCellContent(1, 2)).toBe('5');
          expect(appAutoscaler.tableSchedules.getSpecificTableRowCellContent(1, 3)).toBe('2');
          expect(appAutoscaler.tableSchedules.getSpecificTableRowCellContent(1, 4)).toBe('10');
        }), 10000, 'Failed to wait for App Autoscaler Tab after attach policy'
      );
    });
  });

  describe('Autoscaler Edit Policy -', () => {
    const loggingPrefix = 'Edit AutoScaler Policy:';
    let createPolicy: CreateAutoscalerPolicy;

    extendE2ETestTime(60000);

    let dateAndTimeFormat;

    beforeAll(() => new LocaleHelper().getWindowDateTimeFormats().then(formats => {
      const timeFormat = formats.timeFormat;
      dateAndTimeFormat = `${formats.dateFormat},${timeFormat}`;
    }));

    beforeAll(() => {
      const appAutoscaler = new ApplicationPageAutoscalerTab(appDetails.cfGuid, appDetails.appGuid);
      appAutoscaler.goToAutoscalerTab();
      createPolicy = appAutoscaler.bannerAutoscalerTab.clickEditPolicy();
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
      createPolicy.stepper.clickAddButton();
      createPolicy.stepper.clickDoneButton();
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

      createPolicy.stepper.clickEditButton();

      // When setting the start time it must be after the current time. It seems like AS checks to the nearest minute, so start time needs
      // to be at least +1m from now

      const scheduleStartDate1 = moment().tz('UTC').add(1, 'minutes').add(15, 'seconds');
      const scheduleEndDate1 = moment().tz('UTC').add(2, 'days');
      console.log(`Setting schedule. Now: ${moment().tz('UTC').toString()}. Start: ${scheduleStartDate1.toString()}. End ${scheduleEndDate1.toString()}`);
      createPolicy.stepper.getStepperForm().waitUntilShown();
      createPolicy.stepper.getStepperForm().fill({ start_date_time: scheduleStartDate1.format(dateAndTimeFormat) });
      createPolicy.stepper.getStepperForm().fill({ end_date_time: scheduleEndDate1.format(dateAndTimeFormat) });
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
          expect(appAutoscaler.cardDefault.getDefaultMaxText()).toBe('2');

          expect(appAutoscaler.cardMetric.getMetricChartsCount()).toBe(3);
          expect(appAutoscaler.cardMetric.getMetricChartTitleText(2)).toContain('memoryused');
          expect(appAutoscaler.tableTriggers.getTableRowsCount()).toBe(3);
          expect(appAutoscaler.tableTriggers.getTableRowCellContent(2, 0)).toBe('memoryused');
          expect(appAutoscaler.tableTriggers.getTableRowCellContent(2, 1)).toBe('<=10MB for 120 secs.');
          expect(appAutoscaler.tableTriggers.getTableRowCellContent(2, 2)).toBe('-1 instances');

          expect(appAutoscaler.tableSchedules.getRecurringTableRowsCount()).toBe(0);
          expect(appAutoscaler.tableSchedules.getEmptyRecurringTableWarningText()).toBe('No recurring schedule.');
          expect(appAutoscaler.tableSchedules.getSpecificTableRowsCount()).toBe(1);
        }), 10000, 'Failed to wait for App Autoscaler Tab after edit policy'
      );
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
            // expect(appAutoscaler.cardStatus.getStatusToggleInput()).toBe('true');
            // expect(appAutoscaler.cardStatus.getStatusText()).toBe('Enabled');
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
        eventPageBase = appAutoscaler.tableEvents.clickGotoEventPage();
      });

      // This depends on scheduleStartDate1
      extendE2ETestTime(180000);

      /**
       * Find the required scaling event row via row count and row content
       * Row count is not enough on it's own as this can sometimes contain empty content
       */
      function findRow(): promise.Promise<boolean> {
        return eventPageBase.list.table.getRowCount().then(rowCount => {
          if (rowCount < 1) {
            return false;
          }
          eventPageBase.list.table.getTableDataRaw().then(e2e.debugLog);

          // Sometimes the first row can be full of empty values, so also confirm content
          return promise.all([
            eventPageBase.list.table.getCell(0, 2).getText(),
            eventPageBase.list.table.getCell(0, 4).getText()
          ]).then(([type, action]) => {
            return type === 'schedule' && action === '+1 instance(s) because limited by min instances 2';
          });
        });
      }

      function waitForRow() {
        const sub = timer(5000, 5000).pipe(
          switchMap(() => promise.all<boolean | number>([
            findRow(),
            eventPageBase.list.header.isRefreshing()
          ]))
        ).subscribe(([foundRow, isRefreshing]) => {
          // These console.logs help by
          // .. Showing the actual time we're checking, which can be compared with schedule start/end times
          // .. Showing when successful runs complete, over time this should show on average events take to show
          if (isRefreshing) {
            console.log(`${moment().toString()}: Waiting for event row: Skip actions... list is refreshing`);
            return;
          }
          if (foundRow) {
            console.log(`${moment().toString()}: Waiting for event row: Found row!`);
            sub.unsubscribe();
          } else {
            console.log(`${moment().toString()}: Waiting for event row: manually refreshing list`);
            eventPageBase.list.header.refresh();
          }
        });
        browser.wait(() => sub.closed);
      }

      it('Go to events page', () => {
        e2e.debugLog(`${loggingPrefix} Waiting For Autoscale Event Page`);
        eventPageBase.waitForPage();
        expect(eventPageBase.header.getTitleText()).toBe('AutoScaler Scaling Events: ' + testAppName);

        browser.waitForAngularEnabled().then(res => e2e.debugLog('browser.waitForAngularEnabled: ' + res));
        waitForRow();

        eventPageBase.header.clickIconButton('clear');
      });

      it('Should go to App Autoscaler Tab', () => {
        e2e.debugLog(`${loggingPrefix} Waiting For App Autoscaler Tab`);
        // Should be app autoscaler tab
        const appSummaryPage = new CFPage('/applications/');
        appSummaryPage.waitForPageOrChildPage();
        appSummaryPage.header.waitForTitleText(testAppName);
        browser.wait(ApplicationPageAutoscalerTab.detect()
          .then(appAutoscaler => {
            appAutoscaler.tableEvents.clickRefreshButton();
            expect(appAutoscaler.tableEvents.getTableRowsCount()).toBe(1);
            expect(appAutoscaler.tableEvents.getTableRowCellContent(0, 0)).toBe('Instances scaled up from 1 to 2');
            expect(appAutoscaler.tableEvents.getTableRowCellContent(0, 1))
              .toBe('schedule starts with instance min 2, instance max 10 and instance min initial 2 limited by min instances 2');
          }), 10000, 'Failed to wait for App Autoscaler Tab after view scaling events'
        );
      });
    });
  });

  describe('Autoscaler Detach Policy -', () => {
    let appAutoscaler: ApplicationPageAutoscalerTab;

    beforeAll(() => {
      appAutoscaler = new ApplicationPageAutoscalerTab(appDetails.cfGuid, appDetails.appGuid);
      appAutoscaler.goToAutoscalerTab();
    });

    it('Cancel detach action', () => {
      appAutoscaler.bannerAutoscalerTab.clickDeletePolicy();
      const confirm = new ConfirmDialogComponent();
      confirm.waitUntilShown();
      confirm.getMessage().then(message => {
        expect(message).toBeTruthy();
        expect(message).toBe('Are you sure you want to delete the policy?');
      });
      confirm.cancel();
      confirm.waitUntilNotShown();
      expect(appAutoscaler.bannerAutoscalerTab.getButtonsCount()).toBe(2);
      expect(appAutoscaler.bannerAutoscalerTab.getEditButtonExistence()).toBe(true);
      expect(appAutoscaler.bannerAutoscalerTab.getDeleteButtonExistence()).toBe(true);
    });

    it('Confirm detach action', () => {
      appAutoscaler.bannerAutoscalerTab.clickDeletePolicy();
      const confirm = new ConfirmDialogComponent();
      confirm.waitUntilShown();
      confirm.getMessage().then(message => {
        expect(message).toBeTruthy();
        expect(message).toBe('Are you sure you want to delete the policy?');
      });
      confirm.confirm();
      confirm.waitUntilNotShown();
      expect(appAutoscaler.bannerAutoscalerTab.getButtonsCount()).toBe(1);
      expect(appAutoscaler.bannerAutoscalerTab.getCreateButtonExistence()).toBe(true);
      expect(appAutoscaler.tableEvents.isDisplayed()).toBe(true);
      expect(appAutoscaler.tableEvents.getTableRowsCount()).toBe(1);
    });
  });

  afterAll(() => applicationE2eHelper.deleteApplication(null, { appName: testAppName }));

});
