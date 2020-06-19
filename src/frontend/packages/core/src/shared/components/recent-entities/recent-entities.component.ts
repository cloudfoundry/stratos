import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import * as moment from 'moment';
import { Observable, of as observableOf } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { AppState } from '../../../../../store/src/app-state';
import { endpointEntityType } from '../../../../../store/src/helpers/stratos-entity-factory';
import { endpointEntitiesSelector } from '../../../../../store/src/selectors/endpoint.selectors';
import { recentlyVisitedSelector } from '../../../../../store/src/selectors/recently-visitied.selectors';
import {
  IEntityHit,
  IRecentlyVisitedEntity,
  IRecentlyVisitedState,
} from '../../../../../store/src/types/recently-visited.types';


interface IRelevanceModifier {
  time: number;
  modifier: number;
}
interface IRelevanceModifiers {
  high: IRelevanceModifier;
  medium: IRelevanceModifier;
  low: IRelevanceModifier;
}

class RenderableRecent {
  public mostRecentHit: moment.Moment;
  public subText$: Observable<string>;
  constructor(readonly entity: IRecentlyVisitedEntity, private store: Store<AppState>) {
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

class CountedRecentEntity {
  public count = 0;
  public mostRecentHitUnix: number;
  public guid: string;
  private checkAndSetDate(date: number) {
    if (!this.mostRecentHitUnix || date > this.mostRecentHitUnix) {
      this.mostRecentHitUnix = date;
    }
  }
  public applyHit(hit: IEntityHit, modifier?: number) {
    const amount = modifier ? 1 * modifier : 1;
    this.count += amount;
    this.checkAndSetDate(hit.date);
  }
  constructor(hit: IEntityHit) {
    this.guid = hit.guid;
    this.checkAndSetDate(hit.date);
  }
}

class CountedRecentEntitiesManager {
  private countedRecentEntities: CountedRecentEntities = {};
  private relevanceModifiers: IRelevanceModifiers;
  private renderableRecents: {
    [guid: string]: RenderableRecent
  };

  constructor(recentState: IRecentlyVisitedState, private store: Store<AppState>) {
    const { entities, hits } = recentState;
    const mostRecentTime = hits[0] ? moment(hits[0].date) : moment();

    this.relevanceModifiers = {
      high: {
        time: mostRecentTime.subtract(30, 'minute').unix(),
        modifier: 2
      },
      medium: {
        time: mostRecentTime.subtract(1, 'day').unix(),
        modifier: 1.5
      },
      low: {
        time: mostRecentTime.subtract(1, 'week').unix(),
        modifier: 1
      }
    };

    this.renderableRecents = Object.keys(entities).reduce((renderableRecents, recentGuid) => {
      renderableRecents[recentGuid] = new RenderableRecent(entities[recentGuid], store);
      return renderableRecents;
    }, {});

    this.addHits(hits);
  }

  private addHits(hits: IEntityHit[]) {
    hits.forEach(hit => {
      this.addHit(hit);
    });
    Object.keys(this.renderableRecents).forEach(
      guid => {
        if (this.countedRecentEntities[guid]) {
          this.renderableRecents[guid].mostRecentHit = moment(this.countedRecentEntities[guid].mostRecentHitUnix);
        }
      }
    );
  }

  private getModifier(recentEntity: IEntityHit) {
    if (recentEntity.date < this.relevanceModifiers.low.time) {
      return this.relevanceModifiers.low.modifier;
    }
    if (recentEntity.date < this.relevanceModifiers.medium.time) {
      return this.relevanceModifiers.medium.modifier;
    }
    return this.relevanceModifiers.high.modifier;
  }

  public addHit(recentEntity: IEntityHit) {
    const modifier = this.getModifier(recentEntity);
    if (!this.countedRecentEntities[recentEntity.guid]) {
      this.countedRecentEntities[recentEntity.guid] = new CountedRecentEntity(recentEntity);
    }
    this.countedRecentEntities[recentEntity.guid].applyHit(recentEntity, modifier);
  }

  private sort(sortKey: 'count' | 'mostRecentHitUnix' = 'count') {
    const sortedHits = Object.values(this.countedRecentEntities)
      .sort((countedA, countedB) => countedB[sortKey] - countedA[sortKey])
      .map(counted => counted);
    return sortedHits.map(entity => this.renderableRecents[entity.guid]);
  }

  public getFrecentEntities(): RenderableRecent[] {
    return this.sort();
  }

  public getRecentEntities(): RenderableRecent[] {
    return this.sort('mostRecentHitUnix');
  }
}
interface CountedRecentEntities {
  [entityId: string]: CountedRecentEntity;
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
  public frecentEntities$: Observable<RenderableRecent[]>;
  public hasHits$: Observable<boolean>;
  constructor(store: Store<AppState>) {
    const recentEntities$ = store.select(recentlyVisitedSelector);
    this.hasHits$ = recentEntities$.pipe(
      map(recentEntities => recentEntities && !!recentEntities.hits && recentEntities.hits.length > 0)
    );
    const entitiesManager$ = recentEntities$.pipe(
      filter(recentEntities => recentEntities && !!recentEntities.hits && recentEntities.hits.length > 0),
      map(recentEntities => new CountedRecentEntitiesManager(recentEntities, store)),
    );
    this.frecentEntities$ = entitiesManager$.pipe(
      map(manager => manager.getFrecentEntities()),
    );
    this.recentEntities$ = entitiesManager$.pipe(
      map(manager => manager.getRecentEntities())
    );
  }
}
