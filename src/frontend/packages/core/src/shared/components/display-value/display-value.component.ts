import { ChangeDetectionStrategy, Component, Input, input } from '@angular/core';


@Component({
  selector: 'app-display-value',
  templateUrl: './display-value.component.html',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DisplayValueComponent {

  @Input() label?: string;
  readonly value = input<string>();

  constructor() { }
}
