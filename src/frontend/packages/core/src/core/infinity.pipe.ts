import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
name: 'infinityPipe',
standalone: false
})
export class InfinityPipe implements PipeTransform {
  transform(value: string): string {
    return (parseInt(value, 10) === -1) ? '∞' : value;
  }
}
