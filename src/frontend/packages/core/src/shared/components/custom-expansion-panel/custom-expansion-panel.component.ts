import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, Output, EventEmitter, TemplateRef, ContentChild, inject } from '@angular/core';


@Component({
  selector: 'app-expansion-panel',
  template: `<div class="custom-expansion-panel"
  [class.expanded]="expanded"
  [class.disabled]="disabled"
  [class.toggle-before]="togglePosition === 'before'"
  [class.toggle-after]="togglePosition === 'after'">

  <div class="expansion-header" role="button" tabindex="0" (click)="toggle()" (keydown.enter)="toggle()" (keydown.space)="$event.preventDefault(); toggle()" [class.hide-toggle]="hideToggle">
    <ng-content select="app-expansion-panel-header"></ng-content>
    @if (!hideToggle) {
      <button class="toggle-button" [class.before]="togglePosition === 'before'" [class.after]="togglePosition === 'after'">
        <svg class="toggle-icon" [class.rotated]="expanded" viewBox="0 0 24 24" width="24" height="24">
          <path d="M7 10l5 5 5-5z"/>
        </svg>
      </button>
    }
  </div>

  <div class="expansion-content" [class.expanded]="expanded">
    <ng-content></ng-content>
  </div>
</div>`,
  styles: [`
.custom-expansion-panel {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin-bottom: 8px;
  overflow: hidden;

  &.disabled {
    opacity: 0.6;
    pointer-events: none;
  }
}

.expansion-header {
  display: flex;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  background-color: #fafafa;
  border-bottom: 1px solid transparent;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f5f5f5;
  }

  &.hide-toggle {
    cursor: default;

    &:hover {
      background-color: #fafafa;
    }
  }

  .toggle-before & {
    flex-direction: row;
  }

  .toggle-after & {
    flex-direction: row-reverse;
  }
}

.expansion-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;

  &.expanded {
    max-height: 1000px;
  }
}

.toggle-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;

  &.before {
    margin-left: 0;
    margin-right: 16px;
  }

  &.after {
    margin-left: auto;
    margin-right: 0;
  }
}

.toggle-icon {
  transition: transform 0.2s ease;
  fill: #666;

  &.rotated {
    transform: rotate(180deg);
  }
}
  `],
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomExpansionPanelComponent {
  private cdr = inject(ChangeDetectorRef);

  @Input() disabled = false;
  @Input() expanded = false;
  @Input() hideToggle = false;
  @Input() togglePosition: 'before' | 'after' = 'before';

  @Output() opened = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  @ContentChild('header', { static: false }) headerTemplate!: TemplateRef<any>;

  toggle() {
    if (this.disabled) return;

    this.expanded = !this.expanded;
    this.cdr.markForCheck();

    if (this.expanded) {
      this.opened.emit();
    } else {
      this.closed.emit();
    }
  }
}

@Component({
  selector: 'app-expansion-panel-header',
  template: '<ng-content></ng-content>',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomExpansionPanelHeaderComponent {
  @Input() collapsedHeight = 'auto';
  @Input() expandedHeight = 'auto';
}