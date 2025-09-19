import { Directive, HostListener } from '@angular/core';

@Directive({
selector: '[appClickStopPropagation]',
standalone: false
})
export class ClickStopPropagationDirective {
  @HostListener('click', ['$event'])
  public onClick(event: any) {
    event.stopPropagation();
  }
}
