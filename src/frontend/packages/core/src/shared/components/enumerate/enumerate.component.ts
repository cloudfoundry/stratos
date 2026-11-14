import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-enumerate',
  templateUrl: './enumerate.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnumerateComponent {
  readonly collection = input<any[] | null>();
  readonly labelPath = input<string>();
}
