import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, AfterContentInit, Component, DestroyRef, Injector, Input, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, Validators, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { cfEndpointUrlValidator, normalizeUrl } from '../../../../shared/validators';
import { CustomCheckboxComponent } from '../../../../shared/components/custom-checkbox/custom-checkbox.component';
import { AppInputDirective, CustomFormFieldComponent, AppErrorComponent } from '../../../../shared/components/custom-form-field/custom-form-field.component';
import { CustomIconComponent } from '../../../../shared/components/custom-material/custom-material.component';
import { ActivatedRoute } from '@angular/router';
import {
  EndpointModel,
  EndpointsDataService,
  StratosCatalogEndpointEntity,
  entityCatalog,
  getFullEndpointApiUrl,
} from '@stratosui/store';
import { combineLatest, firstValueFrom, from, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { getIdFromRoute } from '../../../../core/utils.service';
import { IStepperStep, StepOnNextFunction, StepOnNextResult } from '../../../../shared/components/stepper/step/step.component';
import { SessionService } from '../../../../shared/services/session.service';
import { CurrentUserPermissionsService } from '../../../../core/permissions/current-user-permissions.service';
import { UserProfileService } from '../../../../core/user-profile.service';
import { TailwindSnackBarService } from '../../../../shared/services/tailwind-snackbar.service';
import { ConnectEndpointConfig } from '../../connect.service';
import { EndpointsSignalConfigService } from '../../endpoints-page/endpoints-signal-config.service';
import { getSSOClientRedirectURI } from '../../endpoint-helpers';
import { CreateEndpointHelperComponent } from '../create-endpoint-helper';
import { UniqueDirective } from '../../../../shared/components/unique.directive';
import { ProductNameComponent } from '../../../../shared/components/product-name.ccomponent';
import { ConfirmationDialogService } from '../../../../shared/components/confirmation-dialog.service';
import { EndpointCertificatesComponent } from '../../certificates/endpoint-certificates.component';
import { EndpointPermissionsService } from '../../endpoint-permissions.service';
import { confirmAndUnregister, isPersonalEndpoint } from '../../unregister-endpoint/unregister-endpoint';

// What the step knows about the endpoint it registered or is reviewing.
interface RegisteredEndpoint {
  guid: string;
  name: string;
  type: string;
  subType: string;
  ssoAllowed: boolean;
  personal: boolean;
  // The TLS settings as the server holds them.
  skipSSL: boolean;
  caCert: string;
}

interface CreateEndpointForm {
  nameField: FormControl<string>;
  urlField: FormControl<string>;
  skipSSLField: FormControl<boolean>;
  ssoAllowedField: FormControl<boolean>;
  clientIDField: FormControl<string>;
  clientSecretField: FormControl<string>;
  createSystemEndpointField: FormControl<boolean>;
  caCertField: FormControl<string>;
}

@Component({
  selector: 'app-create-endpoint-cf-step-1',
  templateUrl: './create-endpoint-cf-step-1.component.html',
  styleUrls: ['./create-endpoint-cf-step-1.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppInputDirective,
    CustomFormFieldComponent,
    AppErrorComponent,
    CustomCheckboxComponent,
    CustomIconComponent,
    UniqueDirective,
    ProductNameComponent,
    EndpointCertificatesComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateEndpointCfStep1Component extends CreateEndpointHelperComponent implements IStepperStep, AfterContentInit {
  private fb = inject(FormBuilder);
  private snackBarService = inject(TailwindSnackBarService);
  private endpointsSignalConfig = inject(EndpointsSignalConfigService);
  private endpointsData = inject(EndpointsDataService);
  private permissions = inject(EndpointPermissionsService);
  private confirmDialog = inject(ConfirmationDialogService);
  private hostInjector = inject(Injector);

  // Set: the step shows this endpoint instead of registering one.
  readonly reviewEndpoint = input<EndpointModel | null>(null);
  // The endpoint was unregistered from this step.
  readonly unregistered = output<void>();

  // The endpoint exists: the step shows it (name and address locked) rather
  // than registering. True after a successful registration or with reviewEndpoint.
  readonly review = signal(false);
  private readonly registered = signal<RegisteredEndpoint | null>(null);
  private readonly managerOfEndpoint = signal(true);
  // A Git host takes no CA certificate, so it has no TLS to review.
  private readonly noTls = computed(() => this.registered()?.type === 'git');
  // TLS controls: always before registering; afterwards only for those who may save them.
  readonly canEditTls = computed(() => !this.noTls() && (!this.review() || this.managerOfEndpoint()));
  readonly showCertificates = computed(() => this.review() && !this.noTls());
  readonly canUnregister = computed(() => this.review() && this.managerOfEndpoint());
  readonly personal = computed(() => this.registered()?.personal ?? false);
  readonly guid = computed(() => this.registered()?.guid ?? null);
  // The CA the endpoint holds after the last save; the Connect step badges it.
  readonly registeredCaCert = computed(() => this.registered()?.caCert ?? '');
  private readonly caCertValue = signal('');
  // The PEM the endpoint will have after Next: empty while the CA box is off.
  readonly effectivePem = computed(() => (this.showCACertField() ? this.caCertValue() : ''));


  registerForm: FormGroup<CreateEndpointForm>;

  readonly finalStep = input(false);
  private pFixedUrl!: string;
  @Input()
  get fixedUrl(): string {
    return this.pFixedUrl;
  }
  set fixedUrl(url: string) {
    this.pFixedUrl = url;
    this.registerForm.controls.urlField.setValue(this.pFixedUrl);
    if (this.pFixedUrl) {
      this.registerForm.controls.urlField.disable();
    } else {
      this.registerForm.controls.urlField.enable();
    }
  }

  // strict: assigned in ngAfterContentInit before any template/consumer read.
  validate!: Observable<boolean>;

  // strict: assigned in the constructor via setUrlValidation().
  urlValidation!: string;

  readonly showAdvancedFields = signal(false);
  clientRedirectURI!: string;

  readonly endpointTypeSupportsSSO = signal(false);
  readonly endpoint = signal<StratosCatalogEndpointEntity | undefined>(undefined);
  readonly show = signal(false);

  readonly showCACertField = signal(false);
  // The Options column has something to show: TLS, Advanced Options or SSO.
  readonly showOptions = computed(() =>
    this.canEditTls() || (this.showAdvancedFields() && !this.review()) || this.endpointTypeSupportsSSO());
  readonly showAdvancedOptions = signal(false);
  lastSkipSSLValue = false;

  constructor() {
    const activatedRoute = inject(ActivatedRoute);
    const sessionService = inject(SessionService);
    const currentUserPermissionsService = inject(CurrentUserPermissionsService);
    const userProfileService = inject(UserProfileService);

    super(
      sessionService,
      currentUserPermissionsService,
      userProfileService,
      inject(EndpointsDataService),
      inject(Injector),
    );

    this.registerForm = this.fb.group<CreateEndpointForm>({
      nameField: this.fb.nonNullable.control('', [Validators.required]),
      urlField: this.fb.nonNullable.control('', [Validators.required, cfEndpointUrlValidator]),
      skipSSLField: this.fb.nonNullable.control(false, []),
      ssoAllowedField: this.fb.nonNullable.control(false, []),
      // Optional Client ID and Client Secret
      clientIDField: this.fb.nonNullable.control('', []),
      clientSecretField: this.fb.nonNullable.control('', []),
      createSystemEndpointField: this.fb.nonNullable.control(true, []),
      caCertField: this.fb.nonNullable.control('', []),
    });

    const epType = getIdFromRoute(activatedRoute, 'type');
    const epSubType = getIdFromRoute(activatedRoute, 'subtype');
    this.useEndpointType(entityCatalog.getEndpoint(epType, epSubType));

    // Client Redirect URI for SSO
    this.clientRedirectURI = getSSOClientRedirectURI();

    this.registerForm.controls.caCertField.valueChanges
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(value => this.caCertValue.set(value));

    effect(() => {
      const ep = this.reviewEndpoint();
      // A refreshed copy of the same endpoint must not reset edits in progress.
      if (ep && ep.guid !== untracked(() => this.registered()?.guid)) {
        untracked(() => this.reviewExisting(ep));
      }
    });
  }

  private useEndpointType(endpoint?: StratosCatalogEndpointEntity) {
    this.endpoint.set(endpoint);
    this.setUrlValidation(endpoint);
  }

  onNext: StepOnNextFunction = () => from(this.review() ? this.saveReview() : this.runRegistration());

  // Fill the form from an endpoint that already exists and lock it.
  private reviewExisting(ep: EndpointModel) {
    this.useEndpointType(entityCatalog.getEndpoint(ep.cnsi_type ?? '', ep.sub_type));
    const form = this.registerForm.controls;
    const caCert = ep.ca_cert ?? '';
    // Start clean: a previous fill may have left the TLS controls disabled.
    form.skipSSLField.enable();
    this.showCACertField.set(false);
    form.nameField.setValue(ep.name);
    form.clientIDField.setValue(ep.client_id ?? '');
    form.createSystemEndpointField.setValue(!(!!ep.creator && !ep.creator.system));
    form.urlField.setValue(getFullEndpointApiUrl(ep));
    form.ssoAllowedField.setValue(!!ep.sso_allowed);
    form.skipSSLField.setValue(!!ep.skip_ssl_validation);
    form.caCertField.setValue(caCert);
    this.lastSkipSSLValue = !!ep.skip_ssl_validation;
    if (caCert.trim()) {
      this.toggleCACertField();
    }
    this.registered.set({
      guid: ep.guid ?? '',
      name: ep.name,
      type: ep.cnsi_type ?? '',
      subType: ep.sub_type ?? '',
      ssoAllowed: !!ep.sso_allowed,
      personal: !!ep.creator && !ep.creator.system,
      skipSSL: !!ep.skip_ssl_validation,
      caCert,
    });
    this.managerOfEndpoint.set(this.permissions.canManage(ep));
    this.lock();
  }

  // Name, address and the other registration fields cannot change once registered; TLS can.
  private lock() {
    const form = this.registerForm.controls;
    [form.nameField, form.urlField, form.ssoAllowedField, form.clientIDField, form.clientSecretField,
      form.createSystemEndpointField].forEach(control => control.disable());
    this.review.set(true);
  }

  private unlock() {
    const form = this.registerForm.controls;
    [form.nameField, form.ssoAllowedField, form.clientIDField, form.clientSecretField,
      form.createSystemEndpointField].forEach(control => control.enable());
    if (!this.pFixedUrl) {
      form.urlField.enable();
    }
    this.review.set(false);
  }

  // Review's Next: save TLS only when it differs from what the endpoint has.
  // updateEndpoint (jetstream) drops the stored CA when ca_cert is left out,
  // so every save sends the CA field as it stands.
  private async saveReview(): Promise<StepOnNextResult> {
    const reg = this.registered();
    if (!reg) {
      return { success: false, redirect: false, message: 'Unknown endpoint' };
    }
    const data: ConnectEndpointConfig = {
      guid: reg.guid,
      name: reg.name,
      type: reg.type,
      subType: reg.subType,
      ssoAllowed: reg.ssoAllowed,
    };
    if (!this.canEditTls()) {
      return { success: true, redirect: false, message: '', data };
    }
    const caOn = this.showCACertField();
    const caCert = caOn ? (this.registerForm.getRawValue().caCertField ?? '') : '';
    const skipSSL = caOn && caCert.trim().length > 0 ? false : (this.registerForm.getRawValue().skipSSLField ?? false);
    if (skipSSL === reg.skipSSL && caCert.trim() === reg.caCert.trim()) {
      return { success: true, redirect: false, message: '', data };
    }
    const result = await this.endpointsData.update(reg.guid, {
      endpointType: reg.type,
      name: reg.name,
      skipSSL,
      setClientInfo: false,
      allowSSO: reg.ssoAllowed,
      caCert,
    });
    if (result.error) {
      return { success: false, redirect: false, message: result.message, data };
    }
    this.registered.set({ ...reg, skipSSL, caCert });
    return { success: true, redirect: false, message: '', data };
  }

  /** Unregister from the step; the Register flow reopens unlocked and filled in. */
  async unregister(): Promise<void> {
    const reg = this.registered();
    if (!reg) {
      return;
    }
    const gone = await confirmAndUnregister(this.confirmDialog, this.endpointsSignalConfig, this.snackBarService, reg);
    if (!gone) {
      return;
    }
    this.registered.set(null);
    if (!this.reviewEndpoint()) {
      this.unlock();
    }
    this.unregistered.emit();
  }

  // Perform the endpoint registration via the signal-config service. Returns
  // a step-shaped result the stepper's onNext can act on directly. The
  // service wraps the legacy ngrx ActionState observable in a Promise that
  // resolves once the busy edge transitions, so we no longer need pairwise/
  // filter/map gymnastics here.
  private async runRegistration(): Promise<StepOnNextResult> {
    const endpoint = this.endpoint();
    if (!endpoint) {
      // Route named an endpoint type with no registered entity — nothing to
      // register against, so fail the step rather than throwing.
      return { success: false, redirect: false, message: 'Unknown endpoint type' };
    }
    const { subType, type } = endpoint.getTypeAndSubtype();

    // SSL settings — when a CA cert is provided we trust it as the override
    // (skip-ssl is mutually exclusive with cert pinning). When the CA-cert
    // field is shown but left empty, honor the user's checkbox so self-signed
    // endpoints (k3d / kind / minikube) still work via skipSslValidation.
    let sslAllow = this.registerForm.value.skipSSLField ?? false;
    const caCert = (this.registerForm.value.caCertField ?? '').trim();
    const showCA = this.showCACertField();
    if (showCA && caCert.length > 0) {
      sslAllow = false;
    }

    // Normalize URL using shared utility
    const url = normalizeUrl(this.registerForm.value.urlField || '');
    const name = this.registerForm.value.nameField ?? '';

    const result = await this.endpointsSignalConfig.register({
      endpointType: type ?? '',
      endpointSubType: subType ?? null,
      name,
      endpoint: url,
      skipSslValidation: sslAllow,
      clientID: this.registerForm.value.clientIDField,
      clientSecret: this.registerForm.value.clientSecretField,
      ssoAllowed: this.registerForm.value.ssoAllowedField,
      createSystemEndpoint: this.registerForm.value.createSystemEndpointField,
      // A PEM left in the box after the CA box was turned off is not sent.
      caCert: showCA ? this.registerForm.value.caCertField : '',
    });

    const data: ConnectEndpointConfig = {
      guid: result.guid ?? '',
      name,
      type: type || '',
      subType: subType || '',
      ssoAllowed: this.registerForm.value.ssoAllowedField ? !!this.registerForm.value.ssoAllowedField : false
    };
    if (!result.error) {
      this.registered.set({
        ...data,
        personal: await this.isPersonal(data.guid),
        skipSSL: sslAllow,
        caCert: showCA ? (this.registerForm.value.caCertField ?? '') : '',
      });
      const created = this.endpointsData.endpoints().get(data.guid);
      this.managerOfEndpoint.set(created ? this.permissions.canManage(created) : true);
      this.lock();
      // 7 s: it shows while the dialog moves to its Connect step.
      this.snackBarService.show(`Successfully registered '${name}'`, undefined, 7000);
      // Another endpoint at the same URL is not warned about here: the
      // endpoints page's banner says so above Total Endpoints.
    }
    const success = !result.error;
    return {
      success,
      redirect: success && this.finalStep(),
      message: success ? '' : result.message,
      data
    };
  }

  // Personal = created by a user, not the system.
  private async isPersonal(guid: string): Promise<boolean> {
    return isPersonalEndpoint(
      this.endpointsData.endpoints().get(guid),
      await firstValueFrom(this.userEndpointsAndIsAdmin),
      !!this.registerForm.value.createSystemEndpointField,
    );
  }

  ngAfterContentInit() {
    // In review the locked fields leave the form with nothing to validate.
    this.validate = combineLatest([
      this.registerForm.statusChanges.pipe(startWith(this.registerForm.status)),
      toObservable(this.review, { injector: this.hostInjector }),
    ]).pipe(map(([, review]) => review || this.registerForm.valid));
  }

  setUrlValidation(endpoint?: StratosCatalogEndpointEntity) {
    this.urlValidation = endpoint ? (endpoint.definition.urlValidationRegexString ?? '') : '';
    this.setAdvancedFields(endpoint);
  }

  // Only show the Client ID and Client Secret fields if the endpoint type is Cloud Foundry
  setAdvancedFields(endpoint?: StratosCatalogEndpointEntity) {
    this.showAdvancedFields.set(endpoint?.definition?.type === 'cf');

    // Only allow SSL if the endpoint type is Cloud Foundry
    this.endpointTypeSupportsSSO.set(endpoint?.definition?.type === 'cf');
  }

  toggleAdvancedOptions() {
    this.showAdvancedOptions.update(v => !v);
  }

  toggleCACertField() {
    this.showCACertField.update(v => !v);
    if (this.showCACertField()) {
      this.lastSkipSSLValue = this.registerForm.getRawValue().skipSSLField ?? false;
      this.registerForm.controls.skipSSLField.setValue(false);
      this.registerForm.controls.skipSSLField.disable();
    } else {
      this.registerForm.controls.skipSSLField.setValue(this.lastSkipSSLValue ?? false);
      this.registerForm.controls.skipSSLField.enable();
    }
  }

  toggleCreateSystemEndpoint() {
    // wait a tick for validators to adjust to new data in the directive
    setTimeout(() => {
      this.registerForm.controls.nameField.updateValueAndValidity();
      this.registerForm.controls.urlField.updateValueAndValidity();
    });
  }
}
