import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-entity-summary-title',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTooltipModule
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
