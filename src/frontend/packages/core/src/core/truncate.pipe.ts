import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'limitTo'
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, args: string): string {
    const limit = args ? parseInt(args, 10) : 10;

    return value.length > limit ? value.substring(0, limit) : value;
  }
}
