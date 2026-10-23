
import { ChangeDetectionStrategy, Component, Input, input } from '@angular/core';
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
  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input() subTitle?: string;
  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input() info?: string;
  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input() subText?: string;
  // TODO: Skipped for migration because:
  //  Accessor inputs cannot be migrated as they are too complex.
  @Input()
  get imagePath(): string | null {
    return this.image;
  }
  set imagePath(image: string | null) {
    this.image = image;
  }
  readonly fallBackIcon = input<string>();
  readonly fallBackIconFont = input<string>();
  public image: string | null = null;

  public failedImageLoad() {
    if (this.fallBackIcon()) {
      this.image = null;
    }
  }
}
