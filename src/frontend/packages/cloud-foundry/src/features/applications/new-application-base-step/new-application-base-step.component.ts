import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { BASE_REDIRECT_QUERY } from '../../../../../core/src/shared/components/stepper/stepper.types';
import { ITileConfig, ITileData } from '../../../../../core/src/shared/components/tile/tile-selector.types';
import { RouterNav } from '../../../../../store/src/actions/router.actions';
import {
  ApplicationDeploySourceTypes,
  AUTO_SELECT_DEPLOY_TYPE_ENDPOINT_PARAM,
  AUTO_SELECT_DEPLOY_TYPE_URL_PARAM,
} from '../deploy-application/deploy-application-steps.types';

export const AUTO_SELECT_CF_URL_PARAM = 'auto-select-endpoint';


export interface IAppTileData extends ITileData {
  type: string;
  subType?: string;
}

@Component({
  selector: 'app-new-application-base-step',
  templateUrl: './new-application-base-step.component.html',
  styleUrls: ['./new-application-base-step.component.scss']
})
export class NewApplicationBaseStepComponent {

  public serviceType: string;
  public tileSelectorConfig$: Observable<ITileConfig<IAppTileData>[]>;

  set selectedTile(tile: ITileConfig<IAppTileData>) {
    if (tile) {
      const baseUrl = 'applications';
      const type = tile.data.type;
      const query = {
        [BASE_REDIRECT_QUERY]: `${baseUrl}/new`
      };
      if (tile.data.subType) {
        query[AUTO_SELECT_DEPLOY_TYPE_URL_PARAM] = tile.data.subType;
        query[AUTO_SELECT_DEPLOY_TYPE_ENDPOINT_PARAM] = tile.data.endpointGuid;
      }
      const endpoint = this.activatedRoute.snapshot.params.endpointId;
      if (endpoint) {
        query[AUTO_SELECT_CF_URL_PARAM] = endpoint;
        query[BASE_REDIRECT_QUERY] += `/${endpoint}`;
      }

      this.store.dispatch(new RouterNav({
        path: `${baseUrl}/${type}`,
        query
      }));
    }
  }

  constructor(
    private store: Store<CFAppState>,
    appDeploySourceTypes: ApplicationDeploySourceTypes,
  ) {
    this.tileSelectorConfig$ = appDeploySourceTypes.types$.pipe(
      map(types => {
        return [
          ...types.map(type =>
            new ITileConfig<IAppTileData>(
              type.name,
              type.graphic,
              { type: 'deploy', subType: type.id, endpointGuid: type.endpointGuid },
            ),
          ),
          new ITileConfig<IAppTileData>(
            'Application Shell',
            { matIcon: 'border_clear' },
            { type: 'create' }
          )
        ];
      })
    );
  }
}
