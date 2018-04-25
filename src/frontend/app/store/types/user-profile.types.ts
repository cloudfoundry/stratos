import { TRequestTypeKeys, RequestSectionKeys } from '../reducers/api-request-reducer/types';

// UAA User Info
export interface UserProfileInfo {
  id: string;
  name: {
    familyName: string;
    givenName: string;
  };
  userName: string;
  meta: {
    created: string;
    lastModified: string;
  };
  verified: boolean;
  active: boolean;
  emails: [
    {
      primary: boolean;
      value: string;
    }
  ];
  groups?: [
    {
      display: string;
      type: string;
      value: string;
    }
  ];
  approvals?: any;
  passwordLastModified: string;
}


export const userProfileStoreNames: {
  section: TRequestTypeKeys,
  type: string
} = {
    section: RequestSectionKeys.Other,
    type: 'userProfile'
  };
