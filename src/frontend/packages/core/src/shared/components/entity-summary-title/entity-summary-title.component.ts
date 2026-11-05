
import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';
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
  readonly title = input<string>();
  readonly subTitle = input<string>();
  readonly info = input<string>();
  readonly subText = input<string>();
  readonly imagePath = input<string | null>();
  readonly fallBackIcon = input<string>();
  readonly fallBackIconFont = input<string>();
  // The image path, until the image fails to load and there is an icon to
  // show instead. A new path starts again.
  readonly image = linkedSignal(() => this.imagePath() ?? null);

  public failedImageLoad() {
    if (this.fallBackIcon()) {
      this.image.set(null);
    }
  }
}
