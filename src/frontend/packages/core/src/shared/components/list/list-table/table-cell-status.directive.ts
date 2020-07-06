import { Directive, ElementRef, Input, OnChanges, SimpleChanges, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appTableCellStatus]'
})
export class TableCellStatusDirective implements OnChanges {

  @Input() appTableCellStatus: string;

  constructor(private el: ElementRef, private renderer: Renderer2) {
  }

  ngOnChanges(changes: SimpleChanges) {
    const change = changes.appTableCellStatus;
    const oldClass = this.classForStatus(change.previousValue);
    const newClass = this.classForStatus(change.currentValue);

    if (!change.firstChange && change.previousValue && oldClass) {
      this.renderer.removeClass(this.el.nativeElement, oldClass);
    }
    if (newClass) {
      this.renderer.addClass(this.el.nativeElement, newClass);
    }
  }

  private classForStatus(status: string): string {
    switch (status) {
      case 'ok':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'error':
        return 'text-danger';
      case 'tentative':
        return 'text-tentative';
      default:
        return '';
    }
  }
}
