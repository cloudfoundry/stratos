import { Directive, ElementRef, Input, OnChanges, inject } from '@angular/core';

@Directive({
selector: '[appBlur]',
standalone: true
})
export class BlurDirective implements OnChanges {
  @Input() appBlur!: boolean;

  private element = inject(ElementRef);

  public ngOnChanges() {
    if (this.appBlur) {
      this.blur();
    }
  }

  private blur() {
    setTimeout(() => this.element.nativeElement.blur(), 250);
  }
}
