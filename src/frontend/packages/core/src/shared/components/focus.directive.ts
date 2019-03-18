import { Directive, ElementRef, Inject, Input, NgZone, OnChanges } from '@angular/core';

@Directive({
  selector: '[appFocus]'
})
export class FocusDirective implements OnChanges {
  @Input() appFocus: boolean;

  constructor(@Inject(ElementRef) private element: ElementRef, private ngZone: NgZone) { }

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
