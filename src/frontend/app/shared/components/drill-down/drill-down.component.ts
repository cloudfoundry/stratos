import { Component, ComponentFactoryResolver, ElementRef, Input, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { PageEvent } from '@angular/material';
import { Observable, of } from 'rxjs';
import { delay, distinctUntilChanged, map } from 'rxjs/operators';
import { ListPagination } from '../../../store/actions/list.actions';
import { ActionState } from '../../../store/reducers/api-request-reducer/types';

export interface IDrillDownLevelPagination {
  state$: Observable<ListPagination>;
  page: (pageEvent: PageEvent) => void;
}
export interface IDrillDownLevelRequest {
  data$: Observable<any[]>;
  state$?: Observable<ActionState>;
  pagination?: IDrillDownLevelPagination;
}
export interface DrillDownLevel<E = any, P = any> {
  title: string;
  component?;
  request: ((parent?: P, allAncestors?: any) => IDrillDownLevelRequest) | IDrillDownLevelRequest;
  selectItem?: (parent?: P, allAncestors?: any) => void;
  getItemName: (entity: E) => string;
}

export type DrillDownDefinition = DrillDownLevel[];

// Internal level data derived from the drill down definition passed to the component
interface DrillDownLevelData {
  title: string;
  selected: {
    index: number,
    item: any
    element: Element
  };
  data$: Observable<any[]>;
  isBusy$: Observable<boolean>;
  hasErrored$: Observable<boolean>;
  pagination?: IDrillDownLevelPagination;
  component: any;
  getItemName: (entity) => string;
}

@Component({
  selector: 'app-drill-down',
  templateUrl: './drill-down.component.html',
  styleUrls: ['./drill-down.component.scss']
})
export class DrillDownComponent<E = any, P = any> implements OnInit {

  constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

  @Input()
  private definition: DrillDownDefinition;

  @ViewChild('drillDown') drillDown: ElementRef;
  @ViewChildren('drillDownLevel') drillDownLevel: QueryList<ElementRef>;

  public levelData: DrillDownLevelData[] = [];

  public goToLevel(levelIndex: number) {
    this.reduceLevels(levelIndex + 1);
    this.resetLevelSelection(levelIndex);
    this.positionDrillDown(levelIndex);
  }

  public clickItem(item, itemIndex: number, levelIndex: number, $event: MouseEvent) {
    if (this.levelData[levelIndex].selected.index === itemIndex) {
      this.goToLevel(levelIndex);
    } else {
      const nextIndex = levelIndex + 1;
      if (this.definition[nextIndex]) {
        this.reduceLevels(levelIndex + 1);
        const element = $event.srcElement;
        this.addLevel(nextIndex, item);
        this.setSelectedForLevel(itemIndex, levelIndex, item, element);
        this.positionDrillDown(levelIndex + 1);
      }
    }
  }

  public setSelectedForLevel(index: number, levelIndex: number, item: any, element: Element) {
    this.levelData[levelIndex].selected = { index, item, element };
  }

  public resetLevelSelection(levelIndex: number) {
    this.levelData[levelIndex].selected = { index: null, item: null, element: null };
  }

  public positionDrillDown(levelIndex: number) {
    setTimeout(() => {
      console.log(levelIndex);
      if (levelIndex <= 0) {
        this.drillDown.nativeElement.style.marginTop = `-${0}px`;
      } else {
        const levels = this.drillDownLevel.toArray().slice(0, levelIndex);
        if (levels.length) {
          const marginTop = levels.reduce((total: number, level: ElementRef) => {
            return level.nativeElement.offsetHeight + total;
          }, 0);
          this.drillDown.nativeElement.style.marginTop = `-${marginTop}px`;
        }
      }
    }, 0);
  }

  private reduceLevels(levelIndex: number) {
    this.levelData = this.levelData.slice(0, levelIndex);
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

      this.levelData[levelIndex] = {
        title,
        data$,
        selected: { index: null, item: null, element: null },
        isBusy$,
        hasErrored$,
        pagination,
        component: levelDefinition.component || null,
        getItemName: levelDefinition.getItemName
      };
    }
  }

  ngOnInit() {
    this.addLevel(0);
  }
}
