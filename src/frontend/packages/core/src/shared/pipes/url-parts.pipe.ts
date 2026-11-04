import { Pipe, PipeTransform } from '@angular/core';

/**
 * Splits an address after each dot and slash, so a template can put a <wbr>
 * between the parts: a long address then wraps between host labels instead of
 * mid-word, and copying the text still gives the plain address. The template
 * has to draw the <wbr> itself, as the console's Trusted Types policy rules out
 * setting it as an HTML string.
 */
@Pipe({
  name: 'urlParts',
  standalone: true,
})
export class UrlPartsPipe implements PipeTransform {
  transform(url: string | null | undefined): string[] {
    // The (?!/) keeps the two slashes of the scheme together.
    return url ? url.split(/(?<=[./])(?!\/)/) : [];
  }
}
