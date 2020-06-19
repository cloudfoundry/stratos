import { STRATOS_ENDPOINT_TYPE, stratosEntityFactory, userFavouritesEntityType } from '../helpers/stratos-entity-factory';
import { PaginatedAction } from '../types/pagination.types';
import { EntityRequestAction } from '../types/request.types';
import { IFavoriteMetadata, UserFavorite } from '../types/user-favorites.types';

abstract class BaseUserFavoritesAction implements EntityRequestAction {
  constructor(
    actionType: string,
  ) {
    this.type = actionType;
  }
  public type: string;
  public url = '/user-favorites';

  public entity = [stratosEntityFactory(userFavouritesEntityType)]
  public entityType = userFavouritesEntityType;
  public endpointType = STRATOS_ENDPOINT_TYPE;
}


abstract class BaseSingleUserFavouritesAction extends BaseUserFavoritesAction {
  constructor(actionType: string, public guid: string) {
    super(actionType);
  }
}

abstract class BaseMultipleUserFavouritesAction extends BaseUserFavoritesAction implements PaginatedAction {
  guid: string;
  constructor(actionType: string, public paginationKey: string) {
    super(actionType);
  }
}


abstract class BaseSuccessFavouritesAction extends BaseMultipleUserFavouritesAction {
  constructor(
    paginationKey: string,
    public favorites: UserFavorite<IFavoriteMetadata>[],
    type: string
  ) {
    super(type, paginationKey);
  }
}

abstract class BaseSuccessFavouriteAction extends BaseSingleUserFavouritesAction {
  constructor(
    public favorite: UserFavorite<IFavoriteMetadata>,
    type: string
  ) {
    super(type, favorite.guid);
  }
}

// --------- 

export class GetUserFavoritesAction extends BaseMultipleUserFavouritesAction {
  static PAGINATION_KEY = 'user_favourites';
  static ACTION_TYPE = 'GET_USER_FAVORITES';
  constructor() {
    super(
      GetUserFavoritesAction.ACTION_TYPE,
      GetUserFavoritesAction.PAGINATION_KEY
    );
  }
}

export class GetUserFavoritesSuccessAction extends BaseSuccessFavouritesAction {
  static ACTION_TYPE = 'GET_USER_FAVORITES_SUCCESS';
  constructor(favorites: UserFavorite<IFavoriteMetadata>[]) {
    super(
      GetUserFavoritesAction.PAGINATION_KEY,
      favorites,
      GetUserFavoritesSuccessAction.ACTION_TYPE
    );
  }
}

export class GetUserFavoritesFailedAction extends BaseMultipleUserFavouritesAction {
  static ACTION_TYPE = 'GET_USER_FAVORITES_FAILED';
  constructor() {
    super(
      GetUserFavoritesFailedAction.ACTION_TYPE,
      GetUserFavoritesAction.PAGINATION_KEY
    );
  }
}

// --------- 

export class RemoveUserFavoriteAction extends BaseSingleUserFavouritesAction {
  static ACTION_TYPE = 'REMOVE_USER_FAVORITE';
  constructor(public favorite: UserFavorite<IFavoriteMetadata>) {
    super(
      favorite.guid,
      RemoveUserFavoriteAction.ACTION_TYPE
    );
  }
}

export class RemoveUserFavoriteSuccessAction extends BaseSuccessFavouriteAction {
  static ACTION_TYPE = 'REMOVE_USER_FAVORITE_SUCCESS';
  constructor(favorite: UserFavorite<IFavoriteMetadata>) {
    super(favorite, RemoveUserFavoriteSuccessAction.ACTION_TYPE);
  }
}

// --------- 

export class SaveUserFavoriteAction extends BaseSingleUserFavouritesAction {
  static ACTION_TYPE = 'SAVE_USER_FAVORITE';
  constructor(public favorite: UserFavorite<IFavoriteMetadata>) {
    super(SaveUserFavoriteAction.ACTION_TYPE, favorite.guid);
  }
}

export class SaveUserFavoriteSuccessAction extends BaseSuccessFavouriteAction {
  static ACTION_TYPE = 'SAVE_USER_FAVORITE_SUCCESS';
  constructor(favorite: UserFavorite<IFavoriteMetadata>) {
    super(favorite, SaveUserFavoriteSuccessAction.ACTION_TYPE);
  }
}

// --------- 

export class ToggleUserFavoriteAction extends BaseSingleUserFavouritesAction {
  static ACTION_TYPE = 'TOGGLE_USER_FAVORITE';
  constructor(public favorite: UserFavorite<IFavoriteMetadata>) {
    super(favorite.guid, ToggleUserFavoriteAction.ACTION_TYPE);
  }
}

// ---------
export class UpdateUserFavoriteMetadataAction extends BaseSingleUserFavouritesAction {
  static ACTION_TYPE = 'UPDATE_FAVORITE_METADATA';
  constructor(public favorite: UserFavorite<IFavoriteMetadata>) {
    super(favorite.guid, UpdateUserFavoriteMetadataAction.ACTION_TYPE);
  }
}

export class UpdateUserFavoriteMetadataSuccessAction extends BaseSuccessFavouriteAction {
  static ACTION_TYPE = 'UPDATE_FAVORITE_METADATA_SUCCESS';
  constructor(public favorite: UserFavorite<IFavoriteMetadata>) {
    super(favorite, UpdateUserFavoriteMetadataSuccessAction.ACTION_TYPE);
  }
}
