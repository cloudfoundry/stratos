import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
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
  readonly checked = input<boolean | null>(false);
  readonly disabled = input(false);
  readonly label = input('');
  readonly tooltip = input('');

  /** Emits the new explicit boolean when the user toggles the checkbox. */
  readonly toggled = output<boolean>();

  onChange(next: boolean): void {
    if (this.disabled()) {
      return;
    }
    this.toggled.emit(next);
  }
}
