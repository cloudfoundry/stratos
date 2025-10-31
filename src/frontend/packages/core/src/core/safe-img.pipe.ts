import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'safeImg',
  standalone: true
})
export class SafeImgPipe implements PipeTransform {

  private sanitizer = inject(DomSanitizer);

  transform(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

}
