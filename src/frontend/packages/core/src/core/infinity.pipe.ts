import { Pipe, PipeTransform } from '@angular/core';

import { isUnlimited } from './cf-quota.types';

@Pipe({
  name: 'infinityPipe',
  standalone: true
})
export class InfinityPipe implements PipeTransform {
  transform(value: string): string {
    return isUnlimited(parseInt(value, 10)) ? '∞' : value;
  }
}
