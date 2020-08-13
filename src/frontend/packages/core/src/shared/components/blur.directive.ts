import { Directive, ElementRef, Inject, Input, NgZone, OnChanges } from '@angular/core';

@Directive({
  selector: '[appBlur]'
})
export class BlurDirective implements OnChanges {
  @Input() appBlur: boolean;

  constructor(@Inject(ElementRef) private element: ElementRef, private ngZone: NgZone) { }

  public ngOnChanges() {
    if (this.appBlur) {
      this.blur();
    }
  }

  private blur() {
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => this.element.nativeElement.blur(), 250);
    });
  }
}
