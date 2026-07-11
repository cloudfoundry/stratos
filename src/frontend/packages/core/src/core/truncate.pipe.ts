import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
name: 'limitTo',
standalone: true
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, args: string | number): string {
    const limit = args ? parseInt(String(args), 10) : 10;

    return value.length > limit ? value.substring(0, limit) : value;
  }
}
