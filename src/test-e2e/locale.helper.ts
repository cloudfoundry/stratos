import moment from 'moment';
import { browser, promise } from 'protractor';

export class LocaleHelper {
  constructor() {
  }

  private getLocale(): promise.Promise<string> {
    return browser.executeScript('return window.navigator.userLanguage || window.navigator.language');
  }

  public getWindowLocaleData(): promise.Promise<moment.Locale> {
    return this.getLocale().then((wLocale: string) => {
      moment.locale(wLocale);
      return moment.localeData();
    });
  }

  public getWindowDateTimeFormats(): promise.Promise<{ timeFormat: string, dateFormat: string }> {
    return this.getWindowLocaleData().then(localeData => ({
      timeFormat: localeData.longDateFormat('LT'), // 'HH:mm' for uk, alt value 'hh:mm A'
      dateFormat: localeData.longDateFormat('L') // 'DD/MM/YYYY' for uk, alt value 'YYYY/MM/DD'
    }));
  }
}
