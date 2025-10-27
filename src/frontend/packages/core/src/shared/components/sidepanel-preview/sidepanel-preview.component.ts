import { Portal, PortalModule } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { IFavoriteMetadata, UserFavorite } from '../../../../../store/src/types/user-favorites.types';
import { EntityFavoriteStarComponent } from '../../../core/entity-favorite-star/entity-favorite-star.component';
import { SidePanelService } from '../../services/side-panel.service';

@Component({
  selector: 'app-sidepanel-preview',
  templateUrl: './sidepanel-preview.component.html',
  styleUrls: ['./sidepanel-preview.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    PortalModule,
    MatButtonModule,
    MatIconModule,
    EntityFavoriteStarComponent
  ]
})
export class SidepanelPreviewComponent {

  @Input()
  title: string;

  @Input()
  favorite: UserFavorite<IFavoriteMetadata>;

  @Input() header: Portal<any>;

  constructor(public sidePanelService: SidePanelService) { }
}
