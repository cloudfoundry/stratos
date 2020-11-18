import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { getIdFromRoute } from '../../../../../core/src/core/utils.service';
import { entityCatalog } from '../../../../../store/src/public-api';
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
  description: string;
}

enum GitTypeKeys {
  GITHUB_COM = 'githubdotcom',
  GITHUB_ENTERPRISE = 'githubenterprize',
  GITLAB_COM = 'githubdotcom',
  GITLAB_ENTERPRISE = 'githubenterprize',
}

@Component({
  selector: 'app-git-registration',
  templateUrl: './git-registration.component.html',
  styleUrls: ['./git-registration.component.scss'],
})
export class GitRegistrationComponent {

  public gitTypes: EndpointSubTypes;

  public selectedType: GitTypeKeys;

  public epSubType: GIT_ENDPOINT_SUB_TYPES;
  constructor(
    gitSCMService: GitSCMService,
    activatedRoute: ActivatedRoute,
  ) {
    // this.epType = getIdFromRoute(activatedRoute, 'type');
    this.epSubType = getIdFromRoute(activatedRoute, 'subtype');

    const githubLabel = entityCatalog.getEndpoint(GIT_ENDPOINT_TYPE, GIT_ENDPOINT_SUB_TYPES.GITHUB).definition.label || 'Github';
    const gitlabLabel = entityCatalog.getEndpoint(GIT_ENDPOINT_TYPE, GIT_ENDPOINT_SUB_TYPES.GITLAB).definition.label || 'Gitlab';

    // TODO: RC fix - should only allow github.com to be registered once (cannot register multiple endpoints with same url).
    // Set a default/starting option
    this.gitTypes = {
      [GIT_ENDPOINT_SUB_TYPES.GITHUB]: {
        label: githubLabel,
        description: '',
        types: {
          [GitTypeKeys.GITHUB_COM]: {
            label: 'github.com',
            url: gitSCMService.getSCM('github', null).getPublicApi(),
            description: `Your credentials will be used to fetch information from the public ${githubLabel} instance`,
          },
          [GitTypeKeys.GITHUB_ENTERPRISE]: {
            label: 'Github Enterprise',
            url: null,
            description: `Your credentials will be used to fetch information from a private ${githubLabel} instance`,
          }
        }
      },
      [GIT_ENDPOINT_SUB_TYPES.GITLAB]: {
        label: gitlabLabel,
        description: '',
        types: {
          [GitTypeKeys.GITLAB_COM]: {
            label: 'gitlab.com',
            url: gitSCMService.getSCM('gitlab', null).getPublicApi(),
            description: `Your credentials will be used to fetch information from the public ${gitlabLabel} instance`,
          },
          [GitTypeKeys.GITLAB_ENTERPRISE]: {
            label: 'Gitlab Enterprise',
            url: null,
            description: `Your credentials will be used to fetch information from a private ${gitlabLabel} instance`,
          }
        }
      }
    };
    this.selectedType = Object.keys(this.gitTypes[this.epSubType].types)[0] as GitTypeKeys;

  }
}
