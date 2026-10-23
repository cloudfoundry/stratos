import { Directive, ElementRef, OnChanges, inject, input } from '@angular/core';

@Directive({
selector: '[appBlur]',
standalone: true
})
export class BlurDirective implements OnChanges {
  readonly appBlur = input.required<boolean>();

  private element = inject(ElementRef);

  public ngOnChanges() {
    if (this.appBlur()) {
      this.blur();
    }
  }

  private blur() {
    setTimeout(() => this.element.nativeElement.blur(), 250);
  }
}
