import { Pipe, PipeTransform } from '@angular/core';

/*
 * Capitalize the first letter of the string
*/
@Pipe({
  name: 'capitalizeFirst'
})
export class CapitalizeFirstPipe implements PipeTransform {
  transform(text: string): string {
    if (!text) {
      return text;
    }
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}
