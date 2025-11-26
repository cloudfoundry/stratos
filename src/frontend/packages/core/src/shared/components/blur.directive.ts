import { Directive, ElementRef, Input, NgZone, type OnChanges, inject } from '@angular/core';

@Directive({
selector: '[appBlur]',
standalone: true
})
export class BlurDirective implements OnChanges {
  @Input() appBlur!: boolean;

  private element = inject(ElementRef);
  private ngZone = inject(NgZone);

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
