import { Portal, PortalModule } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { Component, Input, inject, ChangeDetectionStrategy } from '@angular/core';

import { IFavoriteMetadata, UserFavorite } from '../../../../../store/src/types/user-favorites.types';
import { EntityFavoriteStarComponent } from '../../../core/entity-favorite-star/entity-favorite-star.component';
import { SidePanelService } from '../../services/side-panel.service';
import { CustomIconComponent } from '../../../shared/components/custom-material/custom-material.component';

@Component({
  selector: 'app-sidepanel-preview',
  templateUrl: './sidepanel-preview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    PortalModule,
    CustomIconComponent,
    EntityFavoriteStarComponent
  ]
})
export class SidepanelPreviewComponent {
  public sidePanelService = inject(SidePanelService);

  @Input()
  title!: string;

  @Input()
  favorite!: UserFavorite<IFavoriteMetadata>;

  @Input() header?: Portal<any>;
}
