import { Component, Input, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ActionState } from '../../../store/reducers/api-request-reducer/types';

export interface DrillDownLevel {
  title: string;
  getData: (parent?) => Observable<any[]>;
  levelState$?: Observable<ActionState>;
}

export type DrillDownDefinition = DrillDownLevel[];

@Component({
  selector: 'app-drill-down',
  templateUrl: './drill-down.component.html',
  styleUrls: ['./drill-down.component.scss']
})
export class DrillDownComponent implements OnInit {
  @Input('definition')
  private definition: DrillDownDefinition;

  public levelData: {
    selected: number,
    data$: Observable<any[]>;
    levelState$?: Observable<ActionState>;
  }[] = [];

  public clickItem(item, itemIndex: number, levelIndex: number, $event: MouseEvent) {
    const nextIndex = levelIndex + 1;
    if (this.definition[nextIndex]) {
      this.addLevel(nextIndex, item);
      this.setSelectedForLevel(itemIndex, levelIndex);
    }
  }

  public setSelectedForLevel(itemIndex: number, levelIndex: number) {
    this.levelData[levelIndex].selected = itemIndex;
  }

  public addLevel(levelIndex: number, item?) {
    const levelData = this.definition[levelIndex];
    if (levelData) {
      const data$ = levelData.getData(item);
      const levelState$ = levelData.levelState$ || of({
        busy: false,
        error: false,
        message: ''
      });
      if (this.levelData.length > (levelIndex + 1)) {
        // Remove old data
        this.levelData = this.levelData.slice(0, levelIndex);
      }
      this.levelData[levelIndex] = { data$, selected: null, levelState$ };
    }
  }



  ngOnInit() {
    this.addLevel(0);
  }

}
