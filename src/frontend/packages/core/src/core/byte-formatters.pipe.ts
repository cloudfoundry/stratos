import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'bytesToHumanSize'
})
export class BytesToHumanSize implements PipeTransform {
  transform(value: string): string {
    const bytes = parseInt(value, 10);

    let retBytes = '';
    if (!bytes && bytes !== 0) {
      return '';
    }
    if (bytes === -1) {
      retBytes = '∞';
    }
    if (bytes >= 1099511627776) {
      retBytes = precisionIfUseful(bytes / 1099511627776) + ' TB';
    } else if (bytes >= 1073741824) {
      retBytes = precisionIfUseful(bytes / 1073741824) + ' GB';
    } else if (bytes >= 1048576) {
      retBytes = precisionIfUseful(bytes / 1048576) + ' MB';
    } else if (bytes >= 1024) {
      retBytes = precisionIfUseful(bytes / 1024) + ' kB';
    } else if (bytes >= 0) {
      retBytes = precisionIfUseful(bytes) + ' B';
    }
    return retBytes;
  }
}

function precisionIfUseful(size, precision = 1) {
  const floored = Math.floor(size);
  const fixed = Number(size.toFixed(precision));
  if (floored === fixed) {
    return floored;
  }
  return fixed;
}

@Pipe({
  name: 'MbToHumanSize'
})
export class MegaBytesToHumanSize implements PipeTransform {
  transform(value: string): string {
    const mbs = parseInt(value, 10);
    let mbsStr = '';
    if (!mbs && mbs !== 0) {
      mbsStr = '';
    } else if (mbs === -1) {
      mbsStr = '∞';
    } else if (mbs >= 1048576) {
      mbsStr = precisionIfUseful(mbs / 1048576) + ' TB';
    } else if (mbs >= 1024) {
      mbsStr = precisionIfUseful(mbs / 1024) + ' GB';
    } else {
      mbsStr = precisionIfUseful(mbs) + ' MB';
    }
    return mbsStr;
  }
}
