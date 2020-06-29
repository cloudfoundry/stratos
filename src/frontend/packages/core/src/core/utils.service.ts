import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

export function getIdFromRoute(activatedRoute: ActivatedRoute, id: string) {
  if (activatedRoute.snapshot.params[id]) {
    return activatedRoute.snapshot.params[id];
  } else if (activatedRoute.parent) {
    return getIdFromRoute(activatedRoute.parent, id);
  }
  return null;
}

export const urlValidationExpression =
  '^' +
  // protocol identifier
  'http(s)?://' +
  // user:pass authentication
  '(?:\\S+(?::\\S*)?@)?' +
  '(?:' +
  // IP address exclusion
  // private & local networks
  '(?!(?:10|127)(?:\\.\\d{1,3}){3})' +
  '(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})' +
  '(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})' +
  // IP address dotted notation octets
  // excludes loopback network 0.0.0.0
  // excludes reserved space >= 224.0.0.0
  // excludes network & broadcast addresses
  // (first & last IP address of each class)
  '(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])' +
  '(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}' +
  '(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))' +
  '|' +
  // host name
  '(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)' +
  // domain name
  '(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*' +
  // TLD identifier
  '(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))' +
  // TLD may end with dot
  '\\.?' +
  ')' +
  // port number
  '(?::\\d{2,5})?' +
  // resource path
  '(?:[/?#]\\S*)?' +
  '$'
  ;

@Injectable()
export class UtilsService {

  private units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];

  /*
     * Expression used to validate URLs in the Endpoint registration form.
     * Expression explanation available from https://gist.github.com/dperini/729294
     * Passes the following criteria: https://mathiasbynens.be/demo/url-regex
     *
     */
  public urlValidationExpression = urlValidationExpression;

  constructor() { }

  precisionIfUseful(size: number, precision: number = 1) {
    const floored = Math.floor(size);
    const fixed = Number(size.toFixed(precision));
    if (floored === fixed) {
      return floored;
    }
    return fixed;
  }

  mbToHumanSize(mb: number): string {
    if (mb == null) {
      return '';
    }
    if (mb === -1) {
      return '∞';
    }
    if (mb >= 1048576) {
      return this.precisionIfUseful(mb / 1048576) + ' TB';
    }
    if (mb >= 1024) {
      return this.precisionIfUseful(mb / 1024) + ' GB';
    }
    return this.precisionIfUseful(mb) + ' MB';
  }

  bytesToHumanSize(value: string): string {
    const bytes = parseInt(value, 10);
    let retBytes = '';
    if (!bytes && bytes !== 0) {
      return '';
    }
    if (bytes === -1) {
      retBytes = '∞';
    }
    if (bytes >= 1099511627776) {
      retBytes = this.precisionIfUseful(bytes / 1099511627776) + ' TB';
    } else if (bytes >= 1073741824) {
      retBytes = this.precisionIfUseful(bytes / 1073741824) + ' GB';
    } else if (bytes >= 1048576) {
      retBytes = this.precisionIfUseful(bytes / 1048576) + ' MB';
    } else if (bytes >= 1024) {
      retBytes = this.precisionIfUseful(bytes / 1024) + ' kB';
    } else if (bytes >= 0) {
      retBytes = this.precisionIfUseful(bytes) + ' B';
    }
    return retBytes;
  }

  usageBytes(usage, usedPrecision?, totalPrecision?): string {
    const used = usage[0];
    const total = usage[1];

    if (isNaN(parseFloat(used)) || !isFinite(used) ||
      isNaN(parseFloat(total)) || !isFinite(total) ||
      total === 0) {
      return '-';
    }

    // Precision
    usedPrecision = this.getDefaultPrecision(usedPrecision);
    totalPrecision = this.getDefaultPrecision(totalPrecision);

    // Units
    const value = this.getNumber(total);
    let usedNumber = null;

    // Values to display
    const totalDisplay = this.getReducedValue(total, value).toFixed(totalPrecision);
    const usedValue = this.getReducedValue(used, value);
    let usedDisplay = usedValue.toFixed(totalPrecision);

    // Is the used value too small to be accurate (for instance 20M consumed of 1GB would show as 0 of 1GB)?
    if (used !== 0 && usedPrecision === 0 && usedValue < 1) {
      // Use the units relative to the used value instead of total (20MB of 1GB instead of 0 of 1GB)
      usedNumber = this.getNumber(used);
      usedDisplay = this.getReducedValue(used, usedNumber).toFixed(totalPrecision);
    }

    return usedDisplay + (usedNumber ? ' ' + this.units[usedNumber] : '') + ' / ' + totalDisplay + ' ' + this.units[value];
  }

  /**
   * @description format an uptime in seconds into a days, hours, minutes, seconds string
   * @param uptime in seconds
   * @returns formatted uptime string
   */
  formatUptime(uptime): string {
    if (uptime === undefined || uptime === null || isNaN(uptime)) {
      return '-';
    }

    if (uptime === 0) {
      return this.getFormattedTime(false, '0', 's');
    }
    const days = Math.floor(uptime / 86400);
    uptime = uptime % 86400;
    const hours = Math.floor(uptime / 3600);
    uptime = uptime % 3600;
    const minutes = Math.floor(uptime / 60);
    const seconds = uptime % 60;

    return (
      this.formatPart(days, 'd', 'd') +
      this.formatPart(hours, 'h', 'h') +
      this.formatPart(minutes, 'm', 'm') +
      this.formatPart(seconds, 's', 's')
    ).trim();
  }

  percent(value: number, decimals: number = 2): string {
    if (!value && value !== 0) {
      return '';
    }
    const val = (value * 100).toFixed(decimals);
    return val + '%';
  }

  private getReducedValue(value: number, multiplier: number): number {
    return (value / Math.pow(1024, Math.floor(multiplier)));
  }

  private getDefaultPrecision(precision: number): number {
    if (precision === undefined || precision === null) {
      precision = 0;
    }
    return precision;
  }

  private getNumber(value: number): number {
    return Math.floor(Math.log(value) / Math.log(1024));
  }

  private getFormattedTime(isPlural, value, unit): string {
    // i18n
    // const formatString = isPlural ? 'dateTime.plural.format' : 'dateTime.singular.format';
    // return $translate.instant(formatString, { value: value, unit: unit });
    return value + unit;
  }

  private formatPart(count, single, plural): string {
    if (count === 0) {
      return '';
    } else if (count === 1) {
      return this.getFormattedTime(false, count, single) + ' ';
    } else {
      return this.getFormattedTime(true, count, plural) + ' ';
    }
  }
}

