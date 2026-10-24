import {
  Directive, ElementRef, Renderer2, OnChanges, OnDestroy, HostListener, SecurityContext, inject, numberAttribute, input
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { setSanitizedHTML } from '../../../core/browser-helper';

let nextId = 0;

@Directive({
  selector: '[matTooltip]',
  // Material parity: templates use #ref="matTooltip"
  exportAs: 'matTooltip',
  standalone: true
})
export class CustomTooltipDirective implements OnChanges, OnDestroy {
  private elementRef = inject(ElementRef);
  private renderer = inject(Renderer2);
  private sanitizer = inject(DomSanitizer);

  readonly tooltipText = input<string>('', { alias: "matTooltip" });
  readonly position = input<'above' | 'below' | 'left' | 'right'>('above', { alias: "matTooltipPosition" });
  // eslint-disable-next-line @angular-eslint/no-input-rename -- intentional: drop-in replacement for Angular Material's matTooltip; the matTooltipClass alias IS the public API
  readonly tooltipClass = input<string>('', { alias: "matTooltipClass" });
  // Coerce attribute-form values (matTooltipShowDelay="1000") like Material did
  readonly showDelay = input<number, unknown>(250, { alias: "matTooltipShowDelay", transform: numberAttribute });
  readonly hideDelay = input<number, unknown>(100, { alias: "matTooltipHideDelay", transform: numberAttribute });
  readonly disabled = input<boolean>(false, { alias: "matTooltipDisabled" });

  private tooltipElement: HTMLElement | null = null;
  private readonly tooltipId = `custom-tooltip-${nextId++}`;
  private showTimeout: any;
  private hideTimeout: any;
  private tooltipUnlisteners: (() => void)[] = [];
  // The tooltip stays while either holds (WCAG 2.2 SC 1.4.13 "persistent").
  // Hovering covers the tooltip itself as well as the host, so the pointer
  // can move onto the tooltip ("hoverable").
  private hovering = false;
  private focused = false;

  ngOnChanges() {
    // The tooltip no longer has anything valid to say
    if (!this.canShow()) {
      this.clearTimeouts();
      this.hideTooltip();
    }
  }

  @HostListener('mouseenter', ['$event'])
  onMouseEnter(_event: MouseEvent) {
    this.hovering = true;
    this.scheduleShow();
  }

  @HostListener('mouseleave', ['$event'])
  onMouseLeave(_event: MouseEvent) {
    this.hovering = false;
    this.scheduleHide();
  }

  // Clicking the host usually opens a menu/dialog — don't leave the tooltip
  // hanging over it.
  @HostListener('mousedown')
  onMouseDown() {
    this.clearTimeouts();
    this.hideTooltip();
  }

  // focusin/focusout bubble, so a host that wraps a focusable control (a
  // span around a button) shows the tooltip for that control too. Only
  // :focus-visible focus counts: a mouse click also focuses a button, but
  // the click already dismissed the tooltip and usually opens a menu.
  @HostListener('focusin', ['$event'])
  onFocusIn(event: FocusEvent) {
    if (!(event.target instanceof Element) || !event.target.matches(':focus-visible')) {
      return;
    }
    this.focused = true;
    this.scheduleShow();
  }

  @HostListener('focusout', ['$event'])
  onFocusOut(event: FocusEvent) {
    // Focus moving between controls inside the host is not leaving it
    if (event.relatedTarget instanceof Node && this.elementRef.nativeElement.contains(event.relatedTarget)) {
      return;
    }
    this.focused = false;
    this.scheduleHide();
  }

  // Chrome does not fire mouseleave when the hovered element moves or changes
  // under the pointer (menu opening, layout shift), which left tooltips stuck
  // open until the pointer happened to re-cross the host. While a tooltip is
  // visible, watch pointer movement at the document level and hide as soon as
  // the pointer is outside the host and the tooltip. A pending hide means
  // mouseleave did fire and the pointer may be crossing the gap onto the
  // tooltip, so that hide is left to run (or be cancelled) on its own.
  private onDocumentMouseMove = (event: MouseEvent) => {
    const target = event.target as Node;
    if (this.elementRef.nativeElement.contains(target) || this.tooltipElement?.contains(target)) {
      return;
    }
    this.hovering = false;
    if (!this.focused && !this.hideTimeout) {
      this.clearTimeouts();
      this.hideTooltip();
    }
  };

  // Escape dismisses the tooltip without moving focus or the pointer
  // (SC 1.4.13 "dismissible"). It listens on the document because a hover
  // tooltip's host is often not the focused element. The key is consumed,
  // as Material's tooltip did, so the same press does not also close the
  // dialog or menu the host sits in.
  private onDocumentKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.clearTimeouts();
      this.hideTooltip();
    }
  };

  private canShow(): boolean {
    const text = this.tooltipText();
    return !this.disabled() && !!text && !!text.trim();
  }

  private scheduleShow() {
    this.clearTimeouts();
    // Already showing (pointer back on the host, focus while hovered):
    // keep it rather than rebuilding it after another show delay
    if (this.tooltipElement || !this.canShow()) {
      return;
    }
    this.showTimeout = setTimeout(() => {
      this.showTooltip();
    }, this.showDelay());
  }

  private scheduleHide() {
    if (this.hovering || this.focused) {
      return;
    }
    this.clearTimeouts();
    this.hideTimeout = setTimeout(() => {
      this.hideTooltip();
    }, this.hideDelay());
  }

  private showTooltip() {
    if (this.tooltipElement) {
      this.hideTooltip();
    }

    const el = this.renderer.createElement('div');
    this.renderer.addClass(el, 'custom-tooltip');
    const tooltipClass = this.tooltipClass();
    if (tooltipClass) {
      this.renderer.addClass(el, tooltipClass);
    }
    // Tooltips DO carry simple HTML markup (e.g. <b> for emphasis), so plain
    // textContent isn't an option. But tooltip text can also carry untrusted
    // values (e.g. CF usernames), and Renderer2.setProperty(innerHTML) bypasses
    // Angular's sanitizer. Run the value through DomSanitizer first: it keeps
    // the safe formatting subset (<b>, <strong>, <i>, <em>, <br>, …) while
    // stripping scripts, event handlers, and other XSS vectors.
    // Renderer2.setProperty('innerHTML') is an injection sink, so it is refused
    // outright under require-trusted-types-for; the sanitized value is a plain
    // string, because DomSanitizer.sanitize ends in .toString(). The sanitize
    // call stays because it is what protects the innerHTML fallback inside
    // setSanitizedHTML, on browsers that have no setHTML of their own.
    const safeHtml = this.sanitizer.sanitize(SecurityContext.HTML, this.tooltipText()) ?? '';
    setSanitizedHTML(el, safeHtml);

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
    this.renderer.setStyle(el, 'background-color', '#333');
    this.renderer.setStyle(el, 'color', 'white');
    this.renderer.setStyle(el, 'padding', '8px 12px');
    this.renderer.setStyle(el, 'border-radius', '4px');
    this.renderer.setStyle(el, 'font-size', '12px');
    this.renderer.setStyle(el, 'max-width', '200px');
    this.renderer.setStyle(el, 'word-wrap', 'break-word');
    this.renderer.setStyle(el, 'box-shadow', '0 2px 8px rgba(0,0,0,0.3)');

    // Screen readers announce the tooltip as the host's description
    this.renderer.setAttribute(el, 'role', 'tooltip');
    this.renderer.setAttribute(el, 'id', this.tooltipId);
    this.setDescribedBy(true);

    // The tooltip takes the pointer (no pointer-events: none), so the user can
    // move onto it to read it, and it stays until the pointer leaves it too
    this.tooltipUnlisteners = [
      this.renderer.listen(el, 'mouseenter', () => {
        this.hovering = true;
        this.clearTimeouts();
      }),
      this.renderer.listen(el, 'mouseleave', () => {
        this.hovering = false;
        this.scheduleHide();
      }),
    ];

    this.tooltipElement = el;
    this.renderer.appendChild(document.body, el);
    document.addEventListener('mousemove', this.onDocumentMouseMove, true);
    document.addEventListener('keydown', this.onDocumentKeyDown, true);

    this.positionTooltip();
  }

  private hideTooltip() {
    document.removeEventListener('mousemove', this.onDocumentMouseMove, true);
    document.removeEventListener('keydown', this.onDocumentKeyDown, true);
    if (this.tooltipElement) {
      this.tooltipUnlisteners.forEach(unlisten => unlisten());
      this.tooltipUnlisteners = [];
      this.setDescribedBy(false);
      this.renderer.removeChild(document.body, this.tooltipElement);
      this.tooltipElement = null;
    }
  }

  // Add or remove the tooltip's id in the host's aria-describedby, keeping
  // any ids the host's template already put there
  private setDescribedBy(shown: boolean) {
    const host: HTMLElement = this.elementRef.nativeElement;
    const ids = (host.getAttribute('aria-describedby') ?? '').split(/\s+/)
      .filter(id => id && id !== this.tooltipId);
    if (shown) {
      ids.push(this.tooltipId);
    }
    if (ids.length) {
      this.renderer.setAttribute(host, 'aria-describedby', ids.join(' '));
    } else {
      this.renderer.removeAttribute(host, 'aria-describedby');
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
    let pos = this.position();
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