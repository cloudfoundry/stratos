import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-entity-summary-title',
  templateUrl: './entity-summary-title.component.html',
  styleUrls: ['./entity-summary-title.component.scss']
})
export class EntitySummaryTitleComponent {
  @Input() title: string;
  @Input() subTitle: string;
  @Input() info: string;
  @Input() subText: string;
  @Input() imagePath: string;
  @Input() inlineImagePath: string;
}
