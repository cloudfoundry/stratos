import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'bytesToHumanSize',
  standalone: true
})
export class BytesToHumanSize implements PipeTransform {
  transform(value: string): string {
    // Handle null/undefined/empty string
    if (value == null || value === '') {
      return '';
    }

    const bytes = parseInt(value, 10);

    // Type guard: ensure parsing succeeded
    if (isNaN(bytes)) {
      return '';
    }

    // Special case: unlimited
    if (bytes === -1) {
      return '∞';
    }

    // Ensure non-negative for size calculations
    if (bytes < 0) {
      return '';
    }

    // Calculate appropriate unit
    if (bytes >= 1099511627776) {
      return precisionIfUseful(bytes / 1099511627776) + ' TB';
    } else if (bytes >= 1073741824) {
      return precisionIfUseful(bytes / 1073741824) + ' GB';
    } else if (bytes >= 1048576) {
      return precisionIfUseful(bytes / 1048576) + ' MB';
    } else if (bytes >= 1024) {
      return precisionIfUseful(bytes / 1024) + ' kB';
    } else {
      return precisionIfUseful(bytes) + ' B';
    }
  }
}

function precisionIfUseful(size: number, precision: number = 1): number {
  // Type guard: ensure size is a valid number
  if (size == null || typeof size !== 'number' || !isFinite(size)) {
    return 0;
  }

  const floored = Math.floor(size);
  const fixed = Number(size.toFixed(precision));
  if (floored === fixed) {
    return floored;
  }
  return fixed;
}

@Pipe({
  name: 'MbToHumanSize',
  standalone: true
})
export class MegaBytesToHumanSize implements PipeTransform {
  transform(value: string): string {
    // Handle null/undefined/empty string
    if (value == null || value === '') {
      return '';
    }

    const mbs = parseInt(value, 10);

    // Type guard: ensure parsing succeeded
    if (isNaN(mbs)) {
      return '';
    }

    // Special case: unlimited
    if (mbs === -1) {
      return '∞';
    }

    // Ensure non-negative for size calculations
    if (mbs < 0) {
      return '';
    }

    // Calculate appropriate unit
    if (mbs >= 1048576) {
      return precisionIfUseful(mbs / 1048576) + ' TB';
    } else if (mbs >= 1024) {
      return precisionIfUseful(mbs / 1024) + ' GB';
    } else {
      return precisionIfUseful(mbs) + ' MB';
    }
  }
}
