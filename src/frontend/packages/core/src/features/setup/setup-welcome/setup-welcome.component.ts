import { Component, inject } from '@angular/core';

import { Store } from '@ngrx/store';
import { RouterNav, GeneralEntityAppState } from '@stratosui/store';

import { BASE_REDIRECT_QUERY } from '../../../shared/components/stepper/stepper.types';
import { ITileConfig, ITileData } from '../../../shared/components/tile/tile-selector.types';
import { APP_TITLE } from './../../../core/core.types';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ShowPageHeaderComponent } from '../../../shared/components/page-header/show-page-header/show-page-header.component';
import { SteppersComponent } from '../../../shared/components/stepper/steppers/steppers.component';
import { StepComponent } from '../../../shared/components/stepper/step/step.component';
import { TileSelectorTileComponent } from '../../../shared/components/tile-selector-tile/tile-selector-tile.component';
import { StratosTitleComponent } from '../../../shared/components/stratos-title/stratos-title.component';
import { ProductNameComponent } from '../../../shared/components/product-name.ccomponent';

@Component({
selector: 'app-setup-welcome',
  templateUrl: './setup-welcome.component.html',
  styleUrls: ['./setup-welcome.component.scss'],
  standalone: true,
  imports: [
    PageHeaderComponent,
    ShowPageHeaderComponent,
    SteppersComponent,
    StepComponent,
    TileSelectorTileComponent,
    StratosTitleComponent,
    ProductNameComponent
]
})
export class SetupWelcomeComponent {

  public tileSelectorConfig = [
    new ITileConfig<ITileData>(
      'Local Admin',
      { matIcon: 'person' },
      { type: 'local' },
      false,
      'Use a built-in single Admin User account'
    ),
    new ITileConfig<ITileData>(
      'Cloud Foundry UAA',
      {
        location: '/core/assets/endpoint-icons/cloudfoundry.png',
      },
      { type: 'uaa' },
      false,
      'Use a Cloud Foundry UAA for user authentication'
    )

  ];
  private store = inject(Store<GeneralEntityAppState>);
  public title = inject(APP_TITLE);

  public selectionChange(tile: ITileConfig<ITileData>) {
    if (tile) {
      this.store.dispatch(new RouterNav({
        path: `setup/${tile.data.type}`,
        query: {
          [BASE_REDIRECT_QUERY]: 'setup'
        }
      }));
    }
  }

}
