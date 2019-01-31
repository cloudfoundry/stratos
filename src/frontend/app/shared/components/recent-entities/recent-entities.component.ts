import { AppState } from './../../../store/app-state';
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { IRecentlyVisitedEntity } from '../../../store/types/recently-visited.types';
import { recentlyVisitedSelector } from '../../../store/selectors/recently-visitied.selectors';
import { map } from 'rxjs/operators';

class CountedRecentEntitiesManager {
  private countedRecentEntities: CountedRecentEntities = {};
  public addEntity(recentEntity: IRecentlyVisitedEntity) {
    if (!this.countedRecentEntities[recentEntity.guid]) {
      this.countedRecentEntities[recentEntity.guid] = new CountedRecentEntity(recentEntity);
    } else {
      this.countedRecentEntities[recentEntity.guid].increment();
    }
  }
  public getStoredEntities(): IRecentlyVisitedEntity[] {
    return Object.values(this.countedRecentEntities)
      .sort((countedA, countedB) => countedA.count - countedB.count)
      .map(counted => counted.entity);
  }
}
interface CountedRecentEntities {
  [entityId: string]: CountedRecentEntity;
}

class CountedRecentEntity {
  public count = 1;
  public increment() {
    this.count += 1;
  }
  constructor(readonly entity: IRecentlyVisitedEntity) { }
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
        const manager = new CountedRecentEntitiesManager();
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
