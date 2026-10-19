import { ChangeDetectionStrategy, Component, EnvironmentInjector, Injector, OnDestroy, Signal, WritableSignal, computed, inject, signal } from '@angular/core';

import { UntypedFormBuilder } from '@angular/forms';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { filter, map, startWith, take } from 'rxjs/operators';

import { createSignalWrapper, EndpointsDataService } from '@stratosui/store';

import { EndpointsService } from '../../../../../core/src/core/endpoints.service';
import { safeUnsubscribe } from '../../../../../core/src/core/utils.service';
import {
  ConnectEndpointConfig,
  ConnectEndpointData,
  ConnectEndpointService,
} from '../../../../../core/src/features/endpoints/connect.service';
import { EndpointsSignalConfigService } from '../../../../../core/src/features/endpoints/endpoints-page/endpoints-signal-config.service';
import {
  AppActionMonitorIconComponent,
  IActionMonitorComponentState,
} from '../../../../../core/src/shared/components/app-action-monitor-icon/app-action-monitor-icon.component';
import {
  RowState,
} from '../../../../../core/src/shared/components/signal-list/row-state.types';
import {
  SignalListColumn,
  SignalListComponent,
  SignalListConfig,
  SignalListRowState,
} from '../../../../../core/src/shared/components/signal-list/signal-list.component';
import {
  SignalListCellTemplateDirective,
} from '../../../../../core/src/shared/components/signal-list/signal-list-cell-template.directive';
import { StepOnNextFunction } from '../../../../../core/src/shared/components/stepper/step/step.component';
import { KUBERNETES_ENDPOINT_TYPE } from '../../kubernetes-entity-factory';
import { KubeConfigAuthHelper } from '../kube-config-auth.helper';
import { KubeConfigFileCluster, KubeConfigImportAction } from '../kube-config.types';

const REGISTER_ACTION = 'Register endpoint';
const CONNECT_ACTION = 'Connect endpoint';

@Component({
selector: 'app-kube-config-import',
  templateUrl: './kube-config-import.component.html',
  host: { class: 'flex flex-1' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    SignalListComponent,
    SignalListCellTemplateDirective,
    AppActionMonitorIconComponent,
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

  // ── signal-list paging ────────────────────────────────────────────────
  // The import list is a handful of sequential actions, so it's effectively
  // single-page; hidePagerWhenSingle hides the pager chrome.
  private readonly pageIndex: WritableSignal<number> = signal(0);
  private readonly pageSize: WritableSignal<number> = signal(100);
  private readonly totalFilteredResults: Signal<number> = computed(() => this.data().length);
  private readonly totalPages: Signal<number> = computed(() => {
    const size = this.pageSize();
    return size > 0 ? Math.max(1, Math.ceil(this.totalFilteredResults() / size)) : 1;
  });
  private readonly pagedItems: Signal<KubeConfigImportAction[]> = computed(() => {
    const size = this.pageSize();
    const rows = this.data();
    if (size <= 0) return rows;
    // Clamp a stale out-of-range index to the last available page so
    // paging state can't render an empty page over a non-empty list
    // (#5670).
    const lastPage = Math.max(0, Math.ceil(rows.length / size) - 1);
    const idx = Math.max(0, Math.min(this.pageIndex(), lastPage));
    return rows.slice(idx * size, idx * size + size);
  });
  // Loading while the actions list is still empty — mirrors the legacy
  // isTableLoading$ = !(data && data.length > 0).
  private readonly loading: Signal<boolean> = computed(() => this.data().length === 0);

  public listConfig: SignalListConfig<KubeConfigImportAction> = {
    pagedItems: this.pagedItems,
    totalFilteredResults: this.totalFilteredResults,
    totalPages: this.totalPages,
    pageIndex: this.pageIndex,
    pageSize: this.pageSize,
    hidePagerWhenSingle: true,
    isAnyLoading: this.loading,
    errorsByCnsi: signal(new Map()),
    // description is stable + unique per action ("Register …" / "Connect …");
    // `action` is nulled on skip so it can't key the row. iteration keeps
    // keys distinct across step re-entries.
    getRowKey: (row: KubeConfigImportAction) => `${row.description}#${this.iteration}`,
    // Per-action error/warning messages (skip notice, register/connect
    // failures) ride rowState; `state` is a createSignalWrapper, callable
    // as a Signal and stable per action.
    rowState: (row: KubeConfigImportAction) => row.state as unknown as Signal<SignalListRowState>,
    columns: this.buildColumns(),
  };

  private buildColumns(): SignalListColumn<KubeConfigImportAction>[] {
    return [
      {
        header: 'Action', key: 'action', kind: 'text', widthHint: '16rem',
        render: (row: KubeConfigImportAction) => row.action || '',
      },
      {
        header: 'Description', key: 'description', kind: 'text',
        render: (row: KubeConfigImportAction) => row.description,
      },
      {
        header: '', key: 'status', kind: 'template', templateName: 'status', widthHint: '3rem',
        render: () => '',
      },
    ];
  }

  // Per-row Observable for the action-monitor icon. asObservable() returns
  // the same instance on every call, so the template binding does not
  // re-subscribe each change-detection pass.
  actionStateFor(row: KubeConfigImportAction): Observable<IActionMonitorComponentState> {
    return row.actionState.asObservable();
  }

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

  private connectService?: ConnectEndpointService;
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
    // strict: actions.length === 0 was handled above, so shift() yields a value
    const i = actions.shift()!;
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
      if (progress.error) {
        // Mark all dependency jobs as skip
        next.forEach(action => {
          if (action.depends === reg) {
            // Mark it as skipped by setting the action to null
            action.action = null;
            action.state.next({ message: 'Skipping action as endpoint could not be registered', warning: true });
          }
        });
        reg.state.next({ message: progress.message || 'Failed to register endpoint', error: true });
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
      endpointSubType: reg.cluster._subType ?? null,
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
      this.processAction(next);
      return;
    }
    // This runs inside the previous row's status callback, so a throw here
    // would stop the import: fail this row and move on instead.
    let data: ConnectEndpointData | null;
    try {
      data = new KubeConfigAuthHelper().getAuthDataForConnect(this.environmentInjector, this.injector, this.fb, connect.user);
    } catch (err) {
      connect.state.next({ message: (err as Error)?.message || 'Can not connect - could not get user auth data', error: true });
      this.processAction(next);
      return;
    }
    if (data) {
      const obs$ = this.connectEndpoint(connect, data);

      // Echo obs$ to the row's action state. The wrapper is not an observer
      // (calling it reads the signal), so forward each value explicitly; a
      // failed connect completes the row as an error so the import goes on.
      this.subs.push(obs$.subscribe({
        next: status => connect.actionState.next(status),
        error: err => connect.actionState.next({
          busy: false,
          error: true,
          completed: true,
          message: err?.message || 'Failed to connect endpoint',
        }),
      }));

      this.subs.push(connect.actionState.asObservable().pipe(
        filter((status: IActionMonitorComponentState) => status.completed),
        take(1)
      ).subscribe((status: IActionMonitorComponentState) => {
        if (status.error) {
          connect.state.next({ message: status.message || 'Failed to connect endpoint', error: true });
        }
        this.processAction(next);
      }));
    } else {
      connect.state.next({ message: 'Can not connect - could not get user auth data', error: true });
      this.processAction(next);
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
      guid: action.depends?.cluster._guid || action.cluster._guid,
      type: KUBERNETES_ENDPOINT_TYPE,
      // strict: connectEndpoint is only reached from doConnect, which returns
      // early unless connect.user is set
      subType: action.user!._authData.subType,
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
