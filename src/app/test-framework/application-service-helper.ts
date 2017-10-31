import { ApplicationService, ApplicationData } from '../features/applications/application.service';
import { Observable } from 'rxjs/Observable';
import { EntityRequestState } from '../store/reducers/api-request-reducer';
import { EntityInfo } from '../store/types/api.types';
import { AppMetadataInfo } from '../store/types/app-metadata.types';

export class ApplicationServiceMock {
  cfGuid = 'mockCfGuid';
  appGuid = 'mockAppGuid';
  application$: Observable<ApplicationData> = Observable.of(({
    app: {
      metadata: {},
      entity: {
      },
      entityRequestInfo: {} as EntityRequestState
    } as EntityInfo,
    stack: {
      entity: {
      },
    },
    organisation: {
      entity: {
      },
    },
    space: {
      entity: {

      }
    },
    fetching: false
  } as ApplicationData));
  appSummary$: Observable<AppMetadataInfo> = Observable.of(({ metadataRequestState: { fetching: {} } } as AppMetadataInfo));
  isFetchingApp$: Observable<boolean> = Observable.of(false);
  isFetchingEnvVars$: Observable<boolean> = Observable.of(false);
  isUpdatingEnvVars$: Observable<boolean> = Observable.of(false);
  waitForAppEntity$: Observable<EntityInfo> = Observable.of({
    entity: {
      entity: {

      }
    }
  } as EntityInfo);
  SetApplication() { }
}
