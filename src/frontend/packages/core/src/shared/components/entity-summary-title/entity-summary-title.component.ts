
import { Component, Input } from '@angular/core';
import { CustomTooltipDirective } from '../custom-tooltip/custom-tooltip.directive';
import { CustomIconComponent } from '../custom-material/custom-material.component';

@Component({
  selector: 'app-entity-summary-title',
  standalone: true,
  imports: [
    CustomIconComponent,
    CustomTooltipDirective
],
  templateUrl: './entity-summary-title.component.html',
  styleUrls: ['./entity-summary-title.component.scss']
})
export class EntitySummaryTitleComponent {
  @Input() title: string;
  @Input() subTitle: string;
  @Input() info: string;
  @Input() subText: string;
  @Input()
  get imagePath(): string {
    return this.image;
  }
  set imagePath(image: string) {
    this.image = image;
  }
  @Input() fallBackIcon: string;
  @Input() fallBackIconFont: string;
  public image: string;

  public failedImageLoad() {
    if (this.fallBackIcon) {
      this.image = null;
    }
  }
}
