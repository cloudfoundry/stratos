import { Directive, ElementRef, Input, OnChanges, inject } from '@angular/core';

@Directive({
selector: '[appFocus]',
standalone: true
})
export class FocusDirective implements OnChanges {
  @Input() appFocus!: boolean;

  private element = inject(ElementRef);

  public ngOnChanges() {
    if (this.appFocus) {
      this.focus();
    }
  }

  private focus() {
    setTimeout(() => this.element.nativeElement.focus(), 250);
  }
}
