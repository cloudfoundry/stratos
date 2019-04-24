import { Directive, ElementRef, EventEmitter, Output, OnDestroy, NgZone } from '@angular/core';

@Directive({
  selector: '[appMarkdownContentObserver]'
})
export class MarkdownContentObserverDirective implements OnDestroy {
  private observer: MutationObserver;
  @Output() innerHtmlRendered = new EventEmitter();

  constructor(private ngZone: NgZone, private el: ElementRef) {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation, index) => {
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
