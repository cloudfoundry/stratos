import { Directive, Input, ElementRef, Renderer2, OnDestroy, HostListener, SecurityContext, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Directive({
  selector: '[matTooltip]',
  standalone: true
})
export class CustomTooltipDirective implements OnDestroy {
  private elementRef = inject(ElementRef);
  private renderer = inject(Renderer2);
  private sanitizer = inject(DomSanitizer);

  @Input('matTooltip') tooltipText: string = '';
  @Input('matTooltipPosition') position: 'above' | 'below' | 'left' | 'right' = 'above';
  // eslint-disable-next-line @angular-eslint/no-input-rename -- intentional: drop-in replacement for Angular Material's matTooltip; the matTooltipClass alias IS the public API
  @Input('matTooltipClass') tooltipClass: string = '';
  @Input('matTooltipShowDelay') showDelay: number = 250;
  @Input('matTooltipHideDelay') hideDelay: number = 100;
  @Input('matTooltipDisabled') disabled: boolean = false;

  private tooltipElement: HTMLElement | null = null;
  private showTimeout: any;
  private hideTimeout: any;

  @HostListener('mouseenter', ['$event'])
  onMouseEnter(_event: MouseEvent) {
    if (!this.disabled && this.tooltipText && this.tooltipText.trim()) {
      this.clearTimeouts();
      this.showTimeout = setTimeout(() => {
        this.showTooltip();
      }, this.showDelay);
    }
  }

  @HostListener('mouseleave', ['$event'])
  onMouseLeave(_event: MouseEvent) {
    this.clearTimeouts();
    this.hideTimeout = setTimeout(() => {
      this.hideTooltip();
    }, this.hideDelay);
  }

  private showTooltip() {
    if (this.tooltipElement) {
      this.hideTooltip();
    }

    const el = this.renderer.createElement('div');
    this.renderer.addClass(el, 'custom-tooltip');
    if (this.tooltipClass) {
      this.renderer.addClass(el, this.tooltipClass);
    }
    // Tooltips DO carry simple HTML markup (e.g. <b> for emphasis), so plain
    // textContent isn't an option. But tooltip text can also carry untrusted
    // values (e.g. CF usernames), and Renderer2.setProperty(innerHTML) bypasses
    // Angular's sanitizer. Run the value through DomSanitizer first: it keeps
    // the safe formatting subset (<b>, <strong>, <i>, <em>, <br>, …) while
    // stripping scripts, event handlers, and other XSS vectors.
    const safeHtml = this.sanitizer.sanitize(SecurityContext.HTML, this.tooltipText) ?? '';
    this.renderer.setProperty(el, 'innerHTML', safeHtml);

    // Apply visual styles BEFORE positioning so getBoundingClientRect()
    // measures the content-sized box. A bare `<div>` with no styling is
    // a 100%-wide block — measuring it first would have positioned the
    // tooltip relative to a viewport-wide rect (and the clamp would have
    // pinned it to the left edge of the screen, disconnected from the
    // host button).
    this.renderer.setStyle(el, 'position', 'fixed');
    this.renderer.setStyle(el, 'top', '-9999px');
    this.renderer.setStyle(el, 'left', '-9999px');
    this.renderer.setStyle(el, 'z-index', '10000');
    this.renderer.setStyle(el, 'pointer-events', 'none');
    this.renderer.setStyle(el, 'background-color', '#333');
    this.renderer.setStyle(el, 'color', 'white');
    this.renderer.setStyle(el, 'padding', '8px 12px');
    this.renderer.setStyle(el, 'border-radius', '4px');
    this.renderer.setStyle(el, 'font-size', '12px');
    this.renderer.setStyle(el, 'max-width', '200px');
    this.renderer.setStyle(el, 'word-wrap', 'break-word');
    this.renderer.setStyle(el, 'box-shadow', '0 2px 8px rgba(0,0,0,0.3)');

    this.tooltipElement = el;
    this.renderer.appendChild(document.body, el);

    this.positionTooltip();
  }

  private hideTooltip() {
    if (this.tooltipElement) {
      this.renderer.removeChild(document.body, this.tooltipElement);
      this.tooltipElement = null;
    }
  }

  private positionTooltip() {
    if (!this.tooltipElement) return;

    const hostRect = this.elementRef.nativeElement.getBoundingClientRect();
    const tooltipRect = this.tooltipElement.getBoundingClientRect();

    // Auto-flip when the preferred direction has no room. Pairs:
    // above↔below, left↔right. Falls back to the requested direction if
    // both sides are tight (the viewport-clamp logic below picks up the
    // pieces). 8px is the gap between host and tooltip (matches the
    // explicit `- 8` / `+ 8` offsets in the position calc).
    let pos = this.position;
    if (pos === 'above' && hostRect.top - tooltipRect.height - 8 < 8 &&
        hostRect.bottom + tooltipRect.height + 8 <= window.innerHeight - 8) {
      pos = 'below';
    } else if (pos === 'below' && hostRect.bottom + tooltipRect.height + 8 > window.innerHeight - 8 &&
        hostRect.top - tooltipRect.height - 8 >= 8) {
      pos = 'above';
    } else if (pos === 'left' && hostRect.left - tooltipRect.width - 8 < 8 &&
        hostRect.right + tooltipRect.width + 8 <= window.innerWidth - 8) {
      pos = 'right';
    } else if (pos === 'right' && hostRect.right + tooltipRect.width + 8 > window.innerWidth - 8 &&
        hostRect.left - tooltipRect.width - 8 >= 8) {
      pos = 'left';
    }

    let top = 0;
    let left = 0;

    switch (pos) {
      case 'above':
        top = hostRect.top - tooltipRect.height - 8;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
        break;
      case 'below':
        top = hostRect.bottom + 8;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.right + 8;
        break;
    }

    // Ensure tooltip stays within viewport
    top = Math.max(8, Math.min(top, window.innerHeight - tooltipRect.height - 8));
    left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));

    this.renderer.setStyle(this.tooltipElement, 'top', `${top}px`);
    this.renderer.setStyle(this.tooltipElement, 'left', `${left}px`);
  }

  private clearTimeouts() {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  ngOnDestroy() {
    this.clearTimeouts();
    this.hideTooltip();
  }
}