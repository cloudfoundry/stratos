
import { ChangeDetectionStrategy, Component, Input  } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntitySummaryTitleComponent {
  @Input() title?: string;
  @Input() subTitle?: string;
  @Input() info?: string;
  @Input() subText?: string;
  @Input()
  get imagePath(): string | null {
    return this.image;
  }
  set imagePath(image: string | null) {
    this.image = image;
  }
  @Input() fallBackIcon?: string;
  @Input() fallBackIconFont?: string;
  public image: string | null = null;

  public failedImageLoad() {
    if (this.fallBackIcon) {
      this.image = null;
    }
  }
}
