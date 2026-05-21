import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component  } from '@angular/core';
import { Observable } from 'rxjs';

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

  favorites$: Observable<any>;
  name!: string;

  setProps(props: { [key: string]: any; }): void {
    this.favorites$ = props.favorites$;
    this.name = props.endpoint.name;
  }

}
