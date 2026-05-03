import { Injectable, computed, inject, signal, WritableSignal, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { firstValueFrom, race, timer } from 'rxjs';
import { map } from 'rxjs/operators';

import { ConfirmationDialogConfig, ConfirmationDialogService, TailwindSnackBarService } from '@stratosui/core';
import { ResetPagination } from '@stratosui/store';

import { CFAppState } from '../../cf-app-state';
import { cfEntityCatalog } from '../../cf-entity-catalog';
import { ApplicationService } from '../../features/applications/application.service';
import { AppLifecycleStateService } from '../../features/applications/app-lifecycle-state.service';
import { CloudFoundryEndpointService } from '../../features/cf/services/cloud-foundry-endpoint.service';
import { CfAppsSignalConfigService } from '../components/list/list-types/app/cf-apps-signal-config.service';
import type { JobStage, StratosJob } from '../../services/async-jobs/async-job.types';

/**
 * AppApplicationActionsService
 *
 * Houses the lifecycle action methods (start/stop/restart/restage) and the
 * delete-redirect for an application detail page. Extracted from
 * BuildTabComponent so the action bar can be hosted at the application-tabs-base
 * level and appear on every detail tab.
 *
 * Component-scoped (NOT providedIn:'root'): ApplicationService is component-
 * scoped at ApplicationBaseComponent (depends on CF_GUID / APP_GUID tokens
 * that only exist in that component's injector). A root-scoped service
 * cannot inject ApplicationService — Angular would try to instantiate it
 * in the root injector, where CF_GUID has no provider, and throw NG0201.
 * Provide on the action bar component instead.
 *
 * Each confirmation dialog is built dynamically from the live observables
 * (app, endpoint, org, space) so the operator can see exactly which
 * application is about to be acted on. The static "Are you sure you want
 * to stop this Application?" message was a foot-gun on multi-CF
 * deployments where the same app name exists in multiple spaces or under
 * multiple CF endpoints sharing a domain.
 */
type LifecycleVerb = 'STARTING' | 'STOPPING' | 'RESTARTING' | 'RESTAGING' | 'DELETING';

interface OperationLogEntry {
  at: Date;
  verb: LifecycleVerb;
  target: { app: string; cf: string; org: string; space: string };
  event: 'begin' | 'stage' | 'success' | 'fail';
  stage?: JobStage;
  error?: { code: string; message: string };
}

@Injectable()
export class AppApplicationActionsService {
  private applicationService = inject(ApplicationService);
  private lifecycle = inject(AppLifecycleStateService);
  private cfEndpointService = inject(CloudFoundryEndpointService);
  private confirmDialog = inject(ConfirmationDialogService);
  private snackBar = inject(TailwindSnackBarService);
  private store = inject<Store<CFAppState>>(Store);
  private router = inject(Router);
  private apps = inject(CfAppsSignalConfigService);

  // In-flight flag delegates to AppLifecycleStateService — the leaf
  // shared-state service used to break the construction cycle with
  // AppDetailDataService (which polls faster while writes are in flight).
  // Both services depend on AppLifecycleStateService rather than each other.
  readonly inFlight: Signal<boolean> = this.lifecycle.inFlight;

  // Live progress signals — null when idle, populated during in-flight ops.
  // currentStage() reflects the latest stage received from the backend; Tasks
  // 9 (snackbar) and 10 (status card) read these to render the running ticker.
  private readonly _progress = signal<JobStage[] | null>(null);
  private readonly _verb = signal<LifecycleVerb | null>(null);
  private readonly _log = signal<OperationLogEntry[]>([]);

  readonly progress: Signal<JobStage[] | null> = this._progress.asReadonly();
  readonly currentStage = computed(() => {
    const s = this._progress();
    return s && s.length ? s[s.length - 1] : null;
  });
  readonly verb: Signal<LifecycleVerb | null> = this._verb.asReadonly();
  readonly log: Signal<OperationLogEntry[]> = this._log.asReadonly();

  constructor() {
    // Diagnostic surface for Playwright + browser-console inspection.
    // Per reference_playwright_diag_pattern.md — no UI surface in slice 1.
    if (typeof window !== 'undefined') {
      (window as any).__stratosOps = {
        log: () => this._log(),
        current: () => ({
          inFlight: this.inFlight(),
          verb: this._verb(),
          stage: this.currentStage(),
        }),
      };
    }
  }

  // Lifecycle actions (start/stop/restart/restage) flow through the
  // Stratos async-job contract via CfAppsSignalConfigService: writeWithJob
  // hits POST /pp/v1/cf/apps/{cnsi}/{app}/actions/{action} and awaits the
  // CF-side job to terminal state. On resolve we refetch the app entity
  // and stats so the summary reflects the new state.
  //
  // The verb param drives the user-visible snackbar so the operator gets
  // an unambiguous "Restaging app-1-11..." -> "Restage complete" /
  // "Restage failed: <reason>" feedback loop. Without it the status card
  // sometimes appears unchanged during the in-flight window (especially
  // restage, where CF cycles through states the UI debounces) and the
  // user has no signal that the action was even acknowledged.
  private runLifecycleAction(
    verb: 'start' | 'stop' | 'restart' | 'restage',
    target: string,
    action: (opts: { onProgress: (job: StratosJob) => void }) => Promise<void>,
    onAfter?: () => void,
  ): void {
    const { cfGuid, appGuid } = this.applicationService;
    const gerund: Record<typeof verb, string> = {
      start: 'Starting', stop: 'Stopping', restart: 'Restarting', restage: 'Restaging',
    };
    const past: Record<typeof verb, string> = {
      start: 'Started', stop: 'Stopped', restart: 'Restarted', restage: 'Restaged',
    };
    const lifecycleVerb: LifecycleVerb =
      verb === 'start' ? 'STARTING' :
      verb === 'stop' ? 'STOPPING' :
      verb === 'restart' ? 'RESTARTING' : 'RESTAGING';

    // Decompose the target string back into named parts for log entries.
    // Format from buildDialog: "<appName> on <cfName> / <orgName> / <spaceName>"
    // Fall back to the raw target string if parsing fails.
    const parsedTarget = this.parseTarget(target);

    this.lifecycle.setInFlight(true);
    this._verb.set(lifecycleVerb);
    this._progress.set([]);
    this.appendLog({ at: new Date(), verb: lifecycleVerb, target: parsedTarget, event: 'begin' });

    // The in-flight snackbar is no longer opened here — AppLifecycleProgressComponent
    // mounts automatically via the CDK Overlay when inFlight() becomes true.
    // Terminal success/failure announcements still use snackBar (different content,
    // transient, appropriate for MatSnackBar semantics).

    const onProgress = (job: StratosJob) => {
      if (job.stages?.length) {
        this._progress.set([...job.stages]);
        const lastStage = job.stages[job.stages.length - 1];
        this.appendLog({ at: new Date(), verb: lifecycleVerb, target: parsedTarget, event: 'stage', stage: lastStage });
      }
    };

    void action({ onProgress })
      .then(() => {
        this.appendLog({ at: new Date(), verb: lifecycleVerb, target: parsedTarget, event: 'success' });
        this.snackBar.open(`${past[verb]} ${target}`, 'Dismiss');
        cfEntityCatalog.application.api.get(appGuid, cfGuid, {});
        this.dispatchAppStats();
        onAfter?.();
      })
      .catch((err: any) => {
        const firstError = err?.job?.errors?.[0];
        this.appendLog({
          at: new Date(), verb: lifecycleVerb, target: parsedTarget, event: 'fail',
          error: firstError ? { code: String(firstError.code), message: String(firstError.message) } : undefined,
        });
        const msg = firstError?.message ?? err?.message ?? String(err);
        this.snackBar.open(`Failed to ${verb} ${target}: ${msg}`, 'Dismiss');
        this.dispatchAppStats();
      })
      .finally(() => {
        this.lifecycle.setInFlight(false);
        this._verb.set(null);
        // Settle delay: keep progress visible briefly after terminal state so
        // Tasks 9/10 can display "complete" before clearing the ticker.
        setTimeout(() => this._progress.set(null), 800);
      });
  }

  // Ring-buffer append: cap log at 50 entries, dropping oldest.
  private appendLog(entry: OperationLogEntry): void {
    this._log.update(l => {
      const next = [...l, entry];
      return next.length > 50 ? next.slice(next.length - 50) : next;
    });
  }

  // Parse the target string produced by buildDialog:
  // "<appName> on <cfName> / <orgName> / <spaceName>"
  private parseTarget(target: string): { app: string; cf: string; org: string; space: string } {
    const onIdx = target.indexOf(' on ');
    if (onIdx < 0) return { app: target, cf: '?', org: '?', space: '?' };
    const app = target.slice(0, onIdx);
    const rest = target.slice(onIdx + 4); // after " on "
    const parts = rest.split(' / ');
    return { app, cf: parts[0] ?? '?', org: parts[1] ?? '?', space: parts[2] ?? '?' };
  }

  private dispatchAppStats = () => {
    const { cfGuid, appGuid } = this.applicationService;
    cfEntityCatalog.appStats.api.getMultiple(appGuid, cfGuid);
  };

  // Resolves an observable's first emitted value within a 1s budget; falls
  // back to a default so the dialog never hangs if upstream data hasn't
  // arrived yet (e.g. user clicked Stop within the first second of page
  // load before appOrg$/endpoint$ have replayed).
  private async firstWithFallback<T>(obs$: any, fallback: T): Promise<T> {
    const timeout$ = timer(1000).pipe(map(() => fallback as T));
    return firstValueFrom(race(obs$ as any, timeout$)) as Promise<T>;
  }

  // Reads app/endpoint/org/space names from the live observables. Each is
  // gated by a 1s fallback so a slow-replaying observable (endpoint$ in
  // particular: it waits for the endpoint entity to load) doesn't strand
  // the dialog and leave the user staring at a non-responsive button.
  // Returns a fully-qualified target string alongside the config so the
  // lifecycle snackbar can echo the same disambiguation the operator just
  // confirmed: "Restaging sample-go-app on dup3 / opensource / openproject…"
  // — the snackbar previously showed only the app name, which was useless
  // on multi-CF deployments where the same name exists in several places.
  private async buildDialog(
    title: string,
    verb: string,
    confirmLabel: string,
  ): Promise<{ cfg: ConfirmationDialogConfig; target: string }> {
    const [appEntity, orgRes, spaceRes, endpointInfo] = await Promise.all([
      this.firstWithFallback<any>(this.applicationService.application$, null),
      this.firstWithFallback<any>(this.applicationService.appOrg$, null),
      this.firstWithFallback<any>(this.applicationService.appSpace$, null),
      this.firstWithFallback<any>(this.cfEndpointService.endpoint$, null),
    ]);
    const appName = appEntity?.app?.entity?.name ?? this.applicationService.appGuid;
    const orgName = orgRes?.entity?.name ?? '?';
    const spaceName = spaceRes?.entity?.name ?? '?';
    const cfName = endpointInfo?.entity?.name ?? this.applicationService.cfGuid;
    const message =
      `${verb} "${appName}" on Cloud Foundry "${cfName}" — org "${orgName}" / space "${spaceName}"?`;
    const cfg = new ConfirmationDialogConfig(`${title}: ${appName}`, message, confirmLabel);
    const target = `${appName} on ${cfName} / ${orgName} / ${spaceName}`;
    return { cfg, target };
  }

  async restart() {
    const { cfg, target } = await this.buildDialog('Restart', 'Are you sure you want to restart', 'Restart');
    this.confirmDialog.open(cfg, () => {
      this.runLifecycleAction('restart', target, ({ onProgress }) => this.apps.restartApp(
        this.applicationService.cfGuid,
        this.applicationService.appGuid,
        { onProgress },
      ));
    });
  }

  async stop() {
    const { cfg, target } = await this.buildDialog('Stop', 'Are you sure you want to stop', 'Stop');
    this.confirmDialog.open(cfg, () => {
      this.runLifecycleAction(
        'stop',
        target,
        ({ onProgress }) => this.apps.stopApp(this.applicationService.cfGuid, this.applicationService.appGuid, { onProgress }),
        () => {
          // On app reaching STOPPED, clear the stats pagination section
          // so a re-start comes up with fresh instance rows.
          const { cfGuid, appGuid } = this.applicationService;
          const getAppStatsAction = cfEntityCatalog.appStats.actions.getMultiple(appGuid, cfGuid);
          this.store.dispatch(new ResetPagination(getAppStatsAction, getAppStatsAction.paginationKey));
        },
      );
    });
  }

  async start() {
    const { cfg, target } = await this.buildDialog('Start', 'Are you sure you want to start', 'Start');
    this.confirmDialog.open(cfg, () => {
      this.runLifecycleAction(
        'start',
        target,
        ({ onProgress }) => this.apps.startApp(this.applicationService.cfGuid, this.applicationService.appGuid, { onProgress }),
      );
    });
  }

  async restage() {
    const { cfg, target } = await this.buildDialog('Restage', 'Are you sure you want to restage', 'Restage');
    this.confirmDialog.open(cfg, () => {
      this.runLifecycleAction(
        'restage',
        target,
        ({ onProgress }) => this.apps.restageApp(this.applicationService.cfGuid, this.applicationService.appGuid, { onProgress }),
      );
    });
  }

  redirectToDelete() {
    const { cfGuid, appGuid } = this.applicationService;
    this.router.navigate(['/applications', cfGuid, appGuid, 'delete']);
  }
}
