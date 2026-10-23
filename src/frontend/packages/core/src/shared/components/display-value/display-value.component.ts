import { ChangeDetectionStrategy, Component, Input, input } from '@angular/core';


@Component({
  selector: 'app-display-value',
  templateUrl: './display-value.component.html',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DisplayValueComponent {

  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input() label!: string;
  readonly value = input.required<string>();

  constructor() { }
}
