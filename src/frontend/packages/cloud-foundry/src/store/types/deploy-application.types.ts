import { GitBranch } from '@stratosui/git';

import { ITileGraphic } from '../../../../core/src/shared/components/tile/tile-selector.types';
import { NewAppCFDetails } from './create-application.types';

export interface SourceType {
  name: string;
  id: string;
  endpointGuid?: string;
  helpText?: string;
  disabledText?: string;
  group?: string;
  graphic?: ITileGraphic;
}

export enum DeployState {
  UNKNOWN = 1,
  CLONED,
  FETCHED_MANIFEST,
  PUSHING,
  DEPLOYED,
  FAILED,
  SOCKET_OPEN
}

export enum SocketEventTypes {
  DATA = 20000,
  MANIFEST = 20001,
  CLOSE_SUCCESS = 20002,
  APP_GUID_NOTIFY = 20003,
  CLOSE_PUSH_ERROR = 40000,
  CLOSE_NO_MANIFEST = 40001,
  CLOSE_INVALID_MANIFEST = 40002,
  CLOSE_FAILED_CLONE = 40003,
  CLOSE_FAILED_NO_BRANCH = 40004,
  CLOSE_FAILURE = 40005,
  CLOSE_NO_SESSION = 40006,
  CLOSE_NO_CNSI = 40007,
  CLOSE_NO_CNSI_USERTOKEN = 40008,
  CLOSE_ACK = 40009,
  EVENT_CLONED = 10000,
  EVENT_FETCHED_MANIFEST = 10001,
  EVENT_PUSH_STARTED = 10002,
  EVENT_PUSH_COMPLETED = 10003,
  SOURCE_REQUIRED = 30000,
  SOURCE_GITSCM = 30001,
  SOURCE_FOLDER = 30002,
  SOURCE_FILE = 30003,
  SOURCE_FILE_DATA = 30004,
  SOURCE_FILE_ACK = 30005,
  SOURCE_GITURL = 30006,
  SOURCE_WAIT_ACK = 30007,
  SOURCE_DOCKER_IMG = 30008,
  OVERRIDES_REQUIRED = 50000,
  OVERRIDES_SUPPLIED = 50001
}

export interface DeployApplicationSource {
  type: SourceType;
  gitDetails?: GitAppDetails;
  dockerDetails?: DockerAppDetails;
}

export interface DockerAppDetails {
  applicationName: string;
  dockerImage: string;
  dockerUsername?: string;
}

export interface GitAppDetails {
  projectName: string;
  branch: GitBranch;
  endpointGuid: string;
  accessToken?: string;
  commit?: string;
  branchName?: string;
  url?: string;
}

export interface OverrideAppDetails {
  // The deploy-options form leaves every field optional (no required
  // validators), so each value is genuinely null when the user clears /
  // never touches it. diskQuota/memQuota are additionally computed as
  // null when the numeric input is empty. The override object is only
  // JSON-serialised onto the deploy socket, where null is a valid
  // "not supplied" marker, so reflect that nullability in the type.
  name: string | null;
  buildpack: string | null;
  instances: number | null;
  diskQuota: string | null;
  memQuota: string | null;
  doNotStart: boolean;
  noRoute: boolean;
  randomRoute: boolean;
  host: string | null;
  domain: string | null;
  path: string | null;
  startCmd: string | null;
  healthCheckType: string | null;
  stack: string | null;
  time: number | null;
  dockerImage: string | null;
  dockerUsername: string | null;
}

export interface ProjectExists {
  checking: boolean;
  exists: boolean;
  error: boolean;
  name: string;
  data?: any;
}
export interface DeployApplicationState {
  // Null until the user completes the CF target step of the wizard.
  cloudFoundryDetails: NewAppCFDetails | null;
  applicationSource?: DeployApplicationSource;
  applicationOverrides?: OverrideAppDetails;
  projectExists?: ProjectExists;
}

export interface AppData {
  Name: string;
  cloudFoundry: string;
  org: string;
  space: string;
}
