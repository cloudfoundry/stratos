import { Directive, ElementRef, EventEmitter, Output, type OnDestroy, NgZone, inject } from '@angular/core';

@Directive({
  selector: '[appMarkdownContentObserver]',
  standalone: true
})
export class MarkdownContentObserverDirective implements OnDestroy {
  private observer: MutationObserver;
  @Output() innerHtmlRendered = new EventEmitter();

  private ngZone = inject(NgZone);
  private el = inject(ElementRef);

  constructor() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation, _index) => {
        if (mutation.type === 'childList') {
          this.ngZone.runOutsideAngular(() => {
            this.innerHtmlRendered.emit();
          });
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
