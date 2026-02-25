import { CfUser } from '../../../../../store/types/cf-user.types';


export const userListUserVisibleKey = 'showUsers';

export enum UserListUsersVisible {
  ALL = 'all',
  WITH_ROLE = 'withRole',
  NO_ROLE = 'noRole'
}

export const userHasRole = (user: CfUser, roleProperty: keyof CfUser): boolean => {
  const roleValue = user[roleProperty];
  return Array.isArray(roleValue) && roleValue.length > 0;
};
