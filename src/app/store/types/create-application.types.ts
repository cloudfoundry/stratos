
import { DeployApplicationSource } from './deploy-application.types';

export interface NewAppCFDetails {
  cloudFoundry: any;
  org: any;
  space: any;
}

export interface CreateNewApplicationState {
  cloudFoundryDetails: NewAppCFDetails;
  name: string;
  nameCheck: {
    checking: boolean,
    available: boolean,
    name: string
  };
  applicationSource?: DeployApplicationSource;
  projectExists?: {
    checking: boolean,
    exists: boolean,
    name: string,
    data: any
  };
}
