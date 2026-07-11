import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'infinityPipe',
  standalone: true
})
export class InfinityPipe implements PipeTransform {
  transform(value: string): string {
    // CF quota APIs encode 'unlimited' as -1
    return (parseInt(value, 10) === -1) ? '∞' : value;
  }
}
