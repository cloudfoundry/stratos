import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { CustomTooltipDirective } from '@stratosui/core';

// Renders a value that may be in one of three states across the V2→V3
// migration:
//   known      — `value` is set; render as-is
//   known-empty — `value` is null/undefined and `unavailable` is false; render `emptyText`
//   unavailable — `unavailable` is true; render "Not Available" + tooltip
//
// `unavailable` is the authoritative signal (per StratosMeta.unavailable).
// Consumers pass `_meta?.unavailable?.includes('fieldName')`.
@Component({
  selector: 'app-tristate-value',
  templateUrl: './tristate-value.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CustomTooltipDirective],
})
export class TristateValueComponent {
  @Input() value: string | number | null | undefined;
  @Input() unavailable: boolean | undefined = false;
  @Input() unavailableTooltip = 'Not exposed by V3 API';
  @Input() emptyText = '';
}
