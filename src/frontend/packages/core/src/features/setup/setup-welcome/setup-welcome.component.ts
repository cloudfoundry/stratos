import { APP_TITLE } from './../../../core/core.types';
import { Component, Inject } from '@angular/core';
import { Store } from '@ngrx/store';

import { RouterNav } from '../../../../../store/src/actions/router.actions';
import { GeneralEntityAppState } from '../../../../../store/src/app-state';
import { BASE_REDIRECT_QUERY } from '../../../shared/components/stepper/stepper.types';
import { ITileConfig, ITileData } from '../../../shared/components/tile/tile-selector.types';

@Component({
  selector: 'app-setup-welcome',
  templateUrl: './setup-welcome.component.html',
  styleUrls: ['./setup-welcome.component.scss']
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

  constructor(private store: Store<GeneralEntityAppState>, @Inject(APP_TITLE) public title: string) { }

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
