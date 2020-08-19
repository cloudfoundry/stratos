import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { entityCatalog } from '@stratosui/store';
import {
  MAX_RECENT_COUNT,
} from '@stratosui/store';
import * as moment from 'moment';
import { Observable, of as observableOf } from 'rxjs';
import { map } from 'rxjs/operators';

import { AppState } from '@stratosui/store';
import { endpointEntityType } from '@stratosui/store';
import { endpointEntitiesSelector } from '@stratosui/store';
import { recentlyVisitedSelector } from '@stratosui/store';
import { IRecentlyVisitedEntity } from '@stratosui/store';

class RenderableRecent {
  public mostRecentHit: moment.Moment;
  public subText$: Observable<string>;
  public icon: string;
  public iconFont: string;
  constructor(readonly entity: IRecentlyVisitedEntity, private store: Store<AppState>) {
    const catalogEntity = entityCatalog.getEntity(entity.endpointType, entity.entityType);
    this.icon = catalogEntity.definition.icon;;
    this.iconFont = catalogEntity.definition.iconFont;

    if (entity.entityType === endpointEntityType) {
      this.subText$ = observableOf(entity.prettyType);
    } else {
      this.subText$ = this.store.select(endpointEntitiesSelector).pipe(
        map(endpoints => {
          if (Object.keys(endpoints).length > 1) {
            return `${entity.prettyType} - ${endpoints[entity.endpointId].name}  (${entity.prettyEndpointType})`;
          }
          return entity.prettyType;
        })
      );
    }
  }
}

@Component({
  selector: 'app-recent-entities',
  templateUrl: './recent-entities.component.html',
  styleUrls: ['./recent-entities.component.scss']
})
export class RecentEntitiesComponent {
  @Input()
  public history = false;

  @Input() mode: string;

  public recentEntities$: Observable<RenderableRecent[]>;
  public hasHits$: Observable<boolean>;
  constructor(store: Store<AppState>) {
    const recentEntities$ = store.select(recentlyVisitedSelector);
    this.recentEntities$ = recentEntities$.pipe(
      map(entities => Object.values(entities)),
      map((entities: IRecentlyVisitedEntity[]) => {
        // Sort them - most recent first
        // Cap the list at the maximum we can display
        const sorted = entities.sort((a, b) => b.date - a.date).slice(0, MAX_RECENT_COUNT);
        return sorted.map(entity => new RenderableRecent(entity, store));
      })
    );

    this.hasHits$ = this.recentEntities$.pipe(
      map(recentEntities => recentEntities && recentEntities.length > 0)
    );

  }
}

