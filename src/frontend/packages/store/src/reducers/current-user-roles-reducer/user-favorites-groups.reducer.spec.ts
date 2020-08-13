import {
  GetUserFavoritesAction,
  GetUserFavoritesFailedAction,
  GetUserFavoritesSuccessAction,
  RemoveUserFavoriteSuccessAction,
  SaveUserFavoriteSuccessAction,
} from '../../actions/user-favourites.actions';
import { getDefaultFavoriteGroupsState, IUserFavoritesGroupsState } from '../../types/favorite-groups.types';
import { IEndpointFavMetadata, UserFavorite } from '../../types/user-favorites.types';
import { deriveEndpointFavoriteFromFavorite } from '../../user-favorite-helpers';
import { userFavoriteGroupsReducer } from './user-favorites-groups.reducer';

const endpointFavorite = () => new UserFavorite<IEndpointFavMetadata>(
  'endpoint1',
  'cf',
  'endpoint'
);

const endpointFavorite2 = () => new UserFavorite<IEndpointFavMetadata>(
  'endpoint2',
  'cf',
  'endpoint'
);

const favorite = () => new UserFavorite<IEndpointFavMetadata>(
  'endpoint1',
  'cf',
  'application',
  'entity1'
);

const favorite2 = () => new UserFavorite<IEndpointFavMetadata>(
  'endpoint2',
  'cf',
  'application',
  'entity2'
);

const favorite21 = () => new UserFavorite<IEndpointFavMetadata>(
  'endpoint2',
  'cf',
  'application',
  'entity21'
);

const favorite3 = () => new UserFavorite<IEndpointFavMetadata>(
  'endpoint3',
  'cf',
  'application',
  'entity3'
);

describe('userFavoritesReducer', () => {
  it(' [empty state] should add new favorite endpoint', () => {
    const endpointFav = endpointFavorite();
    const action = new SaveUserFavoriteSuccessAction(endpointFav);
    const newState = userFavoriteGroupsReducer(undefined, action);
    const defaultState = getDefaultFavoriteGroupsState();
    expect(newState).toEqual({
      ...defaultState,
      groups: {
        [endpointFav.guid]: {
          ethereal: false,
          search: null,
          typeFilter: null,
          entitiesIds: []
        }
      }
    } as IUserFavoritesGroupsState);
  });

  it(' [empty state] should add new entity and mark endpoint group as ethereal', () => {
    const fav = favorite();
    const endpointFav = deriveEndpointFavoriteFromFavorite(fav);
    const action = new SaveUserFavoriteSuccessAction(fav);
    const newState = userFavoriteGroupsReducer(undefined, action);
    const defaultState = getDefaultFavoriteGroupsState();
    expect(newState).toEqual({
      ...defaultState,
      groups: {
        [endpointFav.guid]: {
          ethereal: true,
          search: null,
          typeFilter: null,
          entitiesIds: [
            fav.guid
          ]
        }
      }
    } as IUserFavoritesGroupsState);
  });

  it('should add new favorite to none ethereal endpoint group', () => {
    const endpointFav = endpointFavorite();
    const fav = favorite();
    const action = new SaveUserFavoriteSuccessAction(fav);
    const defaultState = getDefaultFavoriteGroupsState();
    const newState = userFavoriteGroupsReducer(
      {
        ...defaultState,
        groups: {
          [endpointFav.guid]: {
            ethereal: false,
            search: null,
            typeFilter: null,
            entitiesIds: []
          }
        }
      },
      action
    );

    expect(newState).toEqual({
      ...defaultState,
      groups: {
        [endpointFav.guid]: {
          ethereal: false,
          search: null,
          typeFilter: null,
          entitiesIds: [
            fav.guid
          ]
        }
      }
    } as IUserFavoritesGroupsState);
  });

  it('should sort all endpoints into appropriate groups', () => {
    const fav = favorite();
    const fav2 = favorite2();
    const endpointFav = endpointFavorite();
    const endpointFav2 = endpointFavorite2();
    const fav21 = favorite21();
    const fav3 = favorite3();

    const favs = [
      fav,
      fav2,
      endpointFav,
      endpointFav2,
      fav21,
      fav3
    ];

    const action = new GetUserFavoritesSuccessAction(favs);
    const newState = userFavoriteGroupsReducer(undefined, action);

    const endpoint3Fav = deriveEndpointFavoriteFromFavorite(fav3);
    const defaultState = getDefaultFavoriteGroupsState();
    expect(newState).toEqual({
      ...defaultState,
      groups: {
        [endpointFav.guid]: {
          ethereal: false,
          search: null,
          typeFilter: null,
          entitiesIds: [
            fav.guid
          ]
        },
        [endpointFav2.guid]: {
          ethereal: false,
          search: null,
          typeFilter: null,
          entitiesIds: [
            fav2.guid,
            fav21.guid
          ]
        },
        [endpoint3Fav.guid]: {
          ethereal: true,
          search: null,
          typeFilter: null,
          entitiesIds: [
            fav3.guid
          ]
        }
      }
    } as IUserFavoritesGroupsState);
  });

  it('should delete new favorite from none ethereal group', () => {
    const endpointFav = endpointFavorite();
    const fav = favorite();
    const action = new RemoveUserFavoriteSuccessAction(fav);
    const defaultState = getDefaultFavoriteGroupsState();
    const newState = userFavoriteGroupsReducer({
      ...defaultState,
      groups: {
        [endpointFav.guid]: {
          ethereal: false,
          search: null,
          typeFilter: null,
          entitiesIds: [
            fav.guid
          ]
        }
      }
    }, action);

    expect(newState).toEqual({
      ...defaultState,
      groups: {
        [endpointFav.guid]: {
          ethereal: false,
          search: null,
          typeFilter: null,
          entitiesIds: [
          ]
        }
      }
    } as IUserFavoritesGroupsState);
  });

  it('should delete new favorite from ethereal group', () => {
    const endpointFav = endpointFavorite();
    const fav = favorite();
    const action = new RemoveUserFavoriteSuccessAction(fav);
    const defaultState = getDefaultFavoriteGroupsState();
    const newState = userFavoriteGroupsReducer({
      ...defaultState,
      groups: {
        [endpointFav.guid]: {
          ethereal: true,
          search: null,
          typeFilter: null,
          entitiesIds: [
            fav.guid
          ]
        }
      }
    }, action);
    expect(newState).toEqual({
      ...defaultState,
      groups: {}
    } as IUserFavoritesGroupsState);
  });

  it('should set fetching to true', () => {
    const action = new GetUserFavoritesAction();
    const defaultState = getDefaultFavoriteGroupsState();
    const newState = userFavoriteGroupsReducer(undefined, action);
    expect(newState).toEqual({
      ...defaultState,
      busy: true
    } as IUserFavoritesGroupsState);
  });

  it('should set fetching to false', () => {
    const action = new GetUserFavoritesSuccessAction([]);
    const defaultState = getDefaultFavoriteGroupsState();
    const newState = userFavoriteGroupsReducer({
      ...defaultState,
      busy: true
    }, action);
    expect(newState).toEqual({
      ...defaultState,
      busy: false
    } as IUserFavoritesGroupsState);
  });

  it('should set error to true', () => {
    const action = new GetUserFavoritesFailedAction();
    const defaultState = getDefaultFavoriteGroupsState();
    const newState = userFavoriteGroupsReducer({
      ...defaultState,
      busy: true,
      error: false
    }, action);
    expect(newState).toEqual({
      ...defaultState,
      busy: false,
      error: true,
      message: 'Failed to fetch favorites'
    } as IUserFavoritesGroupsState);
  });
});

