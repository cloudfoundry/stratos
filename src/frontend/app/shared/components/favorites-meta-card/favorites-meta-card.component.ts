import { Component, OnInit, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { CardStatus } from '../application-state/application-state.service';

export interface IFavoritesMetaCardLine {
  label: string;
  value: string;
}

export interface IFavoritesMetaCardConfig {
  prettyType: string;
  type: string;
  lines: [IFavoritesMetaCardLine, IFavoritesMetaCardLine, IFavoritesMetaCardLine];
  name: string;
  status$?: Observable<CardStatus>;
}

@Component({
  selector: 'app-favorites-meta-card',
  templateUrl: './favorites-meta-card.component.html',
  styleUrls: ['./favorites-meta-card.component.scss']
})
export class FavoritesMetaCardComponent implements OnInit {

  @Input()
  public config: IFavoritesMetaCardConfig;

  constructor() { }

  ngOnInit() {
  }

}
