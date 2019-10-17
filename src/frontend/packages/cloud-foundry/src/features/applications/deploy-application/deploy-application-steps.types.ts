import { ActivatedRoute } from '@angular/router';

import { SourceType } from '../../../../../cloud-foundry/src/store/types/deploy-application.types';

export enum DEPLOY_TYPES_IDS {
  GITLAB = 'gitlab',
  GITHUB = 'github',
  GIT_URL = 'giturl',
  FILE = 'file',
  FOLDER = 'folder'
}

export const AUTO_SELECT_DEPLOY_TYPE_URL_PARAM = 'auto-select-deploy';

export const getApplicationDeploySourceTypes = (): SourceType[] => [
  {
    name: 'Public GitHub',
    id: DEPLOY_TYPES_IDS.GITHUB,
    group: 'gitscm',
    helpText: 'Please select the public GitHub project and branch you would like to deploy from.',
    graphic: {
      location: '/core/assets/endpoint-icons/github-logo.png'
    }
  },
  {
    name: 'Public GitLab',
    id: DEPLOY_TYPES_IDS.GITLAB,
    group: 'gitscm',
    helpText: 'Please select the public GitLab project and branch you would like to deploy from.',
    graphic: {
      location: '/core/assets/endpoint-icons/gitlab-icon-rgb.svg'
    }
  },
  {
    name: 'Public Git URL',
    id: DEPLOY_TYPES_IDS.GIT_URL,
    helpText: 'Please enter the public git url and branch or tag you would like to deploy from.',
    graphic: {
      location: '/core/assets/endpoint-icons/Git-logo.png'
    }
  },
  {
    name: 'Application Archive File',
    id: DEPLOY_TYPES_IDS.FILE,
    helpText: 'Please select the archive file that contains the application you would like to deploy.',
    graphic: { matIcon: 'unarchive' }
  },
  {
    name: 'Application Folder',
    id: DEPLOY_TYPES_IDS.FOLDER,
    helpText: 'Please select the folder that contains the application you would like to deploy.',
    graphic: { matIcon: 'folder' }
  },
];

export const getAutoSelectedDeployType = (activatedRoute: ActivatedRoute) => {
  const typeId = activatedRoute.snapshot.queryParams[AUTO_SELECT_DEPLOY_TYPE_URL_PARAM];
  return getApplicationDeploySourceTypes().find(source => source.id === typeId);
};

