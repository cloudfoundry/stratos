import { Component, ComponentFactoryResolver, Injector, OnDestroy } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, of as observableOf, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, first, map, pairwise, startWith, withLatestFrom } from 'rxjs/operators';

import { EndpointsService } from '../../../../../../core/src/core/endpoints.service';
import { safeUnsubscribe } from '../../../../../../core/src/core/utils.service';
import {
  ConnectEndpointConfig,
  ConnectEndpointData,
  ConnectEndpointService,
} from '../../../../../../core/src/features/endpoints/connect.service';
import {
  IActionMonitorComponentState,
} from '../../../../../../core/src/shared/components/app-action-monitor-icon/app-action-monitor-icon.component';
import {
  ITableListDataSource,
  RowState,
} from '../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source-types';
import { ITableColumn } from '../../../../../../core/src/shared/components/list/list-table/table.types';
import { StepOnNextFunction } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { AppState } from '../../../../../../store/src/app-state';
import { ActionState } from '../../../../../../store/src/reducers/api-request-reducer/types';
import { stratosEntityCatalog } from '../../../../../../store/src/stratos-entity-catalog';
import { KUBERNETES_ENDPOINT_TYPE } from '../../kubernetes-entity-factory';
import { KubeConfigAuthHelper } from '../kube-config-auth.helper';
import { KubeConfigFileCluster, KubeConfigImportAction, KubeImportState } from '../kube-config.types';
import {
  KubeConfigTableImportStatusComponent,
} from './kube-config-table-import-status/kube-config-table-import-status.component';

const REGISTER_ACTION = 'Register endpoint';
const CONNECT_ACTION = 'Connect endpoint';

@Component({
  selector: 'app-kube-config-import',
  templateUrl: './kube-config-import.component.html',
  styleUrls: ['./kube-config-import.component.scss']
})
export class KubeConfigImportComponent implements OnDestroy {

  done = new BehaviorSubject<boolean>(false);
  done$ = this.done.asObservable();
  busy = new BehaviorSubject<boolean>(false);
  busy$ = this.busy.asObservable();
  data = new BehaviorSubject<KubeConfigImportAction[]>([]);
  data$ = this.data.asObservable();

  public dataSource: ITableListDataSource<KubeConfigImportAction> = {
    connect: () => this.data$,
    disconnect: () => { },
    // Ensure unique per entry to step (in case user went back step and updated)
    trackBy: (index, item) => item.cluster.name + this.iteration,
    isTableLoading$: this.data$.pipe(map(data => !(data && data.length > 0))),
    getRowState: (row: KubeConfigImportAction): Observable<RowState> => {
      return row ? row.state.asObservable() : observableOf({});
    }
  };
  public columns: ITableColumn<KubeConfigImportAction>[] = [
    {
      columnId: 'action', headerCell: () => 'Action',
      cellDefinition: {
        valuePath: 'action'
      },
      cellFlex: '1',
    },
    {
      columnId: 'description', headerCell: () => 'Description',
      cellDefinition: {
        valuePath: 'description'
      },
      cellFlex: '4',
    },
    // Right-hand column to show the action progress
    {
      columnId: 'monitorState',
      cellComponent: KubeConfigTableImportStatusComponent,
      cellConfig: (row) => row.actionState.asObservable(),
      cellFlex: '0 0 24px'
    }
  ];

  subs: Subscription[] = [];
  applyStarted: boolean;
  private iteration = 0;

  private connectService: ConnectEndpointService;

  constructor(
    public store: Store<AppState>,
    public resolver: ComponentFactoryResolver,
    private injector: Injector,
    private fb: FormBuilder,
    private endpointsService: EndpointsService,
  ) {
  }

  // Process the next action in the list
  private processAction(actions: KubeConfigImportAction[]) {
    if (actions.length === 0) {
      // We are done
      this.done.next(true);
      this.busy.next(false);
      return;
    }

    // Get the next action
    const i = actions.shift();
    if (i.action === REGISTER_ACTION) {
      this.doRegister(i, actions);
    } else if (i.action === CONNECT_ACTION) {
      this.doConnect(i, actions);
    } else {
      // Do the next action
      this.processAction(actions);
    }
  }

  private doRegister(reg: KubeConfigImportAction, next: KubeConfigImportAction[]) {
    const obs$ = this.registerEndpoint(
      reg.cluster.name,
      reg.cluster.cluster.server,
      reg.cluster.cluster['insecure-skip-tls-verify'],
      reg.cluster._subType
    );
    const mainObs$ = this.getUpdatingState(obs$).pipe(
      startWith({ busy: true, error: false, completed: false })
    );

    this.subs.push(mainObs$.subscribe(reg.actionState));

    const sub = reg.actionState.subscribe(progress => {
      // Not sure what the status is used for?
      reg.status = progress;
      if (progress.error && progress.message) {
        // Mark all dependency jobs as skip
        next.forEach(action => {
          if (action.depends === reg) {
            // Mark it as skipped by setting the action to null
            action.action = null;
            action.state.next({ message: 'Skipping action as endpoint could not be registered', warning: true });
          }
        });
        reg.state.next({ message: progress.message, error: true });
      }
      if (progress.completed) {
        if (!progress.error) {
          // If we created okay, then guid is in the message
          reg.cluster._guid = progress.message;
        }
        sub.unsubscribe();
        // Do the next one
        this.processAction(next);
      }
    });
    this.subs.push(sub);
  }

