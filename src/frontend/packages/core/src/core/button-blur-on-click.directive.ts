import { Directive, ElementRef, HostListener, inject, } from '@angular/core';

/* tslint:disable:directive-selector */

@Directive({
  selector: 'button [mat-icon-button]',
  standalone: true
})
export class ButtonBlurOnClickDirective {
  private elRef = inject(ElementRef);

  @HostListener('click') onClick() {
    this.elRef.nativeElement.blur();
  }
}
