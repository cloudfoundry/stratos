import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, input } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-enumerate',
  templateUrl: './enumerate.component.html',
  standalone: true,
  imports: [
    CommonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnumerateComponent {
  readonly collection = input<Observable<any[]>>();
  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input() labelPath!: string;
}
