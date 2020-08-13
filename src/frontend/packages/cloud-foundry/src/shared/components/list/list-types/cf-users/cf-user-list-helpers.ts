import { CfUser } from '../../../../../store/types/cf-user.types';


export const userListUserVisibleKey = 'showUsers';

export enum UserListUsersVisible {
  ALL = 'all',
  WITH_ROLE = 'withRole',
  NO_ROLE = 'noRole'
}

export const userHasRole = (user: CfUser, roleProperty: string): boolean => {
  return !!user[roleProperty] && !!user[roleProperty].length;
};
