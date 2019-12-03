/* tslint:disable:directive-selector */
import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: 'button [mat-icon-button]'
})
export class ButtonBlurOnClickDirective {

  constructor(private elRef: ElementRef, private renderer: Renderer2) { }

  @HostListener('click') onClick() {
    this.elRef.nativeElement.blur();
  }
}
