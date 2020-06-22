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
    type: string,
    public favorites: UserFavorite<IFavoriteMetadata>[],
    paginationKey: string,
  ) {
    super(type, paginationKey);
  }
}

abstract class BaseSuccessFavouriteAction extends BaseSingleUserFavouritesAction {
  constructor(
    type: string,
    public favorite: UserFavorite<IFavoriteMetadata>,
  ) {
    super(type, favorite.guid);
  }
}

// --------- 

export class GetUserFavoritesAction extends BaseMultipleUserFavouritesAction {
  static PAGINATION_KEY = 'user_favourites';
  static ACTION_TYPE = '[Favorite] Get Favorites';
  constructor() {
    super(
      GetUserFavoritesAction.ACTION_TYPE,
      GetUserFavoritesAction.PAGINATION_KEY
    );
  }
}

export class GetUserFavoritesSuccessAction extends BaseSuccessFavouritesAction {
  static ACTION_TYPE = '[Favorite] Get Favorites Success';
  constructor(favorites: UserFavorite<IFavoriteMetadata>[]) {
    super(
      GetUserFavoritesSuccessAction.ACTION_TYPE,
      favorites,
      GetUserFavoritesAction.PAGINATION_KEY,
    );
  }
}

export class GetUserFavoritesFailedAction extends BaseMultipleUserFavouritesAction {
  static ACTION_TYPE = '[Favorite] Get Favorites Failed';
  constructor() {
    super(
      GetUserFavoritesFailedAction.ACTION_TYPE,
      GetUserFavoritesAction.PAGINATION_KEY
    );
  }
}

// --------- 

export class RemoveUserFavoriteAction extends BaseSingleUserFavouritesAction {
  static ACTION_TYPE = '[Favorite] Remove Favorite';
  constructor(public favorite: UserFavorite<IFavoriteMetadata>) {
    super(
      RemoveUserFavoriteAction.ACTION_TYPE,
      favorite.guid,
    );
  }
}

export class RemoveUserFavoriteSuccessAction extends BaseSuccessFavouriteAction {
  static ACTION_TYPE = '[Favorite] Remove Favorite Success';
  constructor(favorite: UserFavorite<IFavoriteMetadata>) {
    super(RemoveUserFavoriteSuccessAction.ACTION_TYPE, favorite)
  }
}

// --------- 

export class SaveUserFavoriteAction extends BaseSingleUserFavouritesAction {
  static ACTION_TYPE = '[Favorite] Save Favorite';
  constructor(public favorite: UserFavorite<IFavoriteMetadata>) {
    super(SaveUserFavoriteAction.ACTION_TYPE, favorite.guid);
  }
}

export class SaveUserFavoriteSuccessAction extends BaseSuccessFavouriteAction {
  static ACTION_TYPE = '[Favorite] Save Favorite Success';
  constructor(favorite: UserFavorite<IFavoriteMetadata>) {
    super(SaveUserFavoriteSuccessAction.ACTION_TYPE, favorite);
  }
}

// --------- 

export class ToggleUserFavoriteAction extends BaseSingleUserFavouritesAction {
  static ACTION_TYPE = '[Favorite] Toggle Favorite';
  constructor(public favorite: UserFavorite<IFavoriteMetadata>) {
    super(ToggleUserFavoriteAction.ACTION_TYPE, favorite.guid);
  }
}

// ---------
export class UpdateUserFavoriteMetadataAction extends BaseSingleUserFavouritesAction {
  static ACTION_TYPE = '[Favorite] Update Favorite Metadata';
  constructor(public favorite: UserFavorite<IFavoriteMetadata>) {
    super(UpdateUserFavoriteMetadataAction.ACTION_TYPE, favorite.guid);
  }
}

export class UpdateUserFavoriteMetadataSuccessAction extends BaseSuccessFavouriteAction {
  static ACTION_TYPE = '[Favorite] Update Favorite Metadata Success';
  constructor(public favorite: UserFavorite<IFavoriteMetadata>) {
    super(UpdateUserFavoriteMetadataSuccessAction.ACTION_TYPE, favorite);
  }
}
