import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { IAllFavorites, UserFavoriteManager } from '../../../core/user-favorite-manager';
import { AppState } from '../../../store/app-state';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent {

  constructor(private store: Store<AppState>) { }
}
