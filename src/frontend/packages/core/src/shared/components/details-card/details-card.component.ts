
import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation, input } from '@angular/core';

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

  constructor() { }

  readonly title = input.required<string>();

  readonly busy = input.required<boolean>();

  ngOnInit() {
  }

}
