
export interface NewAppCFDetails {
  cloudFoundry: string;
  org: string;
  space: string;
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
