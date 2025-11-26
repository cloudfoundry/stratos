import { CommonModule, AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component  } from '@angular/core';
import type { Observable } from 'rxjs';

import type { PreviewableComponent } from '../../../../shared/previewable-component';
import { SidepanelPreviewComponent } from '../../../../shared/components/sidepanel-preview/sidepanel-preview.component';
import { FavoritesMetaCardComponent } from '../favorites-meta-card/favorites-meta-card.component';

@Component({
  selector: 'app-favorites-side-panel',
  templateUrl: './favorites-side-panel.component.html',
  styleUrls: ['./favorites-side-panel.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    SidepanelPreviewComponent,
    FavoritesMetaCardComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FavoritesSidePanelComponent implements PreviewableComponent {

  favorites$: Observable<unknown> = {} as Observable<unknown>;
  name!: string;

  setProps(props: { [key: string]: unknown; }): void {
    this.favorites$ = props['favorites$'] as Observable<unknown>;
    this.name = (props['endpoint'] as { name: string }).name;
  }

}
