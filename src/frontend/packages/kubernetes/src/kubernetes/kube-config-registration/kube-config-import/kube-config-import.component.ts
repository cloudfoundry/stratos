import {Component, EnvironmentInjector, Injector, OnDestroy, signal, WritableSignal, inject, ChangeDetectionStrategy } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

import { UntypedFormBuilder } from '@angular/forms';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { filter, map, startWith, take } from 'rxjs/operators';

import { EndpointsDataService } from '@stratosui/store';

import { EndpointsService } from '../../../../../core/src/core/endpoints.service';
import { safeUnsubscribe } from '../../../../../core/src/core/utils.service';
import {
  ConnectEndpointConfig,
  ConnectEndpointData,
  ConnectEndpointService,
} from '../../../../../core/src/features/endpoints/connect.service';
import { EndpointsSignalConfigService } from '../../../../../core/src/features/endpoints/endpoints-page/endpoints-signal-config.service';
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
import { KUBERNETES_ENDPOINT_TYPE } from '../../kubernetes-entity-factory';
import { KubeConfigAuthHelper } from '../kube-config-auth.helper';
import { KubeConfigFileCluster, KubeConfigImportAction } from '../kube-config.types';
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
  host: { class: 'flex flex-1' },
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
  // FWT-959 Part 2: applyStarted promoted from a plain boolean to a signal
  // wrapper so the parent can wire it into a SignalStepHandle's
  // canClose/destructiveStep/finishButtonText computed bindings. The
  // wrapper preserves the legacy boolean read/write API used inside this
  // component (e.g. `if (this.applyStarted)`) via a getter/setter pair so
  // the existing imperative call-sites don't need to learn signal syntax.
  applyStartedSignal = signal<boolean>(false);
  get applyStarted(): boolean { return this.applyStartedSignal(); }
  set applyStarted(v: boolean) { this.applyStartedSignal.set(v); }
  private iteration = 0;

  private connectService: ConnectEndpointService;
  private environmentInjector = inject(EnvironmentInjector);
  private injector = inject(Injector);
  private fb = inject(UntypedFormBuilder);
  private endpointsService = inject(EndpointsService);
  private endpointsData = inject(EndpointsDataService);
  private endpointsSignalConfig = inject(EndpointsSignalConfigService);

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
    // Subscribe before kicking off registration so the row monitor sees the
    // initial busy emit and the completion emit through reg.actionState.
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

    // Drive the row's actionState through busy → completed via the
    // Promise-returning signal-config register wrapper. The wrapper hides
    // the legacy ngrx pairwise/busy-edge dance, so we just emit the
    // initial busy state and the final settled state directly.
    reg.actionState.next({ busy: true, error: false, completed: false, message: '' });
    this.endpointsSignalConfig.register({
      endpointType: KUBERNETES_ENDPOINT_TYPE,
      endpointSubType: reg.cluster._subType,
      name: reg.cluster.name,
      endpoint: reg.cluster.cluster.server,
      skipSslValidation: reg.cluster.cluster['insecure-skip-tls-verify'],
    }).then(result => {
      reg.actionState.next({
        busy: false,
        error: result.error,
        completed: true,
        message: result.message,
      });
    }).catch(err => {
      reg.actionState.next({
        busy: false,
        error: true,
        completed: true,
        message: err?.message ?? 'Failed to register endpoint',
      });
    });
  }

  private doConnect(connect: KubeConfigImportAction, next: KubeConfigImportAction[]) {
    if (!connect.user) {
      connect.state.next({ message: 'Can not connect - no user specified', error: true });
      return;
    }
    const helper = new KubeConfigAuthHelper();
    const data = helper.getAuthDataForConnect(this.environmentInjector, this.injector, this.fb, connect.user);
    if (data) {
      const obs$ = this.connectEndpoint(connect, data);

      // Echo obs$ to the behaviour subject
      this.subs.push(obs$.subscribe(connect.actionState));

      this.subs.push(connect.actionState.asObservable().pipe(
        filter((status: IActionMonitorComponentState) => status.completed),
        take(1)
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
    this.connectService = new ConnectEndpointService(this.endpointsService, config, this.endpointsData, this.injector);
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
      return observableOf({ success: true, redirect: true });

    } else {
      this.applyStarted = true;
      this.busy.next(true);
      this.data$.pipe(
        filter((data => data && data.length > 0)),
        take(1)
      ).subscribe(imports => {
        // Go through the imports and dispatch the actions to perform them in sequence
        this.processAction([...imports]);
      });
      return observableOf({ success: true, ignoreSuccess: true });
    }
  };

}
