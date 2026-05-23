import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, Injector, inject, signal, Input } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, from, Observable, of, Subscription, throwError } from 'rxjs';
import { catchError, filter, map, switchMap, take, tap } from 'rxjs/operators';

import {
  AppInputDirective,
  CustomFormFieldComponent,
  CustomSelectComponent,
  CustomOptionComponent,
  CustomSlideToggleComponent,
  FocusDirective,
  SignalStepHandle,
  StepOnNextFunction,
  StepOnNextResult
} from '@stratosui/core';
import { CnsiSpacesSource } from '../../../../services/data-sources/cnsi-spaces-source';
import { EndpointDataRegistry } from '../../../../services/endpoint-data/endpoint-data.registry';
import { OrgDataRegistry } from '../../../../services/endpoint-data/org-data.registry';
import { QuotaDataService } from '../../../../services/endpoint-data/quota-data.service';
import { AddEditSpaceStepBase } from '../../add-edit-space-step-base';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { CloudFoundrySpaceService } from '../../services/cloud-foundry-space.service';

interface EditSpaceForm {
  spaceName: FormControl<string>;
  toggleSsh: FormControl<boolean>;
  quotaDefinition: FormControl<string | number | null>;
}


@Component({
  selector: 'app-edit-space-step',
  templateUrl: './edit-space-step.component.html',
  styleUrls: ['./edit-space-step.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AppInputDirective,
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    CustomSlideToggleComponent,
    FocusDirective
  ]
})
export class EditSpaceStepComponent extends AddEditSpaceStepBase implements OnInit, OnDestroy {
  private cfSpaceService = inject(CloudFoundrySpaceService);
  private injector = inject(Injector);
  private router = inject(Router);
  private http = inject(HttpClient);
  private endpointDataRegistry = inject(EndpointDataRegistry);

  /** See QuotaDefinitionFormComponent for rationale. */
  private validSignal = signal(false);
  private formStatusSub?: Subscription;

  /** FWT-957: post-success navigation target supplied by parent. */
  @Input() redirectUrl!: string;

  /**
   * FWT-957: signal-native step handle. Performs the two-stage update
   * (space attributes, then optional quota change) and navigates to the
   * parent-supplied redirectUrl on success. Replaces legacy onNext.
   */
  signalHandle: SignalStepHandle = {
    valid: this.validSignal.asReadonly(),
    submit: async () => {
      const spaceResult = await firstValueFrom(this.updateSpace());
      if (!spaceResult.success) {
        throw new Error(spaceResult.message || 'Failed to update space');
      }
      if (this.quotaUnchanged()) {
        await this.router.navigateByUrl(this.redirectUrl);
        return;
      }
      const quotaResult = await firstValueFrom(this.updateSpaceQuota());
      if (!quotaResult.success) {
        throw new Error(quotaResult.message || 'Failed to update space quota');
      }
      await this.router.navigateByUrl(this.redirectUrl);
    },
  };

  originalName: any;
  originalAllowSsh = false;
  spaceSubscription!: Subscription;
  space!: string;
  space$: Observable<any>;
  spaceGuid: string;
  editSpaceForm: FormGroup<EditSpaceForm>;
  originalSpaceQuotaGuid!: string;

  constructor() {
    const activatedRoute = inject(ActivatedRoute);
    const activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
    const orgRegistry = inject(OrgDataRegistry);
    const quotaData = inject(QuotaDataService);

    super(activatedRoute, activeRouteCfOrgSpace, orgRegistry, quotaData);
    this.spaceGuid = activatedRoute.snapshot.params.spaceId;
    this.editSpaceForm = new FormGroup<EditSpaceForm>({
      spaceName: new FormControl('', { nonNullable: true, validators: [this.spaceNameTakenValidator()] }),
      toggleSsh: new FormControl(false, { nonNullable: true }),
      quotaDefinition: new FormControl<string | number | null>(null),
    });
    // V3-native: source the form-prefill from the SpaceDataService signal.
    // Map V3 field names (allowSsh, quotaGuid) back onto the form's V2 keys
    // (allow_ssh, space_quota_definition_guid) so the rest of the form
    // pipeline stays unchanged.
    this.space$ = toObservable(this.cfSpaceService.spaceDataService.space, { injector: this.injector }).pipe(
      filter((o): o is NonNullable<typeof o> => !!o),
      map(o => ({
        name: o.name,
        allow_ssh: o.allowSsh,
        space_quota_definition_guid: o.quotaGuid || undefined,
      })),
      take(1),
      tap(n => {
        this.originalName = n.name;
        this.originalAllowSsh = !!n.allow_ssh;
        this.originalSpaceQuotaGuid = n.space_quota_definition_guid;

        const spaceQuotaGuid = n.space_quota_definition_guid ? n.space_quota_definition_guid : 0;
        this.editSpaceForm.patchValue({
          spaceName: n.name,
          toggleSsh: n.allow_ssh,
          quotaDefinition: spaceQuotaGuid,
        });
      })
    );

    this.spaceSubscription = this.space$.subscribe();
  }

  /** Name uniqueness check used by the base class's spaceNameTakenValidator. */
  isNameUnique = (spaceName: string = null): boolean => {
    const names = this.allSpacesInOrg();
    // Signal returns [] before the org-data load completes — treat as
    // "no known siblings yet, name is OK" so the form validator doesn't
    // false-positive during construction. Also guards against the
    // initial validator pass running before editSpaceForm is assigned.
    if (!names || names.length === 0 || !this.editSpaceForm) {
      return true;
    }
    return names
      .filter(o => o !== this.originalName)
      .indexOf(spaceName ? spaceName : this.editSpaceForm.value.spaceName || '') === -1;
  };

