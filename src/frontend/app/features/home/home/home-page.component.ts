import { AppState } from '../../../store/app-state';
import { Store } from '@ngrx/store';
import { Component, OnInit, AfterContentInit } from '@angular/core';
import { of } from 'rxjs';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {
  definition: { title: string; getData: (cn?: number) => any; }[];

  constructor(private store: Store<AppState>) {

    const getFauxData = (pn: number) => (cn = 1) => {
      const length = pn * cn;
      const list = [];
      for (let i = 0; i <= length; i++) {
        list.push(i);
      }
      return of(list);
    };
    this.definition = [
      {
        title: '1',
        getData: getFauxData(1)
      },
      {
        title: '2',
        getData: getFauxData(2)
      },
      {
        title: '3',
        getData: getFauxData(3)
      },
      {
        title: '4',
        getData: getFauxData(4)
      },
      {
        title: '4',
        getData: getFauxData(4)
      },
      {
        title: '4',
        getData: getFauxData(4)
      }
    ];

  }

  ngOnInit() { }
}
