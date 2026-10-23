import { Directive, ElementRef, OnChanges, inject, input } from '@angular/core';

@Directive({
selector: '[appFocus]',
standalone: true
})
export class FocusDirective implements OnChanges {
  readonly appFocus = input.required<boolean>();

  private element = inject(ElementRef);

  public ngOnChanges() {
    if (this.appFocus()) {
      this.focus();
    }
  }

  private focus() {
    setTimeout(() => this.element.nativeElement.focus(), 250);
  }
}
