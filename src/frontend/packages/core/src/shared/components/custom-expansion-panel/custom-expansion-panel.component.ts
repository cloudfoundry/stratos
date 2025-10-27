import { Component, Input, Output, EventEmitter, TemplateRef, ContentChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'mat-expansion-panel',
  templateUrl: './custom-expansion-panel.component.html',
  styleUrls: ['./custom-expansion-panel.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class CustomExpansionPanelComponent {
  @Input() disabled = false;
  @Input() expanded = false;
  @Input() hideToggle = false;
  @Input() togglePosition: 'before' | 'after' = 'before';
  
  @Output() opened = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();
  
  @ContentChild('header', { static: false }) headerTemplate: TemplateRef<any>;

  toggle() {
    if (this.disabled) return;
    
    this.expanded = !this.expanded;
    if (this.expanded) {
      this.opened.emit();
    } else {
      this.closed.emit();
    }
  }
}

@Component({
  selector: 'mat-expansion-panel-header',
  template: '<ng-content></ng-content>',
  styleUrls: ['./custom-expansion-panel.component.scss'],
  standalone: true
})
export class CustomExpansionPanelHeaderComponent {
  @Input() collapsedHeight = 'auto';
  @Input() expandedHeight = 'auto';
}