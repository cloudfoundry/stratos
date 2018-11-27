import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { GetUserFavoritesAction } from '../../../store/actions/user-favourites-actions/get-user-favorites-action';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent {

  constructor(store: Store<AppState>) {
    store.dispatch(new GetUserFavoritesAction());
  }
}
