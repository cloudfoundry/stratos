import { Component, Input, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, distinctUntilChanged, map } from 'rxjs/operators';
import { ListPagination } from '../../../store/actions/list.actions';
import { ActionState } from '../../../store/reducers/api-request-reducer/types';
import { PageEvent } from '@angular/material';

export interface IDrillDownLevelPagination {
  state$: Observable<ListPagination>;
  page: (pageEvent: PageEvent) => void;
}
export interface IDrillDownLevelRequest {
  data$: Observable<any[]>;
  state$?: Observable<ActionState>;
  pagination?: IDrillDownLevelPagination;
}
export interface DrillDownLevel {
  title: string;
  request: ((parent?: any, allAncestors?: any[]) => IDrillDownLevelRequest) | IDrillDownLevelRequest;
  selectItem?: (parent?: any, allAncestors?: any[]) => void;
}

export type DrillDownDefinition = DrillDownLevel[];

// Internal level data derived from the drill down definition passed to the component
interface DrillDownLevelData {
  title: string;
  selected: {
    index: number,
    item: any
  };
  data$: Observable<any[]>;
  isBusy$: Observable<boolean>;
  hasErrored$: Observable<boolean>;
  pagination?: IDrillDownLevelPagination;
}

@Component({
  selector: 'app-drill-down',
  templateUrl: './drill-down.component.html',
  styleUrls: ['./drill-down.component.scss']
})
export class DrillDownComponent implements OnInit {
  @Input('definition')
  private definition: DrillDownDefinition;

  public levelData: DrillDownLevelData[] = [];

  public clickItem(item, itemIndex: number, levelIndex: number, $event: MouseEvent) {
    const nextIndex = levelIndex + 1;
    if (this.definition[nextIndex]) {
      this.addLevel(nextIndex, item);
      this.setSelectedForLevel(itemIndex, levelIndex, item);
    }
  }

  public setSelectedForLevel(index: number, levelIndex: number, item: any) {
    this.levelData[levelIndex].selected = { index, item };
  }

  private getLevelRequest(level: DrillDownLevel, item?: any, allSelected?: any[]) {
    const request = level.request;
    if (typeof request === 'function') {
      return request(item, allSelected);
    }
    return request;
  }

  public addLevel(levelIndex: number, item?: any) {
    const levelDefinition = this.definition[levelIndex];
    if (levelDefinition) {
      const { selectItem, title } = levelDefinition;
      const allSelected = this.levelData.map(level => level.selected.item);
      if (selectItem) {
        selectItem(item, allSelected);
      }

      const {
        pagination,
        data$,
        state$ = of({ busy: false, error: false, message: '' })
      } = this.getLevelRequest(levelDefinition, item, allSelected);
      const isBusy$ = state$.pipe(
        map(state => state.busy),
        delay(0),
        distinctUntilChanged(),
      );
      const hasErrored$ = state$.pipe(
        map(state => state.error)
      );
      if (this.levelData.length > (levelIndex + 1)) {
        // Remove old data
        this.levelData = this.levelData.slice(0, levelIndex);
      }
      this.levelData[levelIndex] = {
        title,
        data$,
        selected: { index: null, item: null },
        isBusy$,
        hasErrored$,
        pagination
      };
    }
  }

  ngOnInit() {
    this.addLevel(0);
  }
}
