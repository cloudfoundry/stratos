import { ChangeDetectionStrategy, Component, input } from '@angular/core';


@Component({
  selector: 'app-display-value',
  templateUrl: './display-value.component.html',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DisplayValueComponent {

  readonly label = input<string>();
  readonly value = input<string>();

  constructor() { }
}