  /** Form-level validity gate for the Update button. Reads the signal. */
  validate = () => this.validSignal();

  ngOnInit() {
    // Mirror editSpaceForm.valid && dirty into a signal so the parent
    // EditSpaceComponent re-evaluates [valid] automatically.
    this.validSignal.set(this.editSpaceForm.valid && this.editSpaceForm.dirty);
    this.formStatusSub = this.editSpaceForm.statusChanges.subscribe(
      () => this.validSignal.set(this.editSpaceForm.valid && this.editSpaceForm.dirty)
    );
  }

  submit: StepOnNextFunction = () => {
    return this.updateSpace().pipe(
      switchMap(spaceResult => {
        if (!spaceResult.success) {
          return of({ success: false, redirect: false, message: spaceResult.message });
        }
        if (this.quotaUnchanged()) {
          return of({ success: true, redirect: true });
        }
        return this.updateSpaceQuota();
      }),
    );
  };

  private quotaUnchanged(): boolean {
    const next = this.editSpaceForm.value.quotaDefinition;
    return this.originalSpaceQuotaGuid === next ||
      (!this.originalSpaceQuotaGuid && !next);
  }

  // Two-leg update routes the name PATCH through CnsiSpacesSource so the
  // canonical EndpointDataService._spaces row updates immediately + the
  // space.update cascade fires. The SSH feature PUT is a side endpoint
  // (CF v3 lifted SSH out of the space attributes endpoint) and isn't
  // cached on EDS, so it stays as a raw http.put.
  updateSpace(): Observable<StepOnNextResult> {
    const name = this.editSpaceForm.value.spaceName as string;
    const allowSsh = !!this.editSpaceForm.value.toggleSsh;
    const sshChanged = allowSsh !== this.originalAllowSsh;
    const eds = this.endpointDataRegistry.acquire(this.cfGuid);
    const source = new CnsiSpacesSource(this.cfGuid, this.http, eds);
    return from(source.update(this.spaceGuid, { name })).pipe(
      switchMap(() => {
        if (!sshChanged) {
          return of(true);
        }
        return this.http.put(
          `/pp/v1/cf/spaces/${this.cfGuid}/${this.spaceGuid}/features/ssh`,
          { enabled: allowSsh },
        ).pipe(map(() => true));
      }),
      tap(() => {
        // Patch the SpaceDataService cache so the auto-navigate to /summary
        // shows the new values without a hard reload — CnsiSpacesSource only
        // updates the EndpointData _spaces list, not the detail signal that
        // the summary view reads from.
        this.cfSpaceService.spaceDataService.patch({ name, allowSsh });
      }),
      map(() => ({ success: true })),
      catchError(err => {
        const message = err?.error?.error || err?.message || `Failed to update space`;
        return throwError(() => ({ success: false, message } as StepOnNextResult));
      }),
      catchError((result: StepOnNextResult) => [result]),
      tap(() => this.endpointDataRegistry.release(this.cfGuid)),
    );
  }

  // V3 has no single endpoint that "switches" a quota on a space — either
  // attach (POST /v3/space_quotas/{quotaGuid}/relationships/spaces) or
  // detach (DELETE same path + /{spaceGuid}). On a quota change we just
  // need the new attachment; remove the previous attachment first when
  // one existed so the space ends up only with the new quota.
  //
  // After either leg completes, we mark the space cache stale so the
  // spaces list (which renders the quota name) re-fetches the updated
  // quotaGuid — space_quotas isn't cached on EDS, but the space row's
  // quotaGuid field is the source of truth for the displayed quota.
  updateSpaceQuota(): Observable<StepOnNextResult> {
    const next = this.editSpaceForm.value.quotaDefinition;
    const nextGuid = next ? String(next) : null;
    const oldGuid = this.originalSpaceQuotaGuid || null;
    const eds = this.endpointDataRegistry.acquire(this.cfGuid);

    const detach$ = oldGuid
      ? this.http.delete(`/pp/v1/cf/space_quotas/${this.cfGuid}/${oldGuid}/relationships/spaces/${this.spaceGuid}`)
      : of(null);

    return detach$.pipe(
      switchMap(() => {
        if (!nextGuid) {
          return of({ success: true, redirect: true } as StepOnNextResult);
        }
        return this.http.post(
          `/pp/v1/cf/space_quotas/${this.cfGuid}/${nextGuid}/relationships/spaces`,
          { space_guids: [this.spaceGuid] },
        ).pipe(map(() => ({ success: true, redirect: true } as StepOnNextResult)));
      }),
      tap(() => {
        eds.applyCascade('space.update');
        // Mirror the new quota onto the detail cache so the summary's
        // "Quota Definition" row reflects the change without a reload.
        this.cfSpaceService.spaceDataService.patch({ quotaGuid: nextGuid ?? undefined });
      }),
      catchError(err => {
        const message = err?.error?.error || err?.message || `Failed to update space quota`;
        return of({ success: false, redirect: false, message: `Failed to update space quota: ${message}` } as StepOnNextResult);
      }),
      tap(() => this.endpointDataRegistry.release(this.cfGuid)),
    );
  }

  ngOnDestroy() {
    this.destroy();
    this.spaceSubscription.unsubscribe();
    this.formStatusSub?.unsubscribe();
  }
}
