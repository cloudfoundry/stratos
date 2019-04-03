import { Component, OnInit } from '@angular/core';
import { ITileConfig, ITileData } from '../../../shared/components/tile/tile-selector.types';
import { RouterNav } from '../../../../../store/src/actions/router.actions';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/src/app-state';
import { BASE_REDIRECT_QUERY } from '../../../shared/components/stepper/stepper.types';
import { getApplicationDeploySourceTypes, AUTO_SELECT_DEPLOY_TYPE_URL_PARAM } from '../deploy-application/deploy-application-steps.types';
interface IAppTileData extends ITileData {
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
  private sourceTypes = getApplicationDeploySourceTypes();
  public tileSelectorConfig = [
    ...this.sourceTypes.map(type =>
      new ITileConfig<IAppTileData>(
        type.name,
        type.graphic,
        { type: 'deploy', subType: type.id },
      ),
    ),
    new ITileConfig<IAppTileData>(
      'Application Shell',
      { matIcon: 'border_clear' },
      { type: 'create' }
    )
  ];

  set selectedTile(tile: ITileConfig<IAppTileData>) {
    const type = tile ? tile.data.type : null;
    if (tile) {
      const baseUrl = 'applications';
      const query = {
        [BASE_REDIRECT_QUERY]: `${baseUrl}/new`
      };
      if (tile.data.subType) {
        query[AUTO_SELECT_DEPLOY_TYPE_URL_PARAM] = tile.data.subType;
      }
      this.store.dispatch(new RouterNav({
        path: `${baseUrl}/${type}`,
        query
      }));
    }
  }

  constructor(public store: Store<AppState>) { }
}
