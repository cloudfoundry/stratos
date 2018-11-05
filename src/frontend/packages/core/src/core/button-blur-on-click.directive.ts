/* tslint:disable:directive-selector */
import { Directive, ElementRef, Renderer, HostListener } from '@angular/core';

@Directive({
  selector: 'button [mat-icon-button]'
})
export class ButtonBlurOnClickDirective {

  constructor(private elRef: ElementRef, private renderer: Renderer) { }

  @HostListener('click') onClick() {
    this.renderer.invokeElementMethod(this.elRef.nativeElement, 'blur', []);
  }
}
