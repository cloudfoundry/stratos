import { Injectable, computed, inject, signal, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { ConfirmationDialogConfig, ConfirmationDialogService } from '@stratosui/core';
import { ResetPagination } from '@stratosui/store';

import { CFAppState } from '../../cf-app-state';
import { cfEntityCatalog } from '../../cf-entity-catalog';
import { ApplicationService } from '../../features/applications/application.service';
import { AppDeleteSelectionService } from '../../features/applications/app-delete-selection.service';
import { AppDetailDataService } from '../../features/applications/app-detail-data.service';
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
  private dataService = inject(AppDetailDataService);
  private lifecycle = inject(AppLifecycleStateService);
  private cfEndpointService = inject(CloudFoundryEndpointService);
  private confirmDialog = inject(ConfirmationDialogService);
  private store = inject<Store<CFAppState>>(Store);
  private router = inject(Router);
  private apps = inject(CfAppsSignalConfigService);
  private deleteSelection = inject(AppDeleteSelectionService);

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
  // showProgress drives the lifecycle snackbar's mount window. It goes true
  // when an op begins and stays true through a 10s linger past terminal state
  // so the operator has time to read the outcome (verb + final stage). The
  // overlay's @if gate reads this signal; the in-flight spinner reads inFlight().
  private readonly _showProgress = signal(false);
  private readonly _currentTarget = signal<{ app: string; cf: string; org: string; space: string } | null>(null);
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  readonly progress: Signal<JobStage[] | null> = this._progress.asReadonly();
  readonly currentStage = computed(() => {
    const s = this._progress();
    return s && s.length ? s[s.length - 1] : null;
  });
  readonly verb: Signal<LifecycleVerb | null> = this._verb.asReadonly();
  readonly log: Signal<OperationLogEntry[]> = this._log.asReadonly();
  readonly showProgress: Signal<boolean> = this._showProgress.asReadonly();
  readonly currentTarget = this._currentTarget.asReadonly();
  // outcome() exposes the terminal event of the most recent op for the
  // snackbar's linger-window display. Null while in flight.
  readonly outcome = computed<'success' | 'fail' | null>(() => {
    if (this.inFlight()) return null;
    const log = this._log();
    for (let i = log.length - 1; i >= 0; i--) {
      if (log[i].event === 'success') return 'success';
      if (log[i].event === 'fail') return 'fail';
    }
    return null;
  });
  readonly outcomeError = computed<string | null>(() => {
    if (this.outcome() !== 'fail') return null;
    const log = this._log();
    for (let i = log.length - 1; i >= 0; i--) {
      if (log[i].event === 'fail') return log[i].error?.message ?? 'Operation failed';
    }
    return null;
  });
  // Human-readable label for the snackbar title. Gerund while in flight
  // ("Starting"); past-tense + outcome during linger ("Started", "Start failed").
  readonly displayLabel = computed<string>(() => {
    const v = this._verb();
    if (!v) return '';
    const inFlight = this.inFlight();
    const gerund: Record<LifecycleVerb, string> = {
      STARTING: 'Starting', STOPPING: 'Stopping', RESTARTING: 'Restarting',
      RESTAGING: 'Restaging', DELETING: 'Deleting',
    };
    const past: Record<LifecycleVerb, string> = {
      STARTING: 'Started', STOPPING: 'Stopped', RESTARTING: 'Restarted',
      RESTAGING: 'Restaged', DELETING: 'Deleted',
    };
    const action: Record<LifecycleVerb, string> = {
      STARTING: 'Start', STOPPING: 'Stop', RESTARTING: 'Restart',
      RESTAGING: 'Restage', DELETING: 'Delete',
    };
    if (inFlight) return gerund[v];
    if (this.outcome() === 'success') return past[v];
    if (this.outcome() === 'fail') return `${action[v]} failed`;
    return gerund[v];
  });

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
    verb: 'start' | 'stop' | 'restart' | 'restage' | 'delete',
    target: string,
    action: (opts: { onProgress: (job: StratosJob) => void }) => Promise<void>,
    onAfter?: () => void,
  ): void {
    const { cfGuid, appGuid } = this.applicationService;
    const lifecycleVerb: LifecycleVerb =
      verb === 'start' ? 'STARTING' :
      verb === 'stop' ? 'STOPPING' :
      verb === 'restart' ? 'RESTARTING' :
      verb === 'restage' ? 'RESTAGING' : 'DELETING';

    // Decompose the target string back into named parts for log entries.
    // Format from buildDialog: "<appName> on <cfName> / <orgName> / <spaceName>"
    // Fall back to the raw target string if parsing fails.
    const parsedTarget = this.parseTarget(target);

    // If a previous linger window is still open from a prior op, cancel it
    // so the new op's window starts clean. Without this, a fast follow-up
    // would inherit the tail of the previous timer and clear too early.
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }

    this.lifecycle.setInFlight(true);
    this._verb.set(lifecycleVerb);
    this._progress.set([]);
    this._currentTarget.set(parsedTarget);
    this._showProgress.set(true);
    this.appendLog({ at: new Date(), verb: lifecycleVerb, target: parsedTarget, event: 'begin' });

    // Single feedback channel: AppLifecycleProgressComponent mounts via the
    // CDK Overlay for the full op + 10s linger window. No MatSnackBar pops
    // on completion — the overlay carries the terminal state itself.

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
        // Eagerly drop the deleted app's row from the app-wall orchestrator
        // so the post-delete window doesn't leave the gone-app's
        // (cnsi, appGuid) keys in `allItems`. Without this the stats
        // poller's effect refires on the deleted row's keys and emits 1-2
        // transient 404s before the next refresh catches up. The
        // orchestrator is only built once the app-wall mounts; on direct
        // detail-page navigation it stays undefined — optional-chain plus
        // the wave-1 idempotent removeItem keeps this safe in every path.
        if (verb === 'delete') {
          this.apps.orchestrator?.removeRow(cfGuid, appGuid);
        }
        // Skip post-success refreshes for delete — the app is gone, so
        // GET /apps/:guid 404s and stats fetches return empty. The
        // onAfter callback handles navigation to /applications instead.
        if (verb !== 'delete') {
          // Refresh ngrx-backed entity store (legacy consumers still rely on it).
          cfEntityCatalog.application.api.get(appGuid, cfGuid, {});
          this.dispatchAppStats();
          // Refresh only the signals that can change post-action: app entity
          // (state) and stats (running/total). Skip space/org/domains which
          // physically can't change during a lifecycle op — refreshing them
          // flips their loading signals and produces a visible card-wide
          // flicker. envVars is conditionally refreshed below.
          void this.dataService.refresh('app');
          void this.dataService.refresh('stats');
          // Start, restart, and restage all bring containers up and bind
          // services — any of which can refresh the env. Restage rebinds
          // and may inject fresh VCAP_SERVICES / VCAP_APPLICATION. Restart
          // and start pick up rotated CUPS credentials and any env-var
          // edits made while the app was stopped. Pull envVars once on
          // success so the Variables tab reflects post-op truth without
          // waiting for the user to navigate there. Stop doesn't change
          // env (the container goes down with whatever it had), skip it.
          if (verb === 'start' || verb === 'restart' || verb === 'restage') {
            void this.dataService.refresh('envVars');
          }
          // Boot-settling poll for verbs that bring containers up: CF returns
          // STARTED on the app entity as soon as it accepts the command, but
          // /v3/processes/.../stats reports 0 RUNNING for several seconds
          // while the container actually boots. Without this, the Instances
          // card sticks at "0/1" until the next 45 s idle-poll catches up.
          if (verb === 'start' || verb === 'restart' || verb === 'restage') {
            this.startSettlingPoll();
          }
        }
        onAfter?.();
      })
      .catch((err: any) => {
        const firstError = err?.job?.errors?.[0];
        this.appendLog({
          at: new Date(), verb: lifecycleVerb, target: parsedTarget, event: 'fail',
          error: firstError ? { code: String(firstError.code), message: String(firstError.message) } : undefined,
        });
        this.dispatchAppStats();
        // Failure path may have left CF in a partial state — refresh to
        // pick up whatever the actual current state is.
        void this.dataService.refresh('all');
      })
      .finally(() => {
        this.lifecycle.setInFlight(false);
        // Visibility window: keep the snackbar mounted for 10 seconds after
        // terminal state so the operator has time to read the outcome.
        // (Total visible duration = op_duration + 10s, with a 10s floor.)
        this.hideTimer = setTimeout(() => {
          this._verb.set(null);
          this._progress.set(null);
          this._currentTarget.set(null);
          this._showProgress.set(false);
          this.hideTimer = null;
        }, 10000);
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

  // After a start/restart/restage success, poll stats every 5 s for up to
  // 60 s — bridging the gap between "CF accepted the command" (state goes
  // STARTED immediately) and "containers are actually RUNNING" (stats
  // catches up over the next several seconds). Stops early when running
  // == desired, or after the hard cap. Reentrant: a new op cancels any
  // in-flight settling timer so we don't double-poll.
  //
  // Refreshes only `app` + `stats` (parallel) — the only signals that
  // can change during container boot. envVars, space, org, and domains
  // are stable; a full refresh('all') fired loading signals on every
  // kind and caused visible UI flicker across summary/info/cf cards.
  private settlingTimer: ReturnType<typeof setInterval> | null = null;
  private startSettlingPoll(): void {
    if (this.settlingTimer) {
      clearInterval(this.settlingTimer);
      this.settlingTimer = null;
    }
    const maxAttempts = 12;          // 12 × 5 s = 60 s ceiling
    const intervalMs = 5000;
    let attempts = 0;
    this.settlingTimer = setInterval(() => {
      attempts++;
      void Promise.all([
        this.dataService.refresh('app'),
        this.dataService.refresh('stats'),
      ]).then(() => {
        const desired = this.dataService.app()?.entity?.instances ?? 0;
        const running = (this.dataService.stats() ?? []).filter(s => s.state === 'RUNNING').length;
        const reachedSteadyState = desired > 0 && running >= desired;
        if (reachedSteadyState || attempts >= maxAttempts) {
          if (this.settlingTimer) {
            clearInterval(this.settlingTimer);
            this.settlingTimer = null;
          }
        }
      });
    }, intervalMs);
  }

  // Reads app/endpoint/org/space names from sync signals on the parent
  // page. By the time the user can click an action button, those signals
  // are populated (the data service finished its initial fetch as part
  // of mounting the app-detail subtree). No await race; no fallback to
  // GUIDs in normal flow.
  // Returns a fully-qualified target string alongside the config so the
  // lifecycle snackbar can echo the same disambiguation the operator just
  // confirmed: "Restaging sample-go-app on dup3 / opensource / openproject…"
  // — the snackbar previously showed only the app name, which was useless
  // on multi-CF deployments where the same name exists in several places.
  private buildDialog(
    title: string,
    verb: string,
    confirmLabel: string,
    preResolved?: { appName: string; endpointName: string; orgName: string; spaceName: string },
  ): { cfg: ConfirmationDialogConfig; target: string } {
    // Three resolution paths in priority order:
    //   1. preResolved — caller already has the names (delete wizard)
    //   2. sync signal reads — hot path, action bar firing on app summary
    //   3. fallback to appGuid / cfGuid / "?" — only if signals aren't
    //      populated yet, which on the live action bar shouldn't happen
    let appName: string;
    let cfName: string;
    let orgName: string;
    let spaceName: string;
    if (preResolved?.appName && preResolved?.endpointName) {
      appName = preResolved.appName;
      cfName = preResolved.endpointName;
      orgName = preResolved.orgName || '?';
      spaceName = preResolved.spaceName || '?';
    } else {
      appName = this.dataService.app()?.entity?.name ?? this.applicationService.appGuid;
      cfName = this.cfEndpointService.endpoint()?.entity?.name ?? this.applicationService.cfGuid;
      orgName = this.dataService.org()?.entity?.name ?? '?';
      spaceName = this.dataService.space()?.entity?.name ?? '?';
    }
    const message =
      `${verb} "${appName}" on Cloud Foundry "${cfName}" — org "${orgName}" / space "${spaceName}"?`;
    const cfg = new ConfirmationDialogConfig(`${title}: ${appName}`, message, confirmLabel);
    const target = `${appName} on ${cfName} / ${orgName} / ${spaceName}`;
    return { cfg, target };
  }

  async restart() {
    const { cfg, target } = this.buildDialog('Restart', 'Are you sure you want to restart', 'Restart');
    this.confirmDialog.open(cfg, () => {
      this.runLifecycleAction('restart', target, ({ onProgress }) => this.apps.restartApp(
        this.applicationService.cfGuid,
        this.applicationService.appGuid,
        { onProgress },
      ));
    });
  }

  async stop() {
    const { cfg, target } = this.buildDialog('Stop', 'Are you sure you want to stop', 'Stop');
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
    const { cfg, target } = this.buildDialog('Start', 'Are you sure you want to start', 'Start');
    this.confirmDialog.open(cfg, () => {
      this.runLifecycleAction(
        'start',
        target,
        ({ onProgress }) => this.apps.startApp(this.applicationService.cfGuid, this.applicationService.appGuid, { onProgress }),
      );
    });
  }

  async restage() {
    const { cfg, target } = this.buildDialog('Restage', 'Are you sure you want to restage', 'Restage');
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
    // All four names read synchronously from signals on the parent page:
    // app/org/space from AppDetailDataService, endpoint from
    // CloudFoundryEndpointService.endpoint. No await, no race, no
    // fallback strings — by the time the user can click trash, every
    // signal is populated. Both the wizard's Confirm step and the
    // post-wizard "Are you sure?" dialog read this seed, so the
    // wrong-org/space disambiguator stays visible at every step.
    this.deleteSelection.seed(appGuid, {
      appName: this.dataService.app()?.entity?.name ?? appGuid,
      endpointName: this.cfEndpointService.endpoint()?.entity?.name ?? cfGuid,
      orgName: this.dataService.org()?.entity?.name ?? '',
      spaceName: this.dataService.space()?.entity?.name ?? '',
    });
    this.router.navigate(['/applications', cfGuid, appGuid, 'delete']);
  }

  /**
   * Orchestrated delete: walks routes → service bindings → app delete as
   * a single DELETING lifecycle event so the progress overlay shows the
   * whole sequence (one verb, three stages) instead of three independent
   * actions. Caller passes the selections collected by the wizard;
   * empty arrays skip the corresponding stage.
   *
   * Surfaces "Are you sure?" via ConfirmationDialogService — the wizard
   * already collected selections so this is the user's last chance to
   * abort. On confirm, the route + binding cleanup runs first so CF
   * doesn't reject the app delete with attached dependencies. On
   * success, navigates to the app wall.
   */
  async deleteWithCleanup(
    routes: { guid: string }[],
    bindings: { guid: string }[],
    preResolvedTarget?: { appName: string; endpointName: string; orgName: string; spaceName: string },
  ): Promise<void> {
    const { cfg, target } = this.buildDialog('Delete', 'Are you sure you want to delete', 'Delete', preResolvedTarget);
    this.confirmDialog.open(cfg, () => {
      this.runLifecycleAction(
        'delete',
        target,
        async ({ onProgress }) => {
          const { cfGuid, appGuid } = this.applicationService;
          const stages: StratosJob['stages'] = [];
          // Compute total stage count up front so the progress strip
          // shows "1/N" / "2/N" with the right denominator from frame 1.
          const ofN = (routes.length ? 1 : 0) + (bindings.length ? 1 : 0) + 1;
          const emit = (code: string, label: string) => {
            stages.push({ code, label, index: stages.length + 1, of: ofN, enteredAt: new Date().toISOString() });
            const now = new Date().toISOString();
            onProgress({
              id: '',
              kind: 'app.delete',
              state: 'PROCESSING',
              startedAt: now,
              updatedAt: now,
              stages: [...stages],
            });
          };

          if (routes.length) {
            emit('CLEANUP_ROUTES', `Removing ${routes.length} route${routes.length === 1 ? '' : 's'}`);
            await Promise.all(routes.map(r => this.apps.deleteRoute(cfGuid, r.guid)));
          }
          if (bindings.length) {
            emit('CLEANUP_BINDINGS', `Unbinding ${bindings.length} service${bindings.length === 1 ? '' : 's'}`);
            await Promise.all(bindings.map(b => this.apps.deleteServiceBinding(cfGuid, b.guid)));
          }
          emit('DELETE_APP', 'Deleting application');
          await this.apps.deleteApp(cfGuid, appGuid);
        },
        () => {
          // App is gone — navigate to the app wall instead of staying on
          // the now-orphaned detail page.
          this.router.navigate(['/applications']);
        },
      );
    });
  }
}
