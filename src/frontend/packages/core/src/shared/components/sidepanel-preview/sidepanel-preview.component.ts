import { Component, Input } from '@angular/core';

import { IFavoriteMetadata, UserFavorite } from '../../../../../store/src/types/user-favorites.types';
import { SidePanelService } from '../../services/side-panel.service';

@Component({
  selector: 'app-sidepanel-preview',
  templateUrl: './sidepanel-preview.component.html',
  styleUrls: ['./sidepanel-preview.component.scss']
})
export class SidepanelPreviewComponent {

  @Input()
  title: string;

  @Input()
  favorite: UserFavorite<IFavoriteMetadata>;

  constructor(public sidePanelService: SidePanelService) { }
}
