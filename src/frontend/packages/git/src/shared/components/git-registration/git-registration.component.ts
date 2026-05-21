import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Injector,
  OnDestroy,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, Validators, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { gitRepositoryUrlValidator } from '../../../../../core/src/shared/validators';
import {
  CreateEndpointHelperComponent } from '@stratosui/core';
import { combineLatest, firstValueFrom, Observable, Subscription } from 'rxjs';
import { take, map } from 'rxjs/operators';

import { EndpointsService } from '../../../../../core/src/core/endpoints.service';
import { getIdFromRoute } from '../../../../../core/src/core/utils.service';
import { ConnectEndpointConfig } from '../../../../../core/src/features/endpoints/connect.service';
import { CreateEndpointConnectComponent } from '../../../../../core/src/features/endpoints/create-endpoint/create-endpoint-connect/create-endpoint-connect.component';
import { EndpointsSignalConfigService } from '../../../../../core/src/features/endpoints/endpoints-page/endpoints-signal-config.service';
import { SignalStepHandle, StepComponent } from '../../../../../core/src/shared/components/stepper/step/step.component';
import { SteppersComponent } from '../../../../../core/src/shared/components/stepper/steppers/steppers.component';
import { UniqueDirective } from '../../../../../core/src/shared/components/unique.directive';
import { SessionService } from '../../../../../core/src/shared/services/session.service';
import { CurrentUserPermissionsService } from '../../../../../core/src/core/permissions/current-user-permissions.service';
import { UserProfileService } from '../../../../../core/src/core/user-profile.service';
import { SnackBarService } from '../../../../../core/src/shared/services/snackbar.service';
import { getFullEndpointApiUrl } from '../../../../../store/src/endpoint-utils';
import { entityCatalog, EndpointsDataService } from '../../../../../store/src/public-api';
import { GIT_ENDPOINT_SUB_TYPES, GIT_ENDPOINT_TYPE } from '../../../store/git-entity-factory';
import { GitSCMService } from '../../scm/scm.service';

interface EndpointSubTypes {
  [subType: string]: GithubTypes;
}

interface GithubTypes {
  label: string;
  description: string;
  types: {
    [key: string]: GithubType;
  };
}

interface GithubType {
  url: string;
  label: string;
  description: string[];
  name?: string;
  exists?: boolean;
  urlSuffix?: string;
}

enum GitTypeKeys {
  GITHUB_COM = 'githubdotcom',
  GITHUB_ENTERPRISE = 'githubenterprize',
  GITLAB_COM = 'githubdotcom',
  GITLAB_ENTERPRISE = 'githubenterprize' }

interface GitRegistrationForm {
  selectedType: FormControl<string>;
  nameField: FormControl<string>;
  urlField: FormControl<string>;
  skipSSLField: FormControl<boolean>;
  createSystemEndpointField: FormControl<boolean>;
}

