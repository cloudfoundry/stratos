import {Component, ComponentFactoryResolver, Injector, OnDestroy, signal, WritableSignal, inject, ChangeDetectionStrategy } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

import { UntypedFormBuilder } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, first, map, pairwise, startWith, withLatestFrom } from 'rxjs/operators';

import { EndpointsService } from '../../../../../core/src/core/endpoints.service';
import { safeUnsubscribe } from '../../../../../core/src/core/utils.service';
import {
  ConnectEndpointConfig,
  ConnectEndpointData,
  ConnectEndpointService,
} from '../../../../../core/src/features/endpoints/connect.service';
import {
  IActionMonitorComponentState,
} from '../../../../../core/src/shared/components/app-action-monitor-icon/app-action-monitor-icon.component';
import {
  ITableListDataSource,
  RowState,
} from '../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source-types';
import { TableComponent } from '../../../../../core/src/shared/components/list/list-table/table.component';
import { ITableColumn } from '../../../../../core/src/shared/components/list/list-table/table.types';
import { StepOnNextFunction } from '../../../../../core/src/shared/components/stepper/step/step.component';
import { AppState } from '../../../../../store/src/public-api';
import { ActionState } from '../../../../../store/src/reducers/api-request-reducer/types';
import { stratosEntityCatalog } from '../../../../../store/src/stratos-entity-catalog';
import { KUBERNETES_ENDPOINT_TYPE } from '../../kubernetes-entity-factory';
import { KubeConfigAuthHelper } from '../kube-config-auth.helper';
import { KubeConfigFileCluster, KubeConfigImportAction, KubeImportState } from '../kube-config.types';
import {
  KubeConfigTableImportStatusComponent,
} from './kube-config-table-import-status/kube-config-table-import-status.component';

const REGISTER_ACTION = 'Register endpoint';
const CONNECT_ACTION = 'Connect endpoint';

/**
 * Signal wrapper utility for BehaviorSubject compatibility
 * Provides dual API: Signal methods + BehaviorSubject compatibility (.next(), .asObservable())
 * Enables zero-breaking-change migration from BehaviorSubject to Signal
 */
function createSignalWrapper<T>(initialValue: T) {
  const _signal = signal<T>(initialValue);
  const wrapper = Object.assign(
    // Make it callable like a signal
    () => _signal(),
    {
      // WritableSignal methods
      set: (value: T) => _signal.set(value),
      update: (fn: (value: T) => T) => _signal.update(fn),
      asReadonly: () => _signal.asReadonly(),
      // BehaviorSubject compatibility methods
      next: (value: T) => _signal.set(value),
      getValue: () => _signal(),
      asObservable: () => toObservable(_signal),
    }
  );
  return wrapper as WritableSignal<T> & {
    next: (value: T) => void;
    getValue: () => T;
    asObservable: () => Observable<T>;
  };
}

@Component({
selector: 'app-kube-config-import',
  templateUrl: './kube-config-import.component.html',
  styleUrls: ['./kube-config-import.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TableComponent
]
})
export class KubeConfigImportComponent implements OnDestroy {

  // Top-level signals - use wrapper for BehaviorSubject compatibility
  done = createSignalWrapper<boolean>(false);
  done$ = this.done.asObservable();
  busy = createSignalWrapper<boolean>(false);
  busy$ = this.busy.asObservable();
  data = createSignalWrapper<KubeConfigImportAction[]>([]);
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
  applyStarted!: boolean;
  private iteration = 0;

  private connectService: ConnectEndpointService;
  public store = inject(Store<AppState>);
  public resolver = inject(ComponentFactoryResolver);
  private injector = inject(Injector);
  private fb = inject(UntypedFormBuilder);
  private endpointsService = inject(EndpointsService);

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
      startWith({ busy: true, error: false, completed: false, message: '' })
    );

    this.subs.push(mainObs$.subscribe(value => reg.actionState.next(value)));

    const sub = reg.actionState.asObservable().subscribe((progress: IActionMonitorComponentState) => {
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

      this.subs.push(connect.actionState.asObservable().pipe(
        filter((status: IActionMonitorComponentState) => status.completed),
        first()
      ).subscribe((status: IActionMonitorComponentState) => {
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
          // Use signal wrapper for nested dynamic state - maintains .next() and .asObservable() API
          state: createSignalWrapper<RowState>({}),
          actionState: createSignalWrapper<any>({}),
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
            // Use signal wrapper for nested dynamic state - maintains .next() and .asObservable() API
            state: createSignalWrapper<RowState>({}),
            depends: register,
            actionState: createSignalWrapper<any>({}),
          });
        }
      }
    });
    this.data.next(imports);
  };

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
      });
      return observableOf({ success: true, ignoreSuccess: true });
    }
  };

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