  private doConnect(connect: KubeConfigImportAction, next: KubeConfigImportAction[]) {
    if (!connect.user) {
      connect.state.next({ message: 'Can not connect - no user specified', error: true });
      return;
    }
    const helper = new KubeConfigAuthHelper();
    const data = helper.getAuthDataForConnect(this.resolver, this.injector, this.fb, connect.user);
    if (data) {
      const obs$ = this.connectEndpoint(connect, data);

      // Echo obs$ to the behaviour subject
      this.subs.push(obs$.subscribe(connect.actionState));

      this.subs.push(connect.actionState.pipe(filter(status => status.completed), first()).subscribe(status => {
        if (status.error) {
          connect.state.next({ message: status.message, error: true });
        }
        this.processAction(next);
      }));
    } else {
      connect.state.next({ message: 'Can not connect - could not get user auth data', error: true });
    }
  }

  ngOnDestroy() {
    safeUnsubscribe(...this.subs);

    if (this.connectService) {
      this.connectService.destroy();
    }
  }

  // Register the endpoint
  private registerEndpoint(name: string, url: string, skipSslValidation: boolean, subType: string) {
    return stratosEntityCatalog.endpoint.api.register<ActionState>(
      KUBERNETES_ENDPOINT_TYPE,
      subType,
      name,
      url,
      skipSslValidation,
      '',
      '',
      false
    ).pipe(
      filter(update => !!update)
    );
  }

  // Connect to an endpoint
  private connectEndpoint(action: KubeConfigImportAction, pData: ConnectEndpointData): Observable<IActionMonitorComponentState> {
    const config: ConnectEndpointConfig = {
      name: action.cluster.name,
      guid: action.depends.cluster._guid || action.cluster._guid,
      type: KUBERNETES_ENDPOINT_TYPE,
      subType: action.user._authData.subType,
      ssoAllowed: false
    };

    if (this.connectService) {
      this.connectService.destroy();
    }
    this.connectService = new ConnectEndpointService(this.endpointsService, config);
    this.connectService.setData(pData);
    return this.connectService.submit().pipe(
      map(updateSection => ({
        busy: false,
        error: !updateSection.success,
        completed: true,
        message: updateSection.errorMessage
      })),
      startWith({
        message: '',
        busy: true,
        completed: false,
        error: false
      })
    );
  }

  // Enter the step - process the list of clusters to import
  onEnter = (data: KubeConfigFileCluster[]) => {
    this.applyStarted = false;
    this.iteration += 1;
    const imports: KubeConfigImportAction[] = [];
    data.forEach(item => {
      if (item._selected) {
        const register = {
          action: REGISTER_ACTION,
          description: `Register "${item.name}" with the URL "${item.cluster.server}"`,
          cluster: item,
          state: new BehaviorSubject<RowState>({}),
          actionState: new BehaviorSubject<any>({}),
        };
        // Only include if the endpoint does not already exist
        if (!item._guid) {
          imports.push(register);
        }
        if (item._additionalUserInfo) {
          return;
        }
        const user = item._users.find(u => u.name === item._user);
        if (user) {
          imports.push({
            action: CONNECT_ACTION,
            description: `Connect "${item.name}" with the user "${user.name}"`,
            cluster: item,
            user,
            state: new BehaviorSubject<RowState>({}),
            depends: register,
            actionState: new BehaviorSubject<any>({}),
          });
        }
      }
    });
    this.data.next(imports);
  }

  // Finish - go back to the endpoints view
  onNext: StepOnNextFunction = () => {
    if (this.applyStarted) {
      // this.store.dispatch(new RouterNav({ path: ['endpoints'] }));
      return observableOf({ success: true, redirect: true });

    } else {
      this.applyStarted = true;
      this.busy.next(true);
      this.data$.pipe(
        filter((data => data && data.length > 0)),
        first()
      ).subscribe(imports => {
        // Go through the imports and dispatch the actions to perform them in sequence
        this.processAction([...imports]);
      })
      return observableOf({ success: true, ignoreSuccess: true });
    }
  }

  // These two should be somewhere else
  private getUpdatingState(actionState$: Observable<ActionState>): Observable<KubeImportState> {
    const completed$ = this.getHasCompletedObservable(actionState$.pipe(map(requestState => requestState.busy)));
    return actionState$.pipe(
      pairwise(),
      withLatestFrom(completed$),
      map(([[, requestState], completed]) => {
        return {
          busy: requestState.busy,
          error: requestState.error,
          completed,
          message: requestState.message,
        };
      })
    );
  }

  private getHasCompletedObservable(busy$: Observable<boolean>) {
    return busy$.pipe(
      distinctUntilChanged(),
      pairwise(),
      map(([oldBusy, newBusy]) => oldBusy && !newBusy),
      startWith(false),
    );
  }

}