@Component({
  selector: 'app-git-registration',
  templateUrl: './git-registration.component.html',
  styleUrls: ['./git-registration.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SteppersComponent,
    StepComponent,
    CreateEndpointConnectComponent,
    UniqueDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GitRegistrationComponent extends CreateEndpointHelperComponent implements AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private snackBarService = inject(SnackBarService);
  private endpointsService = inject(EndpointsService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private endpointsSignalConfig = inject(EndpointsSignalConfigService);
  sessionService: SessionService;
  currentUserPermissionsService: CurrentUserPermissionsService;
  userProfileService: UserProfileService;


  public gitTypes: EndpointSubTypes;

  public epSubType: GIT_ENDPOINT_SUB_TYPES;

  registerForm: FormGroup<GitRegistrationForm>;

  private sub: Subscription;
  private validateSub?: Subscription;

  public showEndpointFields = false;

  // Surfaces a one-line note above the radios when an option was auto-
  // skipped due to existing registration ("github.com is already
  // registered. Defaulted to GitHub Enterprise."). null when nothing
  // was skipped.
  public autoSelectNote: string | null = null;

  validate: Observable<boolean>;

  urlValidation: string;

  // FWT-959 Part 2 (Partition A) — SignalStepHandle wiring.
  //
  // 2-step wizard mirroring create-endpoint's shape: step 1 is the
  // endpoint-type selection + form (this component), step 2 delegates to
  // the shared CreateEndpointConnectComponent. The connect child exposes
  // signal-backed `validSignal` / `doConnectSignal` so this parent can
  // drive its second-step handle without polling plain fields.
  @ViewChild('connect', { static: false }) connect?: CreateEndpointConnectComponent;
  private registerValid = signal<boolean>(false);

  // Tracks the endpoint guid created by step 1's runRegistration. Used by
  // the connect-step's onLeave(isNext=false) handler to unregister on
  // Previous — "Prev = start over" UX. Cleared after unregister so the
  // form can re-register cleanly.
  private registeredGuid: string | null = null;

  registerStepHandle: SignalStepHandle = {
    valid: this.registerValid.asReadonly(),
    nextButtonText: signal('Register').asReadonly(),
    submit: async () => {
      const result = await this.runRegistration();
      if (!result.success) {
        throw new Error(result.message || 'Failed to register endpoint');
      }
      // Hand the registration result to the connect child before advance —
      // replaces the legacy stepper's `onEnter`-via-data path.
      if (this.connect && result.data) {
        this.connect.onEnter(result.data);
      }
    },
  };

  connectStepHandle: SignalStepHandle = {
    valid: computed(() => {
      const c = this.connect;
      if (!c) return true;
      return c.doConnectSignal() ? c.validSignal() : true;
    }),
    disablePrevious: signal(false).asReadonly(),
    hideCloseButton: signal(true).asReadonly(),
    finishButtonText: computed(() => {
      const c = this.connect;
      return c?.doConnectSignal() ? 'Connect' : 'Finish';
    }),
    onEnter: () => {
      // Data already handed off in registerStepHandle.submit — no-op.
    },
    onLeave: async (isNext) => {
      if (isNext || !this.registeredGuid) {
        return;
      }
      // Previous from connect step ⇒ "start over": unregister the endpoint
      // we just created so the user can pick a different type/URL on a
      // clean step 1.
      const guid = this.registeredGuid;
      this.registeredGuid = null;
      await this.endpointsSignalConfig.unregister(guid, GIT_ENDPOINT_TYPE);
    },
    submit: async () => {
      const result = await firstValueFrom(this.connect!.onNext());
      if (!result.success) {
        throw new Error(result.message || 'Failed to connect endpoint');
      }
      // Connect's legacy onNext returns redirect:true on success →
      // navigate back to /endpoints (the stepper's cancel URL).
      if (result.redirect) {
        await this.router.navigate(['/endpoints']);
      }
    },
  };

  constructor() {
    const gitSCMService = inject(GitSCMService);
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
    this.sessionService = sessionService;
    this.currentUserPermissionsService = currentUserPermissionsService;
    this.userProfileService = userProfileService;

    this.epSubType = getIdFromRoute(activatedRoute, 'subtype');
    const githubLabel = entityCatalog.getEndpoint(GIT_ENDPOINT_TYPE, GIT_ENDPOINT_SUB_TYPES.GITHUB).definition.label || 'Github';
    const gitlabLabel = entityCatalog.getEndpoint(GIT_ENDPOINT_TYPE, GIT_ENDPOINT_SUB_TYPES.GITLAB).definition.label || 'Gitlab';

    const publicGithubUrl = gitSCMService.getSCM('github', null).getPublicApi();
    const publicGitlabUrl = gitSCMService.getSCM('gitlab', null).getPublicApi();

    // Set a default/starting option
    this.gitTypes = {
      [GIT_ENDPOINT_SUB_TYPES.GITHUB]: {
        label: githubLabel,
        description: '',
        types: {
          [GitTypeKeys.GITHUB_COM]: {
            label: 'github.com',
            url: publicGithubUrl,
            name: 'GitHub',
            description: [
              `Registering github.com allows you to connect with a Personal Access Token and access your public and private ${githubLabel} repositories.`,
              'Note: Stratos allows you to access github.com without registering this endpoint, but you are limited to accessing public repositories.'
            ] },
          [GitTypeKeys.GITHUB_ENTERPRISE]: {
            label: 'Github Enterprise',
            url: null,
            description: [
              `Register your own GitHub Enterprise server.`,
              'Registering an endpoint allows you to access public repositories. Connect with a Personal Access Token to additionally access your private repositories',
            ] }
        }
      },
      [GIT_ENDPOINT_SUB_TYPES.GITLAB]: {
        label: gitlabLabel,
        description: '',
        types: {
          [GitTypeKeys.GITLAB_COM]: {
            label: 'gitlab.com',
            url: publicGitlabUrl,
            name: 'GitLab',
            description: [
              `Registering gitlab.com allows you to connect with a Personal Access Token and access your public and private ${gitlabLabel} repositories.`,
              'Note: Stratos allows you to access gitlab.com without registering this endpoint, but you are limited to accessing public repositories.'
            ] },
          [GitTypeKeys.GITLAB_ENTERPRISE]: {
            label: 'Gitlab Enterprise',
            url: null,
            description: [
              `Register your own Gitlab Enterprise server.`,
              'Registering an endpoint allows you to access public repositories. Connect with a Personal Access Token to additionally access your private repositories',
            ],
            urlSuffix: 'api/v4'
          }
        }
      }
    };

    // Greys out a radio option only when there are no remaining scopes for
    // the current user to register that URL into. Per PR #4876 (2021)
    // admins can hold a system endpoint AND a personal endpoint at the
    // same URL — so admins get two slots. Non-admins (or when user
    // endpoints are disabled) get one slot. The original code iterated
    // `endpoints$` unscoped, which contradicted the URL input's scoped
    // `appUnique` validator and the backend's per-scope uniqueness.
    combineLatest([
      this.endpointsService.endpoints$,
      this.existingSystemEndpoints,
      this.existingPersonalEndpoints,
      this.userEndpointsAndIsAdmin,
    ]).pipe(take(1)).subscribe(([eps, systemEps, personalEps, isAdminWithUserEndpoints]) => {
      Object.values(this.gitTypes[this.epSubType].types).forEach(type => {
        if (!type.url) {
          type.exists = false;
          return;
        }
        if (isAdminWithUserEndpoints) {
          // Admin has two slots: system + personal. Grey only when both filled.
          type.exists = systemEps.urls.includes(type.url) && personalEps.urls.includes(type.url);
        } else {
          type.exists = !!Object.values(eps).find(ep => type.url === getFullEndpointApiUrl(ep));
        }
      });
      this.init();
    });
  }

  private init() {
    const typeEntries = Object.entries(this.gitTypes[this.epSubType].types);
    // Find first type that is enabled
    const defaultSelection = typeEntries.find(([, item]) => !item.exists)?.[0];

    // Build a note for the user when one of the registration options had
    // to be skipped because its URL is already registered — preserves the
    // information that the auto-defaulted radio is a fallback, not a
    // first choice. Phrased around the URL because the radio-grey check
    // matches by endpoint URL, not radio label: an Enterprise-path
    // registration that happened to use api.github.com still triggers
    // the github.com radio to grey.
    const skippedUrls = typeEntries
      .filter(([, item]) => item.exists && !!item.url)
      .map(([, item]) => item.url);
    const defaulted = defaultSelection ? this.gitTypes[this.epSubType].types[defaultSelection].label : '';
    this.autoSelectNote = (skippedUrls.length > 0 && defaulted)
      ? `An endpoint at ${skippedUrls.join(', ')} is already registered — defaulted to ${defaulted}.`
      : null;

    this.registerForm = this.fb.group<GitRegistrationForm>({
      selectedType: new FormControl(defaultSelection || '', { nonNullable: true, validators: [] }),
      nameField: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      urlField: new FormControl('', { nonNullable: true, validators: [Validators.required, gitRepositoryUrlValidator] }),
      skipSSLField: new FormControl(false, { nonNullable: true, validators: [] }),
      createSystemEndpointField: new FormControl(true, { nonNullable: true, validators: [] }) });
    this.updateType();

    // Check for changes to the selected type
    this.sub = this.registerForm.controls.selectedType.valueChanges.subscribe(changes => {
      // Prevent selection of already-registered endpoints
      const typ = changes ?? '';
      const defn = this.gitTypes[this.epSubType].types[typ];
      if (defn?.exists) {
        // If user tries to select an existing endpoint, revert to the previous valid selection
        const validSelection = Object.keys(this.gitTypes[this.epSubType].types).find(key => {
          const item = this.gitTypes[this.epSubType].types[key];
          return !item.exists;
        });
        this.registerForm.controls.selectedType.setValue(validSelection || '', { emitEvent: false });
      } else {
        this.updateType(changes);
      }
    });

    this.validate = this.registerForm.statusChanges.pipe(map(() => {
      const typ = this.registerForm.value.selectedType ?? '';
      const defn = this.gitTypes[this.epSubType].types[typ];
      return !!defn.url || this.registerForm.valid;
    }));

    // Mirror form validity into the signal that drives the step handle.
    // Initial value reflects whether a default URL'd type is selected.
    const initialTyp = this.registerForm.value.selectedType ?? '';
    const initialDefn = this.gitTypes[this.epSubType].types[initialTyp];
    this.registerValid.set(!!initialDefn?.url || this.registerForm.valid);
    this.validateSub = this.validate.subscribe(v => {
      this.registerValid.set(!!v);
      this.cdr.markForCheck();
    });

    // Ensure the form validity is updates once the dust settles
    setTimeout(() => this.registerForm.updateValueAndValidity(), 0);
  }

  ngAfterViewInit() {
    // No-op; reserved for future child-bridge wiring. The connect child's
    // signal-backed fields are read directly from computeds, so no
    // subscription is required here.
  }

  private updateType(value?: string) {
    const typ = value ?? this.registerForm.value.selectedType ?? '';
    const defn = this.gitTypes[this.epSubType].types[typ];
    this.showEndpointFields = !defn.url;

    const entityDefn = entityCatalog.getEndpoint(GIT_ENDPOINT_TYPE, this.epSubType);
    this.urlValidation = entityDefn.definition?.urlValidationRegexString;
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
    this.validateSub?.unsubscribe();
  }

  // Perform the endpoint registration via the signal-config service. Returns
  // a step-shaped result the step handle's submit can act on directly. The
  // service wraps the legacy ngrx ActionState observable in a Promise that
  // resolves once the busy edge transitions, so we no longer need pairwise/
  // filter/map gymnastics here.
  private async runRegistration(): Promise<{ success: boolean; redirect: boolean; message: string; data: ConnectEndpointConfig }> {
    const typ = this.registerForm.value.selectedType ?? '';
    const defn = this.gitTypes[this.epSubType].types[typ];
    const name = defn.name ?? this.registerForm.controls.nameField.value ?? '';
    const url: string = this.updateUrlWithSuffix(defn.url ?? this.registerForm.controls.urlField.value ?? '', defn);
    // If we're in enterprise mode also assign the skipSSL field, otherwise assume false
    const skipSSL = this.registerForm.controls.nameField.value && this.registerForm.controls.urlField.value ?
      this.registerForm.controls.skipSSLField.value :
      false;
    const createSystemEndpoint = this.registerForm.controls.createSystemEndpointField.value;

    const result = await this.endpointsSignalConfig.register({
      endpointType: GIT_ENDPOINT_TYPE,
      endpointSubType: this.epSubType,
      name,
      endpoint: url,
      skipSslValidation: skipSSL,
      createSystemEndpoint,
    });
    const data: ConnectEndpointConfig = {
      guid: result.guid ?? '',
      name,
      type: GIT_ENDPOINT_TYPE,
      subType: this.epSubType,
      ssoAllowed: false
    };
    if (!result.error) {
      this.registeredGuid = data.guid;
      this.snackBarService.show(`Successfully registered '${name}'`);
    }
    const success = !result.error;
    return {
      success,
      redirect: false,
      message: success ? '' : result.message,
      data
    };
  }

  private updateUrlWithSuffix(url: string, defn: GithubType): string {
    const urlTrimmed = url.trim();
    if (!defn.urlSuffix) {
      return urlTrimmed;
    }
    const ready = urlTrimmed[urlTrimmed.length - 1] === '/' ? urlTrimmed.substring(0, urlTrimmed.length - 1) : urlTrimmed;
    return ready + '/' + defn.urlSuffix;
  }

  toggleCreateSystemEndpoint() {
    // wait a tick for validators to adjust to new data in the directive
    setTimeout(() => {
      this.registerForm.controls.nameField.updateValueAndValidity();
      this.registerForm.controls.urlField.updateValueAndValidity();
    });
  }

  /**
   * Check if a git type option is selectable (not already registered)
   * Used for visual styling and preventing selection in the template
   */
  isTypeSelectable(gitType: GithubType): boolean {
    return !gitType.exists;
  }
}
