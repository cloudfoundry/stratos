import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'bytesToHumanSize'
})
export class BytesToHumanSize implements PipeTransform {
  transform(value: string): string {

    const bytes = parseInt(value, 10);

    let retBytes = '';
    if (!bytes && bytes !== 0) {
      retBytes = '';
    }
    if (bytes === -1) {
      retBytes = '∞';
    }
    if (bytes >= 1099511627776) {
      retBytes = precisionIfUseful(bytes / 1099511627776) + ' TB';
    }
    if (bytes >= 1073741824) {
      retBytes = precisionIfUseful(bytes / 1073741824) + ' GB';
    }
    if (bytes >= 1048576) {
      retBytes = precisionIfUseful(bytes / 1048576) + ' MB';
    }
    if (bytes >= 1024) {
      retBytes = precisionIfUseful(bytes / 1024) + ' kB';
    }

    if (retBytes !== ''){
      return retBytes;
    } else {
      return precisionIfUseful(bytes) + ' B';
    }
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
    if (!mbs && mbs !== 0) {
      return '';
    }
    if (mbs === -1) {
      return '∞';
    }
    if (mbs >= 1048576) {
      return precisionIfUseful(mbs / 1048576) + ' TB';
    }
    if (mbs >= 1024) {
      return precisionIfUseful(mbs / 1024) + ' GB';
    }
    return precisionIfUseful(mbs) + ' MB';
  }
}
