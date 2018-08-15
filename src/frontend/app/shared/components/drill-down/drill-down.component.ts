import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';


export interface DrillDownLevel {
  title: string;
  getData: (parent?) => Observable<any[]>;
}

export type DrillDownDefinition = DrillDownLevel[];

@Component({
  selector: 'app-drill-down',
  templateUrl: './drill-down.component.html',
  styleUrls: ['./drill-down.component.scss']
})
export class DrillDownComponent implements OnInit {

  private definition: DrillDownDefinition;
  private levelData: Observable<any[]>[];

  constructor() {
    const getFauxData = (pn: number) => (cn?: number) => {
      return of(new Array<number>(pn * cn));
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
      }
    ];
    this.levelData = [
      this.definition[0].getData()
    ]
  }


  ngOnInit() {
  }

}
