import { CommonModule } from '@angular/common';
import { AppErrorComponent, AppInputDirective, CustomFormFieldComponent, MatLabelComponent } from '@stratosui/core';
import { HttpParams, HttpRequest } from '@angular/common/http';
import { Component, Input, OnDestroy, signal, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { ReactiveFormsModule, FormsModule, Validators, FormControl, FormGroup } from '@angular/forms';
import { CustomSelectComponent, CustomOptionComponent } from '@stratosui/core';
import { ActivatedRoute } from '@angular/router';

// Form interfaces
interface CreateEditServiceInstanceForm {
  name: FormControl<string>;
  syslog_drain_url: FormControl<string>;
  credentials: FormControl<string>;
  route_service_url: FormControl<string>;
  tags: FormControl<any[]>;
}

interface BindExistingInstanceForm {
  serviceInstances: FormControl<string>;
}

import { StatefulIconComponent, safeUnsubscribe, urlValidationExpression, environment, StepOnNextResult, isValidJsonValidator } from '@stratosui/core';
import { AppNameUniqueDirective } from '../../../directives/app-name-unique.directive/app-name-unique.directive';
import { toObservable } from '@angular/core/rxjs-interop';
import { combineLatest as obsCombineLatest, Observable, of as observableOf, Subscription, from } from 'rxjs';
import { take, filter, map, publishReplay, refCount, startWith, switchMap, withLatestFrom } from 'rxjs/operators';

import { IUserProvidedServiceInstanceData } from '../../../../cf-api-svc.types';
import { AppDetailDataService } from '../../../../features/applications/app-detail-data.service';
import { AppNameUniqueChecking } from '../../../directives/app-name-unique.directive/app-name-unique.directive';
import { CloudFoundryUserProvidedServicesService } from '../../../services/cloud-foundry-user-provided-services.service';
import { ServiceCatalogDataService, SignalSource } from '../../../../services/endpoint-data/service-catalog-data.service';
import { CreateServiceFormMode, CsiModeService } from './../csi-mode.service';
import { CsiState, CsiStateService } from './../csi-state.service';

// Picker row: a UPS instance plus a flag indicating whether this instance is
// already bound to the current app. Bound instances render disabled in the
// dropdown with an " (Already bound)" suffix.
export interface UpsPickerRow {
  guid: string | null; // null for already-bound rows so the option is unselectable
  name: string;
  alreadyBound: boolean;
}

const { proxyAPIVersion } = environment;

// Replace every leaf value with the '<redacted>' marker, keeping the key
// structure (nested objects and array shapes included) browsable. Angle
// brackets match the masked-credentials URL redaction convention and keep
// the marker distinguishable from a credential whose real value happens to
// be the word "redacted".
function redactValues(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactValues);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, redactValues(v)]));
  }
  return '<redacted>';
}
@Component({
  selector: 'app-specify-user-provided-details',
  templateUrl: './specify-user-provided-details.component.html',
  styleUrls: ['./specify-user-provided-details.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    AppErrorComponent,
    AppInputDirective,
    CustomFormFieldComponent,
    MatLabelComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    AppNameUniqueDirective,
    StatefulIconComponent
  ]
})
export class SpecifyUserProvidedDetailsComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private upsService = inject(CloudFoundryUserProvidedServicesService);
  modeService = inject(CsiModeService);
  // AppDetailDataService is provided per app-detail route, not 'root'. When the
  // UPS edit dialog is reached from outside the app-detail hierarchy (e.g. the
  // services wall), it isn't available — the v3 binding refresh becomes a no-op
  // because there's no in-context bindings view to update.
  private appDetailData = inject(AppDetailDataService, { optional: true });
  private csiState = inject(CsiStateService);
  private serviceCatalog = inject(ServiceCatalogDataService);
  // toObservable() must run inside an injection context — lift to a class field.
  private csiState$ = toObservable(this.csiState.state);


  constructor() {
    const route = this.route;

    const { endpointId, serviceInstanceId } =
      route && route.snapshot ? route.snapshot.params : { endpointId: null, serviceInstanceId: null };
    this.isUpdate = endpointId && serviceInstanceId;

    this.createEditServiceInstance = new FormGroup<CreateEditServiceInstanceForm>({
      name: new FormControl('', { validators: [Validators.required, Validators.maxLength(50)], nonNullable: true }),
      syslog_drain_url: new FormControl('', { validators: [Validators.pattern(urlValidationExpression)], nonNullable: true }),
      credentials: new FormControl('', { validators: isValidJsonValidator(), nonNullable: true }),
      route_service_url: new FormControl('', { validators: [Validators.pattern(urlValidationExpression)], nonNullable: true }),
      tags: new FormControl<any[]>([], { nonNullable: true }) });
    this.bindExistingInstance = new FormGroup<BindExistingInstanceForm>({
      serviceInstances: new FormControl('', { validators: [Validators.required], nonNullable: true }) });
    this.initUpdate(serviceInstanceId, endpointId);
    this.setupValidate();
    // Fetch on load so the redacted structure preview renders without a
    // click; real values stay off-screen until explicitly shown.
    this.fetchCredentials();
  }

  /** What the readonly credential view displays: the structure with
   *  '<redacted>' leaves by default, the real JSON while revealed.
   *  Null until the sub-resource lands. */
  public displayedCredentialsJson = computed<string | null>(() => {
    const creds = this.credsSource()?.value();
    if (!creds) return null;
    return this.credsMode() === 'revealed'
      ? JSON.stringify(creds, null, 2)
      : JSON.stringify(redactValues(creds), null, 2);
  });

  /** The preview split on the '"<redacted>"' tokens so the template can
   *  re-insert each token as a highlighted span — colorized without
   *  innerHTML. In real-values mode the split yields one segment and no
   *  markers render. */
  public displayedCredentialSegments = computed<string[] | null>(() => {
    const json = this.displayedCredentialsJson();
    return json ? json.split('"<redacted>"') : null;
  });

  /** Explicit step from viewing to editing: put the full JSON in the
   *  textarea. Separate from the reveal so the plaintext values only render
   *  where the user asked to edit them. originalFormValue is recomputed so
   *  loading on its own does not register as an edit — the wizard's finish
   *  button gates on the form having actually changed; emitEvent: false
   *  keeps statusChanges from firing against the pre-load snapshot.
   *  Validation still runs; only the notification is skipped. */
  public loadCredentialsIntoEditor(): void {
    const creds = this.credsSource()?.value();
    if (!creds) return;
    this.createEditServiceInstance.controls.credentials.setValue(
      JSON.stringify(creds, null, 2), { emitEvent: false },
    );
    this.originalFormValue = this.getServiceData();
  }

  /** Credentials sub-resource, fetched on load in update mode so the
   *  structure preview can render immediately. Fetching pulls the values
   *  into memory only — the screen shows '<redacted>' markers until the
   *  user explicitly asks for the real values (the threat model is a
   *  passer-by reading the screen, not the browser session itself). */
  public credsSource = signal<SignalSource<Record<string, unknown> | null> | null>(null);

  /** The single credentials control's state in update mode:
   *  'redacted' — readonly view, structure with '<redacted>' markers;
   *  'revealed' — readonly view, real values;
   *  'edit'     — the real textarea, holding the JSON that will be saved. */
  public credsMode = signal<'redacted' | 'revealed' | 'edit'>('redacted');

  public fetchCredentials(): void {
    if (!this.isUpdate) return;
    const { endpointId, serviceInstanceId } = this.route.snapshot.params;
    this.credsMode.set('redacted');
    this.credsSource.set(this.serviceCatalog.userProvidedCredentials(endpointId, serviceInstanceId));
  }

  public toggleReveal(): void {
    this.credsMode.update(m => m === 'revealed' ? 'redacted' : 'revealed');
  }

  /** Swap the readonly view for the editable field, pre-loaded with the
   *  real JSON. From here the field's content is what gets saved. */
  public enterEdit(): void {
    this.loadCredentialsIntoEditor();
    this.credsMode.set('edit');
  }

  /** Leave edit mode without saving anything: blank the field (blank =
   *  leave stored credentials untouched on save) and fall back to the
   *  readonly redacted view. originalFormValue is recomputed so the
   *  round-trip doesn't register as an edit. */
  public cancelEdit(): void {
    this.createEditServiceInstance.controls.credentials.setValue('', { emitEvent: false });
    this.originalFormValue = this.getServiceData();
    this.credsMode.set('redacted');
  }
  public createEditServiceInstance: FormGroup<CreateEditServiceInstanceForm>;
  public bindExistingInstance: FormGroup<BindExistingInstanceForm>;
  public allServiceInstanceNames!: string[];
  public subs: Subscription[] = [];
  public isUpdate: boolean;
  public tags: { label: string }[] = [];
  public validate = signal(false);
  private subscriptions: Subscription[] = [];

  @Input()
  public cfGuid!: string;
  @Input()
  public spaceGuid!: string;
  @Input()
  public appId!: string;
  @Input()
  public serviceInstanceId!: string;

  @Input()
  public showModeSelection = false;

  public appNameChecking = new AppNameUniqueChecking();

  public serviceBindingForApplication$ = this.serviceInstancesForApplication();
  formModes = [
    {
      label: 'Create and Bind to a new User Provided Service Instance',
      key: CreateServiceFormMode.CreateServiceInstance
    },
    {
      label: 'Bind to an Existing User Provided Service Instance',
      key: CreateServiceFormMode.BindServiceInstance
    }
  ];
  formMode = CreateServiceFormMode.CreateServiceInstance;

  private originalFormValue: IUserProvidedServiceInstanceData | null = null;

  ngOnDestroy(): void {
    safeUnsubscribe(...this.subscriptions);
  }

  private setupValidate() {
    const obs = obsCombineLatest([
      this.createEditServiceInstance.statusChanges.pipe(startWith('INVALID')),
      this.bindExistingInstance.statusChanges.pipe(startWith('INVALID'))
    ]).pipe(
      map(([createValid, bindValid]) =>
        this.formStatusToBool(this.formMode === CreateServiceFormMode.CreateServiceInstance ? createValid : bindValid)
      ),
      map(valid => this.validAndChanged(valid)),
    );

    // Subscribe to form status changes and update validate signal
    // Note: We don't call updateValueAndValidity here to avoid infinite loops
    this.subscriptions.push(obs.subscribe(valid => {
      this.validate.set(valid);
    }));
  }

  private validAndChanged(isValid = false): boolean {
    // Determine if the step is valid given
    // 1) the form element's validation state
    // 2) if process is update... also consider whether the form values have changed

    // Not valid, return immediately
    if (!isValid) {
      return false;
    }

    // Valid, but not update. Skip second part
    if (!this.isUpdate) {
      return true;
    }

    // Haven't yet initialised correctly, skip
    if (!this.originalFormValue) {
      return false;
    }

    // Compare original and new form values
    const newFormValue = this.getServiceData();
    if (JSON.stringify(this.originalFormValue) === JSON.stringify(newFormValue)) {
      // No change, return false
      return false;
    }
    return true;
  }

  private formStatusToBool(status: string): boolean {
    return status === 'VALID';
  }

  resetForms = (mode: CreateServiceFormMode) => {
    this.validate.set(false);
    this.createEditServiceInstance.reset();
    this.bindExistingInstance.reset();
    if (mode === CreateServiceFormMode.CreateServiceInstance) {
      this.tags = [];
    }
  };

  private serviceInstancesForApplication(): Observable<UpsPickerRow[] | null> {
    // "Already bound" detection no longer rides on the legacy
    // service_instance.service_bindings include chain — Stage 9c migrated
    // app bindings onto AppDetailDataService.serviceBindings, which the
    // picker reads as a synchronous signal snapshot. When the picker is
    // mounted outside the app-detail hierarchy (services-wall create), the
    // appDetailData injector is null and there is no app to bind to, so
    // every row stays selectable.
    return this.csiState$.pipe(
      filter((p): p is CsiState & { cfGuid: string; spaceGuid: string } =>
        !!p && !!p.spaceGuid && !!p.cfGuid),
      take(1),
      switchMap(p => this.upsService.getUserProvidedServices(p.cfGuid, p.spaceGuid)),
      map(upsis => {
        const boundSiGuids = this.boundServiceInstanceGuidsForApp();
        return upsis.map<UpsPickerRow>(upsi => {
          const alreadyBound = boundSiGuids.has(upsi.guid);
          return {
            guid: alreadyBound ? null : upsi.guid,
            name: alreadyBound ? `${upsi.name} (Already bound)` : upsi.name,
            alreadyBound,
          };
        });
      }),
      startWith(null),
      publishReplay(1),
      refCount()
    );
  }

  private boundServiceInstanceGuidsForApp(): Set<string> {
    const out = new Set<string>();
    if (!this.appId || !this.appDetailData) {
      return out;
    }
    const bindings = this.appDetailData.serviceBindings();
    if (!bindings) {
      return out;
    }
    for (const b of bindings) {
      // type=app bindings carry an app ref; the picker only cares about
      // bindings to *this* app since UPS-to-other-app bindings remain
      // selectable for binding to the current app.
      if (b.type === 'app' && b.app?.guid === this.appId && b.serviceInstance?.guid) {
        out.add(b.serviceInstance.guid);
      }
    }
    return out;
  }

  private initUpdate(serviceInstanceId: string, endpointId: string) {
    if (this.isUpdate) {
      this.createEditServiceInstance.disable();
      this.upsService.getUserProvidedService(endpointId, serviceInstanceId).pipe(
        take(1),
      ).subscribe(si => {
        this.createEditServiceInstance.enable();
        // StServiceInstance summary tier exposes name/syslogDrainUrl/
        // routeServiceUrl/tags directly. credentials are never on a read
        // response (jetstream native_types.go) — reading them off this
        // payload always yielded '', which is what left the textarea
        // permanently blank on edit (#5755). They come from the separate
        // credentials sub-resource via revealCredentials() instead.
        //
        // Blank still means "leave existing credentials untouched":
        // getServiceData() maps '' to undefined and toV3RequestBody() omits
        // the key, so saving without revealing preserves what CF holds.
        this.createEditServiceInstance.setValue({
          name: si.name,
          syslog_drain_url: si.syslogDrainUrl ?? '',
          credentials: '',
          route_service_url: si.routeServiceUrl ?? '',
          tags: []
        });
        this.tags = this.tagsArrayToChips(si.tags);
        this.originalFormValue = this.getServiceData();
      });
    }
  }

  public getUniqueRequest = (name: string) => {
    const params = new HttpParams()
      .set('return', 'counts')
      .set('type', 'user-provided')
      .set('names', name)
      .set('space_guids', this.spaceGuid);
    return new HttpRequest(
      'GET',
      `/pp/${proxyAPIVersion}/cf/service_instances/${this.cfGuid}`,
      { params },
    );
  };

  public onNext = (): Observable<StepOnNextResult> => {
    return this.isUpdate ?
      this.onNextUpdate() :
      this.formMode === CreateServiceFormMode.CreateServiceInstance ? this.onNextCreate() : this.onNextBind();
  };

  private onNextCreate(): Observable<StepOnNextResult> {
    const data = this.getServiceData();
    const guid = `user-services-instance-${this.cfGuid}-${this.spaceGuid}-${data.name}`;
    return this.upsService.createUserProvidedService(
      this.cfGuid,
      guid,
      data as IUserProvidedServiceInstanceData,
    ).pipe(
      withLatestFrom(this.csiState$),
      switchMap(([result, state]) => {
        if (!result.success) {
          return observableOf({
            success: false,
            redirect: false,
            message: 'Failed to create User Provided Service Instance. Reason: "' + (result.message ?? '') + '"',
          });
        }
        if (state.bindAppGuid && result.guid) {
          return this.createApplicationServiceBinding(result.guid, state);
        }
        return observableOf({ success: true, redirect: true });
      })
    );
  }

  private onNextBind(): Observable<StepOnNextResult> {
    return this.csiState$.pipe(
      switchMap(data => this.createApplicationServiceBinding(this.bindExistingInstance.controls.serviceInstances.value, data))
    );
  }

  private createApplicationServiceBinding(serviceGuid: string, data: any): Observable<StepOnNextResult> {
    return this.modeService.createApplicationServiceBinding(serviceGuid, data.cfGuid, data.bindAppGuid, data.bindAppParams)
      .pipe(
        map(req => {
          if (!req.success) {
            return { success: false, message: `Failed to create service instance binding: ${req.message}` };
          } else {
            // Bind succeeded — CF mutates VCAP_SERVICES on the app. Refresh
            // env vars on AppDetailDataService when bind happened from inside
            // the app-detail route hierarchy (the injector resolved). Outside
            // that hierarchy the env-vars tab fetches fresh on next mount, so
            // a no-op here is correct — no need to prime legacy ngrx state.
            if (this.appDetailData && data.bindAppGuid) {
              this.appDetailData.refresh('envVars').catch(() => { /* swallow — surface via _errors signal */ });
            }
            return { success: true, redirect: true };
          }
        })
      );
  }

  private onNextUpdate(): Observable<StepOnNextResult> {
    const updateData = this.getServiceData();
    return this.upsService.updateUserProvidedService(
      this.cfGuid,
      this.serviceInstanceId,
      updateData
    ).pipe(
      switchMap(result => {
        if (!result.success) {
          return observableOf<StepOnNextResult>({
            success: false,
            redirect: false,
            message: `Failed to update service instance: ${result.message ?? ''}`,
          });
        }
        // The bound app's denormalized service-instance data (name, tags,
        // syslog drain url, etc.) is included via ?return=summary on the v3
        // bindings handler — refreshing pulls in the just-updated UPS shape.
        // No-op outside the app-detail route hierarchy.
        const appId = this.appId || this.route.snapshot.queryParamMap.get('appId');
        const refresh = this.appDetailData && appId
          ? from(this.appDetailData.refresh('serviceBindings'))
          : observableOf<void>(undefined);
        return refresh.pipe(map(() => ({ success: true, redirect: true } as StepOnNextResult)));
      })
    );
  }

  private getServiceData(): IUserProvidedServiceInstanceData {
    const formValue = this.createEditServiceInstance.value;
    return {
      spaceGuid: this.spaceGuid,
      name: formValue.name!,
      route_service_url: formValue.route_service_url || undefined,
      syslog_drain_url: formValue.syslog_drain_url || undefined,
      tags: this.getTagsArray(),
      credentials: formValue.credentials ? JSON.parse(formValue.credentials) : undefined
    };
  }


  private getTagsArray() {
    return this.tags && Array.isArray(this.tags) ? this.tags.map(tag => tag.label) : [];
  }

  private tagsArrayToChips(tagsArray: string[]) {
    return tagsArray && Array.isArray(tagsArray) ? tagsArray.map(label => ({ label })) : [];
  }


  // (keydown.*) template events are typed as plain Event by the compiler
  public addTagFromInput(event: Event): void {
    event.preventDefault();
    const input = event.target as HTMLInputElement;
    const label = (input.value || '').trim();

    if (label) {
      this.tags.push({ label });
      this.updateTagsFormControl();
      input.value = '';
    }
  }

  public removeTag(tag: any): void {
    const index = this.tags.indexOf(tag);

    if (index >= 0) {
      this.tags.splice(index, 1);
      this.updateTagsFormControl();
    }
  }

  private updateTagsFormControl(): void {
    const tagsArray = this.tags.map(t => t.label);
    this.createEditServiceInstance.controls.tags.setValue(tagsArray);
    this.createEditServiceInstance.controls.tags.markAsTouched();
    // Mark the form as dirty to trigger change detection
    this.createEditServiceInstance.markAsDirty();
  }

}
