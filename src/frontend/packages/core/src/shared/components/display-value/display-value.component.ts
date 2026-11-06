import { ChangeDetectionStrategy, Component, Input  } from '@angular/core';


@Component({
  selector: 'app-display-value',
  templateUrl: './display-value.component.html',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DisplayValueComponent {

  @Input() label!: string;
  @Input() value!: string;

  constructor() { }
}
