import { Directive, ElementRef, Input, NgZone, type OnChanges, inject } from '@angular/core';

@Directive({
selector: '[appFocus]',
standalone: true
})
export class FocusDirective implements OnChanges {
  @Input() appFocus!: boolean;

  private element = inject(ElementRef);
  private ngZone = inject(NgZone);

  public ngOnChanges() {
    if (this.appFocus) {
      this.focus();
    }
  }

  private focus() {
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => this.element.nativeElement.focus(), 250);
    });
  }
}
