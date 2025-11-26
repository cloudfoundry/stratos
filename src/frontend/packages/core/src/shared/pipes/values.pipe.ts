import { Pipe, type PipeTransform } from '@angular/core';

@Pipe({
name: 'values', pure: false,
 standalone: true
})
export class ValuesPipe implements PipeTransform {
  transform(value: Record<string, unknown>, _args: unknown[] = []): Array<{ key: string; value: unknown }> {
    return Object.keys(value).map(key => {
      return {
        key,
        value: value[key]
      };
    });
  }
}
