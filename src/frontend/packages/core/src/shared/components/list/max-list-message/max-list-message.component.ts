import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { AppState } from '../../../../../../store/src/app-state';
import { entityCatalog } from '../../../../../../store/src/entity-catalog/entity-catalog';
import { EntityCatalogEntityConfig } from '../../../../../../store/src/entity-catalog/entity-catalog.types';
import {
  PaginationPageIteratorConfig,
} from '../../../../../../store/src/entity-request-pipeline/pagination-request-base-handlers/pagination-iterator.pipe';
import { safeUnsubscribe } from '../../../../core/utils.service';
import { NoContentMessageLine } from '../../no-content-message/no-content-message.component';
import { ITableTextMaxed } from '../list-table/table.types';


@Component({
  selector: 'app-max-list-message',
  templateUrl: './max-list-message.component.html',
  styleUrls: ['./max-list-message.component.scss']
})
export class MaxListMessageComponent implements OnDestroy {

  @Input()
  set config(config: ITableTextMaxed) {
    const safeConfig: ITableTextMaxed = config || {
      icon: '',
      canIgnoreMaxFirstLine: '',
      cannotIgnoreMaxFirstLine: '',
    };
    this.configSubject.next({
      icon: safeConfig.icon || MaxListMessageComponent.defaultConfig.icon,
      iconFont: safeConfig.iconFont || MaxListMessageComponent.defaultConfig.iconFont,
      canIgnoreMaxFirstLine: safeConfig.canIgnoreMaxFirstLine || MaxListMessageComponent.defaultConfig.canIgnoreMaxFirstLine,
      cannotIgnoreMaxFirstLine: safeConfig.cannotIgnoreMaxFirstLine || MaxListMessageComponent.defaultConfig.cannotIgnoreMaxFirstLine,
      filterLine: safeConfig.filterLine || MaxListMessageComponent.defaultConfig.filterLine
    });
  }

  @Input()
  set catalogueEntity(entityConfig: EntityCatalogEntityConfig) {
    if (this.canIgnoreMaxedStatePipeSub) {
      this.canIgnoreMaxedStatePipeSub.unsubscribe();
    }

    if (!entityConfig) {
      return;
    }

    const catalogueEntity = entityCatalog.getEntity(entityConfig);
    const paginationConfig: PaginationPageIteratorConfig = catalogueEntity.getPaginationConfig();
    if (paginationConfig) {
      this.canIgnoreMaxedStatePipeSub = paginationConfig.canIgnoreMaxedState(this.store).subscribe(
        canIgnoreMaxedState => this.canIgnoreMaxedState.next(canIgnoreMaxedState)
      );
    } else {
      this.canIgnoreMaxedState.next(false);
    }
  }

  constructor(private store: Store<AppState>) { }

  static defaultConfig: ITableTextMaxed = {
    icon: 'apps',
    canIgnoreMaxFirstLine: 'Fetching all entities might take a long time',
    cannotIgnoreMaxFirstLine: 'There are too many entities to fetch',
  };

  private canIgnoreMaxedStatePipeSub: Subscription;
  private canIgnoreMaxedState = new BehaviorSubject<boolean>(null);
  private canIgnoreMaxedState$ = this.canIgnoreMaxedState.asObservable();

  private configSubject = new BehaviorSubject<ITableTextMaxed>(null);
  private config$ = this.configSubject.asObservable();

  public state$: Observable<{
    icon: string;
    iconFont: string;
    firstLine: string;
    otherLines: NoContentMessageLine[];
    canIgnoreMaxedState: boolean;
  }> = combineLatest([
    this.canIgnoreMaxedState$,
    this.config$
  ]).pipe(
    filter(([canIgnoreMaxedState, config]) => canIgnoreMaxedState != null && config != null),
    map(([canIgnoreMaxedState, config]) => {
      const otherLines = [];
      if (config.filterLine) {
        otherLines.push(
          { text: config.filterLine },
        );

        if (canIgnoreMaxedState) {
          otherLines.push(
            { text: 'or' },
          );
        }
      }

      return {
        icon: config.icon,
        iconFont: config.iconFont,
        firstLine: canIgnoreMaxedState ? config.canIgnoreMaxFirstLine : config.cannotIgnoreMaxFirstLine,
        otherLines,
        canIgnoreMaxedState
      };
    }),
  );

  @Input() count = 0;
  @Input() maxCount = 0;

  @Output() showAllAfterMax = new EventEmitter();

  showAll() {
    this.showAllAfterMax.emit();
  }

  ngOnDestroy() {
    safeUnsubscribe(this.canIgnoreMaxedStatePipeSub);
  }
}
