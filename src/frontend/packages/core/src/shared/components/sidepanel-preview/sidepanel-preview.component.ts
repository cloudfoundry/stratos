import { Portal, PortalModule } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { Component, Input, inject, ChangeDetectionStrategy, input } from '@angular/core';

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

  // Null while the caller is still deriving the title (e.g. markdown preview)
  readonly title = input.required<string | null>();

  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input()
  favorite?: UserFavorite<IFavoriteMetadata>;

  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input() header?: Portal<any>;
}
