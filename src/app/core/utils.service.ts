import { Injectable } from '@angular/core';

@Injectable()
export class UtilsService {

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
