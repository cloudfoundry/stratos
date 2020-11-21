import { Component } from '@angular/core';
import { Observable } from 'rxjs';

import { PreviewableComponent } from '../../../../shared/previewable-component';

@Component({
  selector: 'app-favorites-side-panel',
  templateUrl: './favorites-side-panel.component.html',
  styleUrls: ['./favorites-side-panel.component.scss']
})
export class FavoritesSidePanelComponent implements PreviewableComponent {

  favorites$: Observable<any>;
  name: string;

  setProps(props: { [key: string]: any; }): void {
    this.favorites$ = props.favorites$;
    this.name = props.endpoint.name;
  }

}
