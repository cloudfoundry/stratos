import { combineLatest, Observable, of, Subject, Subscription } from 'rxjs';
import { delay, distinctUntilChanged, filter, map, pairwise, startWith, switchMap, tap } from 'rxjs/operators';

import { AuthParams, ConnectEndpoint } from '../../../../store/src/actions/endpoint.actions';
import { entityCatalog } from '../../../../store/src/entity-catalog/entity-catalog';
import { EndpointType } from '../../../../store/src/extension-types';
import { ActionState } from '../../../../store/src/reducers/api-request-reducer/types';
import { stratosEntityCatalog } from '../../../../store/src/stratos-entity-catalog';
import { EndpointModel } from '../../../../store/src/types/endpoint.types';
import { EndpointsService } from '../../core/endpoints.service';
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

  // We need a delay to ensure the BE has finished registering the endpoint.
  // If we don't do this and if we're quick enough, we can navigate to the application page
  // and end up with an empty list where we should have results.
  private connectDelay = 1000;

  constructor(
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
        stratosEntityCatalog.endpoint.api.get(this.config.guid);
      }
    }));

    this.subs.push(this.connected$.pipe(
      filter(([isConnected]) => isConnected),
      delay(this.connectDelay),
      tap(() => this.hasConnected.next(true)),
      distinctUntilChanged(([isConnected], [oldIsConnected]) => isConnected && oldIsConnected),
    ).subscribe(([, endpoint]) => this.endpointsService.checkEndpoint(endpoint))
    );
  }

  private setupObservables() {
    this.update$ = stratosEntityCatalog.endpoint.store.getEntityMonitor(this.config.guid).getUpdatingSection(ConnectEndpoint.UpdatingKey)
      .pipe(filter(update => !!update));

    this.fetchingInfo$ = stratosEntityCatalog.endpoint.store.getEntityMonitor(this.config.guid).entityRequest$.pipe(
      filter(request => !!request),
      map(request => request.fetching)
    );

    this.connected$ = stratosEntityCatalog.endpoint.store.getEntityMonitor(this.config.guid).entity$.pipe(
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

  public setData(data: ConnectEndpointData) {
    this.pData = data;
  }

  public submit(): Observable<{ success: boolean, errorMessage: string }> {
    this.hasAttemptedConnect = true;
    const { authType, authVal, systemShared, bodyContent } = this.pData;

    return stratosEntityCatalog.endpoint.api.connect<ActionState>(
      this.config.guid,
      this.config.type,
      authType,
      authVal,
      systemShared,
      bodyContent,
    ).pipe(
      pairwise(),
      filter(([oldV, newV]) => oldV.busy && !newV.busy),
      map(([, newV]) => newV),
      map(updateSection => ({
        success: !updateSection.error,
        errorMessage: updateSection.message
      })),
    );
  }

  public destroy() {
    safeUnsubscribe(...this.subs);
  }
}
