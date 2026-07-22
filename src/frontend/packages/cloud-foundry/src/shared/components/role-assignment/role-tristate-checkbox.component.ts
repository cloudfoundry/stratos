import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CustomCheckboxComponent, CustomTooltipDirective } from '@stratosui/core';

/**
 * Purely presentational tri-state role checkbox cell.
 *
 * Renders a checked/unchecked/indeterminate checkbox and emits the new
 * explicit boolean on toggle.  Holds NO dependency on CfRolesService or
 * CfUsersRolesDataService — all state flows in via @Input() and events
 * flow out via @Output().
 */
@Component({
  selector: 'app-role-tristate-checkbox',
  standalone: true,
  templateUrl: './role-tristate-checkbox.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CustomCheckboxComponent, CustomTooltipDirective],
})
export class RoleTristateCheckboxComponent {
  /** true = checked, false = unchecked, null = indeterminate */
  @Input() checked: boolean | null = false;
  @Input() disabled = false;
  @Input() label = '';
  @Input() tooltip = '';

  /** Emits the new explicit boolean when the user toggles the checkbox. */
  @Output() toggled = new EventEmitter<boolean>();

  onChange(next: boolean): void {
    if (this.disabled) {
      return;
    }
    this.toggled.emit(next);
  }
}
