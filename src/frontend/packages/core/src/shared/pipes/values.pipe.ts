import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
name: 'values', pure: false,
 standalone: true
})
export class ValuesPipe implements PipeTransform {
  transform(value: any, _args?: any[]): any {
    return Object.keys(value).map(key => {
      return {
        key,
        value: value[key]
      };
    });
  }
}
