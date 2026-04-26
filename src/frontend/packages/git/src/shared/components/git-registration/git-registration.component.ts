import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
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
import { firstValueFrom, Observable, Subscription } from 'rxjs';
import { take, filter, map, pairwise } from 'rxjs/operators';

import { EndpointsService } from '../../../../../core/src/core/endpoints.service';
import { getIdFromRoute } from '../../../../../core/src/core/utils.service';
import { ConnectEndpointConfig } from '../../../../../core/src/features/endpoints/connect.service';
import { CreateEndpointConnectComponent } from '../../../../../core/src/features/endpoints/create-endpoint/create-endpoint-connect/create-endpoint-connect.component';
import { SignalStepHandle, StepComponent } from '../../../../../core/src/shared/components/stepper/step/step.component';
import { SteppersComponent } from '../../../../../core/src/shared/components/stepper/steppers/steppers.component';
import { UniqueDirective } from '../../../../../core/src/shared/components/unique.directive';
import { SessionService } from '../../../../../core/src/shared/services/session.service';
import { CurrentUserPermissionsService } from '../../../../../core/src/core/permissions/current-user-permissions.service';
import { UserProfileService } from '../../../../../core/src/core/user-profile.service';
import { SnackBarService } from '../../../../../core/src/shared/services/snackbar.service';
import { getFullEndpointApiUrl } from '../../../../../store/src/endpoint-utils';
import { entityCatalog } from '../../../../../store/src/public-api';
import { ActionState } from '../../../../../store/src/reducers/api-request-reducer/types';
import { stratosEntityCatalog } from '../../../../../store/src/stratos-entity-catalog';
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
  sessionService: SessionService;
  currentUserPermissionsService: CurrentUserPermissionsService;
  userProfileService: UserProfileService;


  public gitTypes: EndpointSubTypes;

  public epSubType: GIT_ENDPOINT_SUB_TYPES;

  registerForm: FormGroup<GitRegistrationForm>;

  private sub: Subscription;
  private validateSub?: Subscription;

  public showEndpointFields = false;

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

  registerStepHandle: SignalStepHandle = {
    valid: this.registerValid.asReadonly(),
    nextButtonText: signal('Register').asReadonly(),
    submit: async () => {
      const result = await firstValueFrom(this.runRegistration());
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
    disablePrevious: signal(true).asReadonly(),
    hideCloseButton: signal(true).asReadonly(),
    finishButtonText: computed(() => {
      const c = this.connect;
      return c?.doConnectSignal() ? 'Connect' : 'Finish';
    }),
    onEnter: () => {
      // Data already handed off in registerStepHandle.submit — no-op.
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

    super(sessionService, currentUserPermissionsService, userProfileService);
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

    // Check the endpoints and turn off any options for endpoints that are already registered
    this.endpointsService.endpoints$.pipe(take(1)).subscribe(eps => {
      Object.values(this.gitTypes[this.epSubType].types).forEach(type => {
        type.exists = !type.url ? false : !!Object.values(eps).find(ep => type.url === getFullEndpointApiUrl(ep));
      });
      this.init();
    });
  }

  private init() {
    // Find first type that is enabled
    const defaultSelection = Object.keys(this.gitTypes[this.epSubType].types).find(key => {
      const item = this.gitTypes[this.epSubType].types[key];
      return !item.exists;
    });

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

  // Perform the endpoint registration. Returns the existing
  // Observable<StepOnNextResult> shape so the step handle's submit can
  // adapt it to a Promise.
  private runRegistration(): Observable<{ success: boolean; redirect: boolean; message: string; data: ConnectEndpointConfig }> {
    const typ = this.registerForm.value.selectedType ?? '';
    const defn = this.gitTypes[this.epSubType].types[typ];
    const name = defn.name ?? this.registerForm.controls.nameField.value ?? '';
    const url: string = this.updateUrlWithSuffix(defn.url ?? this.registerForm.controls.urlField.value ?? '', defn);
    // If we're in enterprise mode also assign the skipSSL field, otherwise assume false
    const skipSSL = this.registerForm.controls.nameField.value && this.registerForm.controls.urlField.value ?
      this.registerForm.controls.skipSSLField.value :
      false;
    const createSystemEndpoint = this.registerForm.controls.createSystemEndpointField.value;

    return stratosEntityCatalog.endpoint.api.register<ActionState>(GIT_ENDPOINT_TYPE,
      this.epSubType, name, url, skipSSL, '', '', false, createSystemEndpoint)
      .pipe(
        pairwise(),
        filter(([oldVal, newVal]) => (oldVal.busy && !newVal.busy)),
        map(([, newVal]) => newVal),
        map(result => {
          const data: ConnectEndpointConfig = {
            guid: result.message,
            name,
            type: GIT_ENDPOINT_TYPE,
            subType: this.epSubType,
            ssoAllowed: false
          };
          if (!result.error) {
            this.snackBarService.show(`Successfully registered '${name}'`);
          }
          const success = !result.error;
          return {
            success,
            redirect: false,
            message: success ? '' : result.message,
            data
          };
        })
      );
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
