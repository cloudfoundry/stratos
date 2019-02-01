import { AppState } from './../../../store/app-state';
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { IRecentlyVisitedEntity, IRecentlyVisitedEntityDated } from '../../../store/types/recently-visited.types';
import { recentlyVisitedSelector } from '../../../store/selectors/recently-visitied.selectors';
import { map } from 'rxjs/operators';
import * as moment from 'moment';
interface IRelevanceModifier {
  time: number;
  modifier: number;
}
interface IRelevanceModifiers {
  high: IRelevanceModifier;
  medium: IRelevanceModifier;
  low: IRelevanceModifier;
}
class CountedRecentEntitiesManager {
  private countedRecentEntities: CountedRecentEntities = {};
  private relevanceModifiers: IRelevanceModifiers;

  constructor(mostRecentTime: moment.Moment) {
    this.relevanceModifiers = {
      high: {
        time: mostRecentTime.subtract(1, 'hour').unix(),
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
  }

  private getModifier(recentEntity: IRecentlyVisitedEntityDated) {
    if (recentEntity.date < this.relevanceModifiers.low.time) {
      return this.relevanceModifiers.low.modifier;
    }
    if (recentEntity.date < this.relevanceModifiers.medium.time) {
      return this.relevanceModifiers.medium.modifier;
    }
    return this.relevanceModifiers.high.modifier;
  }

  public addEntity(recentEntity: IRecentlyVisitedEntityDated) {
    const modifier = this.getModifier(recentEntity);
    if (!this.countedRecentEntities[recentEntity.guid]) {
      this.countedRecentEntities[recentEntity.guid] = new CountedRecentEntity(recentEntity);
    }
    this.countedRecentEntities[recentEntity.guid].increment(modifier);
  }
  public getStoredEntities(): IRecentlyVisitedEntityDated[] {
    return Object.values(this.countedRecentEntities)
      .sort((countedA, countedB) => countedA.count - countedB.count)
      .map(counted => counted.entity);
  }
}
interface CountedRecentEntities {
  [entityId: string]: CountedRecentEntity;
}

class CountedRecentEntity {
  public count = 0;
  public increment(modifier?: number) {
    const amount = modifier ? 1 * modifier : 1;
    this.count += amount;
  }
  constructor(readonly entity: IRecentlyVisitedEntityDated) { }
}

@Component({
  selector: 'app-recent-entities',
  templateUrl: './recent-entities.component.html',
  styleUrls: ['./recent-entities.component.scss']
})
export class RecentEntitiesComponent implements OnInit {
  public recentEntities$: Observable<IRecentlyVisitedEntity[]>;
  constructor(store: Store<AppState>) {

    this.recentEntities$ = store.select(recentlyVisitedSelector).pipe(
      map(recentEntities => {
        const manager = new CountedRecentEntitiesManager(moment(recentEntities[0]));
        recentEntities.forEach(recentEntity => {
          manager.addEntity(recentEntity);
        });
        return manager.getStoredEntities();
      })
    );

  }

  ngOnInit() {
  }

}
