
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
}
