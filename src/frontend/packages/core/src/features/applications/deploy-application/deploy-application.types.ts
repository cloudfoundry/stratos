import { SourceType } from '../../../../../store/src/types/deploy-application.types';

export enum DEPLOY_TYPES_IDS {
  GIT_LAB = 'gitlab',
  GITHUB = 'github',
  GIT_URL = 'giturl',
  FILE = 'file',
  FOLDER = 'folder'
}

export const getApplicationDeploySourceTypes = (): SourceType[] => [
  {
    name: 'Public GitHub', id: DEPLOY_TYPES_IDS.GITHUB, group: 'gitscm', graphic: {
      location: '/core/assets/endpoint-icons/github-logo.png'
    }
  },
  {
    name: 'Public GitLab', id: DEPLOY_TYPES_IDS.GIT_LAB, group: 'gitscm', graphic: {
      location: '/core/assets/endpoint-icons/gitlab-icon-rgb.svg'
    }
  },
  {
    name: 'Public Git URL', id: DEPLOY_TYPES_IDS.GIT_URL, graphic: {
      location: '/core/assets/endpoint-icons/Git-logo.png'
    }
  },
  { name: 'Application Archive File', id: DEPLOY_TYPES_IDS.FILE, graphic: { matIcon: 'archive' } },
  { name: 'Application Folder', id: DEPLOY_TYPES_IDS.FOLDER, graphic: { matIcon: 'folder' } },
];

export const AUTO_SELECT_DEPLOY_TYPE_URL_PARAM = 'auto-select-deploy';