/**
 * Return the value in the object for the given dot separated param path
 */
export function pathGet(path: string, object: any): any {
  const params = path.split('.');

  let index = 0;
  const length = params.length;

  while (object !== null && object !== undefined && index < length) {
    object = object[params[index++]];
  }
  return (index && index === length) ? object : undefined;
}

export function pathSet(path: string, object: any, value: any) {
  const params = path.split('.');

  let index = 0;
  const length = params.length - 1;

  while (object !== null && object !== undefined && index < length) {
    object = object[params[index++]];
  }
  if ((index && index === length)) {
    object[params[index++]] = value;
  }
}

export function safeStringToObj<T = object>(value: string): T {
  try {
    if (value) {
      const jsonObj = JSON.parse(value);
      // Check if jsonObj is actually an obj
      if (jsonObj.constructor !== {}.constructor) {
        throw new Error('not an object');
      }
      return jsonObj;
    }
  } catch (e) {
    return null;
  }
  return null;
}

export const safeUnsubscribe = (...subs: Subscription[]) => {
  subs.forEach(sub => {
    if (sub) {
      sub.unsubscribe();
    }
  });
};

export const truthyIncludingZero = (obj: any): boolean => !!obj || obj === 0;
export const truthyIncludingZeroString = (obj: any): string => truthyIncludingZero(obj) ? obj.toString() : null;

/**
 * Real basic, shallow check
 */
export const arraysEqual = (a: any[], b: any[]): boolean => {
  // Both falsy
  if (!a && !b) {
    return true;
  }
  // Both truthy
  if (a && b) {
    if (a.length !== b.length) {
      return false;
    }
    for (const vA of a) {
      if (!b.includes(vA)) {
        return false;
      }
    }
    return true;
  }
  // Falsy/Truthy
  return false;
};

export const createGuid = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    var r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
