import { ChangeDetectionStrategy, Component  } from '@angular/core';

@Component({
  selector: 'app-multiline-title',
  templateUrl: './multiline-title.component.html',
  styleUrls: ['./multiline-title.component.scss'],
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MultilineTitleComponent { }
