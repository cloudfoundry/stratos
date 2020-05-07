import { Store } from '@ngrx/store';
import { combineLatest, Observable, of, Subject, Subscription } from 'rxjs';
import {
  delay,
  distinctUntilChanged,
  filter,
  map,
  pairwise,
  startWith,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs/operators';

import { AuthParams, ConnectEndpoint } from '../../../../store/src/actions/endpoint.actions';
import { GetSystemInfo } from '../../../../store/src/actions/system.actions';
import { EndpointOnlyAppState } from '../../../../store/src/app-state';
import { EndpointsEffect } from '../../../../store/src/effects/endpoint.effects';
import { SystemEffects } from '../../../../store/src/effects/system.effects';
import { entityCatalog } from '../../../../store/src/entity-catalog/entity-catalog';
import { endpointSchemaKey } from '../../../../store/src/helpers/entity-factory';
import { ActionState } from '../../../../store/src/reducers/api-request-reducer/types';
import { selectEntity, selectRequestInfo, selectUpdateInfo } from '../../../../store/src/selectors/api.selectors';
import { EndpointModel } from '../../../../store/src/types/endpoint.types';
import { STRATOS_ENDPOINT_TYPE } from '../../base-entity-schemas';
import { EndpointsService } from '../../core/endpoints.service';
import { EndpointType } from '../../core/extension/extension-types';
import { safeUnsubscribe } from '../../core/utils.service';

export interface ConnectEndpointConfig {
  name: string;
  guid: string;
  type: EndpointType;
  subType: string;
  ssoAllowed: boolean;
}

export interface ConnectEndpointData {
  authType: string;
  authVal: AuthParams;
  systemShared: boolean;
  bodyContent: string;
}

// Why is this here instead of somewhere more common? Answer - Because it'd create circulate dependencies due to reliance on entityCatalog
export const isEndpointConnected = (endpoint: EndpointModel): boolean => {
  const epType = entityCatalog.getEndpoint(endpoint.cnsi_type, endpoint.sub_type).definition;
  return endpoint.connectionStatus === 'connected' || epType.unConnectable;
};

export class ConnectEndpointService {

  public connectingError$: Observable<string>;
  private hasConnected = new Subject<boolean>();
  public hasConnected$: Observable<boolean> = this.hasConnected.asObservable();
  public isBusy$: Observable<boolean>;

  private connecting$: Observable<boolean>;
  private connected$: Observable<[boolean, EndpointModel]>;
  private fetchingInfo$: Observable<boolean>;
  private update$: Observable<ActionState>;

  private subs: Subscription[] = [];

  private hasAttemptedConnect: boolean;
  private pData: ConnectEndpointData;

  private endpointEntityKey = entityCatalog.getEntityKey(STRATOS_ENDPOINT_TYPE, endpointSchemaKey);

  // We need a delay to ensure the BE has finished registering the endpoint.
  // If we don't do this and if we're quick enough, we can navigate to the application page
  // and end up with an empty list where we should have results.
  private connectDelay = 1000;

  constructor(
    private store: Store<EndpointOnlyAppState>,
    private endpointsService: EndpointsService,
    public config: ConnectEndpointConfig,
  ) {
    this.setupObservables();
    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    this.subs.push(this.update$.pipe(
      pairwise()
    ).subscribe(([oldVal, newVal]) => {
      if (!newVal.error && (oldVal.busy && !newVal.busy)) {
        // Has finished fetching
        this.store.dispatch(new GetSystemInfo());
      }
    }));

    this.subs.push(this.connected$.pipe(
      filter(([connected]) => connected),
      delay(this.connectDelay),
      tap(() => this.hasConnected.next(true)),
      distinctUntilChanged(([connected], [oldConnected]) => connected && oldConnected),
    ).subscribe(([connected, endpoint]) => this.endpointsService.checkEndpoint(endpoint))
    );
  }

  private setupObservables() {
    this.update$ = this.store.select(
      this.getUpdateSelector()
    ).pipe(filter(update => !!update));

    this.fetchingInfo$ = this.store.select(
      this.getRequestSelector()
    ).pipe(
      filter(request => !!request),
      map(request => request.fetching));

    this.connected$ = this.store.select(
      this.getEntitySelector()
    ).pipe(
      map(endpoint => {
        const isConnected = !!(endpoint && endpoint.api_endpoint && endpoint.user);
        return [isConnected, endpoint] as [boolean, EndpointModel];
      })
    );
    const busy$ = this.update$.pipe(map(update => update.busy), startWith(false));
    this.connecting$ = busy$.pipe(
      pairwise(),
      switchMap(([oldBusy, newBusy]) => {
        if (oldBusy === true && newBusy === false) {
          return busy$.pipe(
            delay(this.connectDelay),
            startWith(true)
          );
        }
        return of(newBusy);
      })
    );
    this.connectingError$ = this.update$.pipe(
      filter(() => this.hasAttemptedConnect),
      map(update => update.error ? update.message || 'Could not connect to the endpoint' : null)
    );

    this.setupCombinedObservables();
  }

  private setupCombinedObservables() {
    this.isBusy$ = combineLatest(
      this.connecting$.pipe(startWith(false)),
      this.fetchingInfo$.pipe(startWith(false))
    ).pipe(
      map(([connecting, fetchingInfo]) => connecting || fetchingInfo),
    );
  }

  private getUpdateSelector() {
    return selectUpdateInfo(
      this.endpointEntityKey,
      this.config.guid,
      EndpointsEffect.connectingKey
    );
  }

  private getRequestSelector() {
    return selectRequestInfo(
      this.endpointEntityKey,
      SystemEffects.guid
    );
  }

  private getEntitySelector() {
    return selectEntity<EndpointModel>(
      this.endpointEntityKey,
      this.config.guid,
    );
  }

  public setData(data: ConnectEndpointData) {
    this.pData = data;
  }

  public submit(): Observable<{ success: boolean, errorMessage: string }> {
    this.hasAttemptedConnect = true;
    const { authType, authVal, systemShared, bodyContent } = this.pData;

    this.store.dispatch(new ConnectEndpoint(
      this.config.guid,
      this.config.type,
      authType,
      authVal,
      systemShared,
      bodyContent,
    ));

    return this.isBusy$.pipe(
      pairwise(),
      filter(([oldBusy, newBusy]) => {
        return !(oldBusy === true && newBusy === false);
      }),
      withLatestFrom(this.update$),
      map(([, updateSection]) => ({
        success: !updateSection.error,
        errorMessage: updateSection.message
      }))
    );
  }

  public destroy() {
    safeUnsubscribe(...this.subs);
  }
}
