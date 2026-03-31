import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CFAppState } from '@stratosui/cloud-foundry';
import { PageHeaderComponent, StepComponent, SteppersComponent, BASE_REDIRECT_QUERY, ITileConfig, ITileData, TileSelectorComponent } from '@stratosui/core';
import { RouterNav } from '@stratosui/store';
import {
  ApplicationDeploySourceTypes,
  AUTO_SELECT_DEPLOY_TYPE_ENDPOINT_PARAM,
  AUTO_SELECT_DEPLOY_TYPE_URL_PARAM,
} from '../deploy-application/deploy-application-steps.types';

export const AUTO_SELECT_CF_URL_PARAM = 'auto-select-endpoint';


export interface IAppTileData extends ITileData {
  type: string;
  subType?: string;
  endpointGuid?: string;
}

@Component({
  selector: 'app-new-application-base-step',
  templateUrl: './new-application-base-step.component.html',
  styleUrls: ['./new-application-base-step.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    TileSelectorComponent
  ],
  providers: [
    ApplicationDeploySourceTypes
  ]
})
export class NewApplicationBaseStepComponent {
  private store = inject<Store<CFAppState>>(Store);
  private activatedRoute = inject(ActivatedRoute);


  public serviceType!: string;
  public tileSelectorConfig$: Observable<ITileConfig<IAppTileData>[]>;

  set selectedTile(tile: ITileConfig<IAppTileData>) {
    if (tile) {
      const baseUrl = 'applications';
      const type = tile.data.type;
      const query: { [key: string]: string } = {
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

  constructor() {
    const appDeploySourceTypes = inject(ApplicationDeploySourceTypes);

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
