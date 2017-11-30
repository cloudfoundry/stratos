import { Injectable } from '@angular/core';

@Injectable()
export class UtilsService {

  /*
     * Expression used to validate URLs in the Endpoint registration form.
     * Expression explanation available from https://gist.github.com/dperini/729294
     * Passes the following criteria: https://mathiasbynens.be/demo/url-regex
     *
     */
  public urlValidationExpression =
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

  constructor() { }

  precisionIfUseful(size: number, precision?: number) {
    if (precision == null) {
      precision = 1;
    }
    const floored = Math.floor(size);
    const fixed = Number(size.toFixed(precision));
    if (floored === fixed) {
      return floored;
    }
    return fixed;
  }

  mbToHumanSize(mb: number) {
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

}
