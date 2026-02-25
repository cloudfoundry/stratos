import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input  } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-enumerate',
  templateUrl: './enumerate.component.html',
  styleUrls: ['./enumerate.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnumerateComponent {
  @Input() collection!: Observable<any[]>;
  @Input() labelPath!: string;
}
