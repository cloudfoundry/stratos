import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Signal, signal } from '@angular/core';
import { IFavoriteMetadata, UserFavorite } from '@stratosui/store';

import { PreviewableComponent } from '../../../../shared/previewable-component';
import { SidepanelPreviewComponent } from '../../../../shared/components/sidepanel-preview/sidepanel-preview.component';
import { FavoritesMetaCardComponent } from '../favorites-meta-card/favorites-meta-card.component';

@Component({
  selector: 'app-favorites-side-panel',
  templateUrl: './favorites-side-panel.component.html',
  standalone: true,
  imports: [
    CommonModule,
    SidepanelPreviewComponent,
    FavoritesMetaCardComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FavoritesSidePanelComponent implements PreviewableComponent {

  // Replaced in setProps (PreviewableComponent contract); empty until then.
  favorites: Signal<UserFavorite<IFavoriteMetadata>[] | undefined> = signal(undefined);
  // strict: assigned in setProps before use
  name!: string;

  setProps(props: { [key: string]: any; }): void {
    this.favorites = props.favorites;
    this.name = props.endpoint.name;
  }

}
