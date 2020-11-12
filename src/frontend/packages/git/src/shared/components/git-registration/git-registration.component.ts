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
  label: string,
  description: string,
  types: {
    [key: string]: GithubType;
  };
};

interface GithubType {
  url: string,
  label: string,
  description: string,
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

  public showConnectStep = true;// TODO: RC



  public epType: string;
  public epSubType: GIT_ENDPOINT_SUB_TYPES;
  // private gitSCMService: GitSCMService;
  // TODO: RC add url validation to git endpoint types

  constructor(
    // store: Store<GeneralEntityAppState>,
    gitSCMService: GitSCMService,
    activatedRoute: ActivatedRoute,
    // private snackBarService: SnackBarService
  ) {
    this.epType = getIdFromRoute(activatedRoute, 'type');
    this.epSubType = getIdFromRoute(activatedRoute, 'subtype');
    // const endpoint = entityCatalog.getEndpoint(epType, epSubType);

    const githubLabel = entityCatalog.getEndpoint(GIT_ENDPOINT_TYPE, GIT_ENDPOINT_SUB_TYPES.GITHUB).definition.label || 'Github';
    const gitlabLabel = entityCatalog.getEndpoint(GIT_ENDPOINT_TYPE, GIT_ENDPOINT_SUB_TYPES.GITLAB).definition.label || 'Gitlab';
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
            label: 'github enterprise',
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
            label: 'gitlab enterprise',
            url: null,
            description: `Your credentials will be used to fetch information from a private ${gitlabLabel} instance`,
          }
        }
      }
    };
    this.selectedType = Object.keys(this.gitTypes[this.epSubType].types)[0] as GitTypeKeys;

  }



}
  // set selectedTile(tile: ITileConfig<ICreateEndpointTilesData>) {
  //   super.selectedTile = tile;

  //   if (tile) {
  //     let skipRegister = false;
  //     switch (tile.data.type) {
  //       case GIT_ENDPOINT_SUB_TYPES.PUBLIC_GITHUB:
  //         // TODO: RC should there be some kind of warning/feedback for this?
  //         stratosEntityCatalog.endpoint.api.register(
  //           tile.data.parentType,
  //           tile.data.type,
  //           'Public Github',
  //           this.gitSCMService.getSCM('github').getAPIUrl(),
  //           false // TODO: RC handle error
  //         );
  //         this.store.dispatch(new RouterNav({ path: `endpoints` }));
  //         break;
  //       case GIT_ENDPOINT_SUB_TYPES.PRIVATE_GITHUB:
  //         // TODO: RC should there be some kind of warning/feedback for this?
  //         stratosEntityCatalog.endpoint.api.register(
  //           tile.data.parentType,
  //           tile.data.type,
  //           'Private Github',
  //           this.gitSCMService.getSCM('github').getAPIUrl(),
  //           false // TODO: RC handle error
  //         );
  //         // Request creds
  //         // Go to endpoints page
  //         skipRegister = true; // TODO: Wire in to endpoints/new to go straight to connect step
  //         break;
  //       case GIT_ENDPOINT_SUB_TYPES.PUBLIC_GITLAB:
  //         // Register public gitlab api url as endpoint (and handle errors)
  //         stratosEntityCatalog.endpoint.api.register(
  //           tile.data.parentType,
  //           tile.data.type,
  //           'Public Gitlab',
  //           this.gitSCMService.getSCM('gitlab').getAPIUrl(),
  //           false // TODO: RC handle error
  //         );
  //         // Go to endpoints page
  //         this.store.dispatch(new RouterNav({ path: `endpoints` }));
  //         break;

  //       case GIT_ENDPOINT_SUB_TYPES.PRIVATE_GITLAB:
  //         // Register private gitlab api url as endpoint (and handle errors)
  //         stratosEntityCatalog.endpoint.api.register(
  //           tile.data.parentType,
  //           tile.data.type,
  //           'Private Gitlab',
  //           this.gitSCMService.getSCM('gitlab').getAPIUrl(),
  //           false // TODO: RC handle error
  //         );
  //         // Request creds
  //         // Go to endpoints page
  //         skipRegister = true; // TODO: Wire in to endpoints/new to go straight to connect step
  //         break;
  //       default: {
  //         // GIT_ENDPOINT_SUB_TYPES.PUBLIC_GIT:
  //         // GIT_ENDPOINT_SUB_TYPES.PRIVATE_GIT:
  //         // This will take the user on the usual register endpoint step... and if there's auth configured the connect step
  //         this.store.dispatch(new RouterNav({
  //           path: `endpoints/new/${tile.data.parentType || tile.data.type}/${tile.data.parentType ? tile.data.type : ''}`,
  //           query: {
  //             [BASE_REDIRECT_QUERY]: 'endpoints/new'
  //           }
  //         }));
  //         break;
  //       }
  //     }
  //   }
  // }

    // TODO: RC there can only be one registered github.com endpoint
  // TODO: RC this is duped from create-endpoint-cf-step-1
  // registerEndpoint: StepOnNextFunction = () => {
  //   const name = this.gitTypes[this.epSubType].label;
  //   return stratosEntityCatalog.endpoint.api.register<ActionState>(
  //     this.epType,
  //     this.epSubType,
  //     name,
  //     this.gitTypes[this.epSubType].types[this.selectedType].url,
  //     false
  //   ).pipe(
  //     pairwise(),
  //     filter(([oldVal, newVal]) => (oldVal.busy && !newVal.busy)),
  //     map(([oldVal, newVal]) => newVal),
  //     map(result => {
  //       const data: ConnectEndpointConfig = {
  //         guid: result.message,
  //         name,
  //         type: this.epType,
  //         subType: this.epSubType,
  //         ssoAllowed: false // TODO: RC !!
  //       };
  //       if (!result.error) {
  //         this.snackBarService.show(`Successfully registered '${name}'`);
  //       }
  //       const success = !result.error;
  //       return {
  //         success,
  //         redirect: success,
  //         message: success ? '' : result.message,
  //         data
  //       };
  //     })
  //   );
  // };

  // skipRegistration(): boolean {
  //   return !!this.gitTypes?.[this.epSubType]?.types?.[this.selectedType]?.url;
  // }