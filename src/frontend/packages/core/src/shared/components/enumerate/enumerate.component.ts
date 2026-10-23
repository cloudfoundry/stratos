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
  @Input() labelPath!: string;
}
