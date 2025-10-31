import { Component, EventEmitter, Input, OnDestroy, Output, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { entityCatalog, EntityCatalogEntityConfig, PaginationPageIteratorConfig, AppState } from '@stratosui/store';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { safeUnsubscribe } from '../../../../core/utils.service';
import { NoContentMessageComponent, NoContentMessageLine } from '../../no-content-message/no-content-message.component';
import { ITableTextMaxed } from '../list-table/table.types';

@Component({
  selector: 'app-max-list-message',
  templateUrl: './max-list-message.component.html',
  styleUrls: ['./max-list-message.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    NoContentMessageComponent
  ]
})
export class MaxListMessageComponent implements OnDestroy {

  @Input()
  set config(config: ITableTextMaxed) {
    const safeConfig: ITableTextMaxed = config || {
      icon: '',
      canIgnoreMaxFirstLine: '',
      cannotIgnoreMaxFirstLine: '',
    };
    const newConfig = {
      icon: safeConfig.icon || MaxListMessageComponent.defaultConfig.icon,
      iconFont: safeConfig.iconFont || MaxListMessageComponent.defaultConfig.iconFont,
      canIgnoreMaxFirstLine: safeConfig.canIgnoreMaxFirstLine || MaxListMessageComponent.defaultConfig.canIgnoreMaxFirstLine,
      cannotIgnoreMaxFirstLine: safeConfig.cannotIgnoreMaxFirstLine || MaxListMessageComponent.defaultConfig.cannotIgnoreMaxFirstLine,
      filterLine: safeConfig.filterLine || MaxListMessageComponent.defaultConfig.filterLine
    };
    this.configSignal.set(newConfig);
    this.configSubject.next(newConfig);
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
        canIgnoreMaxedState => {
          this.canIgnoreMaxedStateSignal.set(canIgnoreMaxedState);
          this.canIgnoreMaxedStateSubject.next(canIgnoreMaxedState);
        }
      );
    } else {
      this.canIgnoreMaxedStateSignal.set(false);
      this.canIgnoreMaxedStateSubject.next(false);
    }
  }

  static defaultConfig: ITableTextMaxed = {
    icon: 'apps',
    canIgnoreMaxFirstLine: 'Fetching all entities might take a long time',
    cannotIgnoreMaxFirstLine: 'There are too many entities to fetch',
  };

  private canIgnoreMaxedStatePipeSub: Subscription;
  private canIgnoreMaxedStateSignal = signal<boolean | null>(null);
  private canIgnoreMaxedStateSubject = new BehaviorSubject<boolean | null>(null);
  private canIgnoreMaxedState$ = this.canIgnoreMaxedStateSubject.asObservable();

  private configSignal = signal<ITableTextMaxed | null>(null);
  private configSubject = new BehaviorSubject<ITableTextMaxed | null>(null);
  private config$ = this.configSubject.asObservable();

  private store = inject(Store<AppState>);

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
