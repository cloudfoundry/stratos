import { Directive, ElementRef, OnDestroy, inject, output } from '@angular/core';

@Directive({
  selector: '[appMarkdownContentObserver]',
  standalone: true
})
export class MarkdownContentObserverDirective implements OnDestroy {
  private observer: MutationObserver;
  readonly innerHtmlRendered = output();

  private el = inject(ElementRef);

  constructor() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation, _index) => {
        if (mutation.type === 'childList') {
          this.innerHtmlRendered.emit();
        }
      });
    });
    this.observer.observe(
      this.el.nativeElement,
      { attributes: true, childList: true, characterData: true }
    );
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
