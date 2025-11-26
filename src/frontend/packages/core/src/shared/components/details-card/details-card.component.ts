
import { ChangeDetectionStrategy, Component, Input, type OnInit, ViewEncapsulation  } from '@angular/core';

@Component({
  selector: 'app-details-card',
  standalone: true,
  imports: [],
  templateUrl: './details-card.component.html',
  styleUrls: ['./details-card.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailsCardComponent implements OnInit {

  @Input()
  title!: string;

  @Input()
  busy!: boolean;

  ngOnInit() {
    // Component initialization
  }

}
