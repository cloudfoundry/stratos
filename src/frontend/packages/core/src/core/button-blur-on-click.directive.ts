import { Directive, ElementRef, HostListener, inject, Renderer2 } from '@angular/core';

/* tslint:disable:directive-selector */

@Directive({
  selector: 'button [mat-icon-button]',
  standalone: true
})
export class ButtonBlurOnClickDirective {
  private elRef = inject(ElementRef);
  private renderer = inject(Renderer2);

  @HostListener('click') onClick() {
    this.elRef.nativeElement.blur();
  }
}
