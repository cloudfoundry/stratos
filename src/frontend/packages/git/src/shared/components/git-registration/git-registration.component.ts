import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { filter, first, map, pairwise } from 'rxjs/operators';

import { StratosCurrentUserPermissions } from '../../../../../core/src/core/permissions/stratos-user-permissions.checker';
import { SessionService } from '../../../../../core/src/shared/services/session.service';
import { EndpointsService } from '../../../../../core/src/core/endpoints.service';
import { getIdFromRoute } from '../../../../../core/src/core/utils.service';
import { ConnectEndpointConfig } from '../../../../../core/src/features/endpoints/connect.service';
import { StepOnNextFunction } from '../../../../../core/src/shared/components/stepper/step/step.component';
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
  GITLAB_ENTERPRISE = 'githubenterprize',
}

type EndpointObservable = Observable<{
  names: string[],
  urls: string[],
}>;

@Component({
  selector: 'app-git-registration',
  templateUrl: './git-registration.component.html',
  styleUrls: ['./git-registration.component.scss'],
})
export class GitRegistrationComponent implements OnDestroy {

  public gitTypes: EndpointSubTypes;

  public epSubType: GIT_ENDPOINT_SUB_TYPES;

  registerForm: FormGroup;

  private sub: Subscription;

  public showEndpointFields = false;

  validate: Observable<boolean>;

  urlValidation: string;

  overwritePermission: Observable<StratosCurrentUserPermissions[]>;

  existingEndpoints: EndpointObservable;
  existingAdminEndpoints: EndpointObservable;

  constructor(
    gitSCMService: GitSCMService,
    activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private snackBarService: SnackBarService,
    private endpointsService: EndpointsService,
    private sessionService: SessionService,
  ) {
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
            ],
          },
          [GitTypeKeys.GITHUB_ENTERPRISE]: {
            label: 'Github Enterprise',
            url: null,
            description: [
              `Register your own GitHub Enterprise server.`,
              'Registering an endpoint allows you to access public repositories. Connect with a Personal Access Token to additionally access your private repositories',
            ],
          }
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
            ],
          },
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

    const currentPage$ = stratosEntityCatalog.endpoint.store.getAll.getPaginationMonitor().currentPage$;
    this.existingAdminEndpoints = currentPage$.pipe(
      map(endpoints => ({
        names: endpoints.filter(ep => ep.creator.admin).map(ep => ep.name),
        urls: endpoints.filter(ep => ep.creator.admin).map(ep => getFullEndpointApiUrl(ep)),
      }))
    );
    this.existingEndpoints = currentPage$.pipe(
      map(endpoints => ({
        names: endpoints.map(ep => ep.name),
        urls: endpoints.map(ep => getFullEndpointApiUrl(ep)),
      }))
    );

    this.overwritePermission = this.sessionService.userEndpointsNotDisabled().pipe(
      map(enabled => enabled ? [StratosCurrentUserPermissions.EDIT_ADMIN_ENDPOINT] : [])
    );

    // Check the endpoints and turn off any options for endpoints that are already registered
    this.endpointsService.endpoints$.pipe(first()).subscribe(eps => {
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

    this.registerForm = this.fb.group({
      selectedType: [defaultSelection, []],
      nameField: ['', [Validators.required]],
      urlField: ['', [Validators.required]],
      skipSllField: [false, []],
      overwriteEndpointsField: [false, []],
    });
    this.updateType();

    // Check for changes to the from selected type
    this.sub = this.registerForm.controls.selectedType.valueChanges.subscribe(changes => this.updateType(changes));

    this.validate = this.registerForm.statusChanges.pipe(map(() => {
      const typ = this.registerForm.value.selectedType;
      const defn = this.gitTypes[this.epSubType].types[typ];
      return !!defn.url || this.registerForm.valid;
    }));

    // Ensure the form validity is updates once the dust settles
    setTimeout(() => this.registerForm.updateValueAndValidity(), 0);
  }

  private updateType(value?: string) {
    const typ = value || this.registerForm.value.selectedType;
    const defn = this.gitTypes[this.epSubType].types[typ];
    this.showEndpointFields = !defn.url;

    const entityDefn = entityCatalog.getEndpoint(GIT_ENDPOINT_TYPE, this.epSubType);
    this.urlValidation = entityDefn.definition?.urlValidationRegexString;
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  // Perform the endpoint registration
  onNext: StepOnNextFunction = () => {
    const typ = this.registerForm.value.selectedType;
    const defn = this.gitTypes[this.epSubType].types[typ];
    const name = defn.name || this.registerForm.controls.nameField.value;
    const url: string = this.updateUrlWithSuffix(defn.url || this.registerForm.controls.urlField.value, defn);
    // If we're in enterprise mode also assign the skipSSL field, otherwise assume false
    const skipSSL = this.registerForm.controls.nameField.value && this.registerForm.controls.urlField.value ?
      this.registerForm.controls.skipSllField.value :
      false;
    const overwriteEndpoints = this.registerForm.controls.overwriteEndpointsField.value;

    return stratosEntityCatalog.endpoint.api.register<ActionState>(GIT_ENDPOINT_TYPE,
      this.epSubType, name, url, skipSSL, '', '', false, overwriteEndpoints)
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
  };

  private updateUrlWithSuffix(url: string, defn: GithubType): string {
    const urlTrimmed = url.trim();
    if (!defn.urlSuffix) {
      return urlTrimmed;
    }
    const ready = urlTrimmed[urlTrimmed.length - 1] === '/' ? urlTrimmed.substring(0, urlTrimmed.length - 1) : urlTrimmed;
    return ready + '/' + defn.urlSuffix;
  }

  toggleOverwriteEndpoints() {
    // wait a tick for validators to adjust to new data in the directive
    setTimeout(() => {
      this.registerForm.controls.nameField.updateValueAndValidity();
      this.registerForm.controls.urlField.updateValueAndValidity();
    });
  }
}
