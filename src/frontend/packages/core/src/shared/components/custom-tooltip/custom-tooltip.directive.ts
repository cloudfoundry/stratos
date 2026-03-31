import { Directive, Input, ElementRef, Renderer2, OnDestroy, HostListener, inject } from '@angular/core';

@Directive({
  selector: '[matTooltip]',
  standalone: true
})
export class CustomTooltipDirective implements OnDestroy {
  private elementRef = inject(ElementRef);
  private renderer = inject(Renderer2);

  @Input('matTooltip') tooltipText: string = '';
  @Input('matTooltipPosition') position: 'above' | 'below' | 'left' | 'right' = 'above';
  @Input('matTooltipClass') tooltipClass: string = '';
  @Input('matTooltipShowDelay') showDelay: number = 500;
  @Input('matTooltipHideDelay') hideDelay: number = 100;
  @Input('matTooltipDisabled') disabled: boolean = false;

  private tooltipElement: HTMLElement | null = null;
  private showTimeout: any;
  private hideTimeout: any;

  @HostListener('mouseenter', ['$event'])
  onMouseEnter(event: MouseEvent) {
    if (!this.disabled && this.tooltipText && this.tooltipText.trim()) {
      this.clearTimeouts();
      this.showTimeout = setTimeout(() => {
        this.showTooltip();
      }, this.showDelay);
    }
  }

  @HostListener('mouseleave', ['$event'])
  onMouseLeave(event: MouseEvent) {
    this.clearTimeouts();
    this.hideTimeout = setTimeout(() => {
      this.hideTooltip();
    }, this.hideDelay);
  }

  private showTooltip() {
    if (this.tooltipElement) {
      this.hideTooltip();
    }

    this.tooltipElement = this.renderer.createElement('div');
    this.renderer.addClass(this.tooltipElement, 'custom-tooltip');
    if (this.tooltipClass) {
      this.renderer.addClass(this.tooltipElement, this.tooltipClass);
    }

    this.renderer.setProperty(this.tooltipElement, 'innerHTML', this.tooltipText);
    this.renderer.appendChild(document.body, this.tooltipElement);

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

    let top = 0;
    let left = 0;

    switch (this.position) {
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

    this.renderer.setStyle(this.tooltipElement, 'position', 'fixed');
    this.renderer.setStyle(this.tooltipElement, 'top', `${top}px`);
    this.renderer.setStyle(this.tooltipElement, 'left', `${left}px`);
    this.renderer.setStyle(this.tooltipElement, 'z-index', '1000');
    this.renderer.setStyle(this.tooltipElement, 'background-color', '#333');
    this.renderer.setStyle(this.tooltipElement, 'color', 'white');
    this.renderer.setStyle(this.tooltipElement, 'padding', '8px 12px');
    this.renderer.setStyle(this.tooltipElement, 'border-radius', '4px');
    this.renderer.setStyle(this.tooltipElement, 'font-size', '12px');
    this.renderer.setStyle(this.tooltipElement, 'max-width', '200px');
    this.renderer.setStyle(this.tooltipElement, 'word-wrap', 'break-word');
    this.renderer.setStyle(this.tooltipElement, 'box-shadow', '0 2px 8px rgba(0,0,0,0.3)');
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