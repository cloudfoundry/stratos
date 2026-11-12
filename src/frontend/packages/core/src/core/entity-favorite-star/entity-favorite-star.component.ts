import { CommonModule } from '@angular/common';
import { Component, computed, inject, ChangeDetectionStrategy, input } from '@angular/core';
import { CustomTooltipDirective } from '../../shared/components/custom-tooltip/custom-tooltip.directive';
import { UserFavoriteManager, IFavoriteMetadata, UserFavorite } from '@stratosui/store';

import { ConfirmationDialogConfig } from '../../shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../shared/components/confirmation-dialog.service';
import { EndpointsService } from '../endpoints.service';
import { CustomIconComponent } from '../../shared/components/custom-material/custom-material.component';

@Component({
  selector: 'app-entity-favorite-star',
  templateUrl: './entity-favorite-star.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    CustomIconComponent,
    CustomTooltipDirective
  ]
})
export class EntityFavoriteStarComponent {

  private confirmDialog = inject(ConfirmationDialogService);
  public endpointsService = inject(EndpointsService);
  private userFavoriteManager = inject(UserFavoriteManager);

  readonly favorite = input.required<UserFavorite<IFavoriteMetadata>>();

  public readonly confirmRemoval = input(false);

  readonly small = input(false);

  public readonly isFavorite = computed(() => this.userFavoriteManager.isFavorite(this.favorite()));

  private readonly confirmationDialogConfig = computed(() => {
    const name = this.favorite().getPrettyTypeName();
    return new ConfirmationDialogConfig(
      'Unfavorite?',
      `Are you sure you would you like to unfavorite this ${name ? name.toLocaleLowerCase() : 'favorite'}?`,
      'Yes',
      true
    );
  });

  public toggleFavorite(event: Event) {
    event.stopPropagation();
    if (this.confirmRemoval()) {
      if (this.isFavorite()) {
        this.confirmDialog.open(this.confirmationDialogConfig(), this.pToggleFavorite);
      } else {
        this.pToggleFavorite();
      }
    } else {
      this.pToggleFavorite();
    }
  }

  private pToggleFavorite = (_res?: any) => {
    this.userFavoriteManager.toggleFavorite(this.favorite());
  }
}
