import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { IAllFavorites, UserFavoriteManager } from '../../../core/user-favorite-manager';
import { AppState } from '../../../store/app-state';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {
  favs$: Observable<IAllFavorites>;
  ngOnInit() {
    const manager = new UserFavoriteManager(this.store);
    this.favs$ = manager.hydrateAllFavorites();
  }

  constructor(private store: Store<AppState>) { }
}
