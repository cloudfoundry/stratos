import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
  computed,
  inject,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import {
  AppInputDirective,
  CardStatusComponent,
  ConfirmationDialogConfig,
  ConfirmationDialogService,
  CurrentUserPermissionsService,
  CustomFormFieldComponent,
  TailwindSnackBarRef,
  TailwindSnackBarService,
} from '@stratosui/core';
import { ApplicationService } from '../../../../features/applications/application.service';
import { AppDetailDataService } from '../../../../features/applications/app-detail-data.service';
import { CfAppsSignalConfigService } from '../../../signal-list-configs/app/cf-apps-signal-config.service';
import { CfCurrentUserPermissions } from '../../../../user-permissions/cf-user-permissions-checkers';

const appInstanceScaleToZeroConfirmation = new ConfirmationDialogConfig(
  'Set Instance count to 0',
  'Are you sure you want to set the instance count to 0?',
  'Confirm',
  true,
);

/**
 * Signal-native instances summary card.
 *
 * Reskin of the legacy ngrx-coupled card per slice-2 design (decision #6):
 * same surface (running/desired counts + scale up/down/edit row), but reads
 * directly from `AppDetailDataService` signals and styles via Tailwind.
 *
 * The action-bar lifecycle verbs (start/stop/restart/restage) live in
 * `AppApplicationActionsService` and render on the action bar — not on this
 * card. This card's actions are scaling actions (edit instance count).
 *
 * SCSS is gone: position-absolute corner placement of the action row is now
 * a Tailwind `absolute top-4 right-4` and the legacy 16px font-size is
 * `text-base`.
 */
@Component({
  selector: 'app-card-app-instances',
  templateUrl: './card-app-instances.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    AppInputDirective,
    CustomFormFieldComponent,
    CardStatusComponent,
  ],
})
export class CardAppInstancesComponent implements OnDestroy {
  appService = inject(ApplicationService);
  private dataService = inject(AppDetailDataService);
  private apps = inject(CfAppsSignalConfigService);
  private confirmDialog = inject(ConfirmationDialogService);
  private snackBar = inject(TailwindSnackBarService);
  private cups = inject(CurrentUserPermissionsService);

  /** Should the card show the scale/edit actions? */
  @Input() showActions = false;

  @Input() busy: any;

  @ViewChild('instanceField', { static: true }) instanceField!: ElementRef;

  // ---------------------------------------------------------------------------
  // Signal-native reads
  // ---------------------------------------------------------------------------

  /** RUNNING instance count from per-instance stats. */
  readonly runningCount = computed(() => {
    const stats = this.dataService.stats();
    if (!stats?.length) return 0;
    return stats.filter(s => s.state === 'RUNNING').length;
  });

  /** Desired instance count off the app entity. */
  readonly desiredCount = computed(() => this.dataService.app()?.entity?.instances ?? 0);

  /** Card status indicator — feeds the colored bar via Observable bridge. */
  readonly status$ = toObservable(this.dataService.state).pipe(map(s => s?.indicator));

  /** Disable scale buttons while an app-level update is in flight. */
  readonly isUpdating = computed(() => this.dataService.loading().app);

  /** True when the app entity reports STARTED. */
  readonly isRunning = computed(() => this.dataService.running());

  /**
   * Edit-permission gate. Wraps the perm-check Observable into a signal
   * so the template stays pipe-free. canEdit() is null while the perm
   * check is pending and resolves to a boolean after it lands.
   */
  readonly canEdit = toSignal(
    combineLatest([this.appService.appOrg$, this.appService.appSpace$]).pipe(
      switchMap(([org, space]) =>
        this.cups.can(
          CfCurrentUserPermissions.APPLICATION_EDIT,
          this.appService.cfGuid,
          org!.guid,
          space!.guid,
        ),
      ),
    ),
    { initialValue: false },
  );

  // ---------------------------------------------------------------------------
  // Edit state
  // ---------------------------------------------------------------------------

  public isEditing = false;
  public editValue: any;

  private snackBarRef!: TailwindSnackBarRef<any>;

  ngOnDestroy(): void {
    if (this.snackBarRef) {
      this.snackBarRef.dismiss();
    }
  }

  scaleUp() {
    this.setInstanceCount(this.desiredCount() + 1);
  }

  scaleDown() {
    this.setInstanceCount(this.desiredCount() - 1);
  }

  edit() {
    this.editValue = this.desiredCount();
    this.isEditing = true;
    setTimeout(() => {
      // ngIf-style structural switch may keep the input out of the DOM
      // until the next CD cycle on first edit click; guard the focus.
      this.instanceField?.nativeElement?.focus();
    }, 0);
  }

  finishEdit(ok: boolean) {
    this.isEditing = false;
    if (ok) {
      this.setInstanceCount(parseInt(this.editValue, 10));
    }
  }

  /** Set instance count. Ask for confirmation if setting count to 0. */
  private setInstanceCount(value: number) {
    const doUpdate = async () => {
      try {
        await this.apps.scaleApp(this.appService.cfGuid, this.appService.appGuid, { instances: value });
        // Refresh both signals in parallel so the Status and Instances
        // cards converge as soon as the scale job resolves: the app
        // entity carries the new desired count (denominator), stats
        // carry the per-container state list (numerator + total). The
        // legacy ngrx dispatch (cfEntityCatalog.appStats.actions.
        // getMultiple) doesn't feed _appDetail/_stats and left both
        // cards lagging the focus-poll cadence; explicit refreshes
        // restore the legacy "matches quickly" behaviour.
        await Promise.all([
          this.dataService.refresh('app'),
          this.dataService.refresh('stats'),
        ]);
      } catch (err: any) {
        this.snackBarRef = this.snackBar.error(`Failed to update instance count: ${err?.message ?? err}`);
      }
    };
    if (value === 0) {
      this.confirmDialog.open(appInstanceScaleToZeroConfirmation, doUpdate);
    } else {
      doUpdate();
    }
  }
}
