// UAA User Info
export interface UserProfileInfo {
  id: string;
  name: {
    familyName: string;
    givenName: string;
  };
  userName: string;
  meta: {
    version: number;
    created: string;
    lastModified: string;
  };
  verified: boolean;
  active: boolean;
  emails: UserProfileInfoEmail[];
  groups?: [
    {
      display: string;
      type: string;
      value: string;
    }
  ];
  approvals?: any;
  passwordLastModified: string;
  schemas: any;
  zoneId: string;
  origin: string;
}

export interface UserProfileInfoEmail {
  primary: boolean;
  value: string;
}

export interface UserProfilePasswordUpdate {
  oldPassword: string;
  password: string;
}

export interface UserProfileInfoUpdates {
  familyName?: string;
  givenName?: string;
  emailAddress?: string;
  newPassword?: string;
  confirmPassword?: string;
  currentPassword?: string;
}
