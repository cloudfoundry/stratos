import { AfterViewInit, Component, Input, ViewChild } from '@angular/core';
import { NgModel } from '@angular/forms';
import { combineLatest, Observable, ReplaySubject } from 'rxjs';
import { map, scan, startWith } from 'rxjs/operators';

import { IFavoriteEntity } from '../../../core/user-favorite-manager';
import { favoritesConfigMapper, IFavoriteTypes } from '../favorites-meta-card/favorite-config-mapper';

@Component({
  selector: 'app-favorites-entity-list',
  templateUrl: './favorites-entity-list.component.html',
  styleUrls: ['./favorites-entity-list.component.scss']
})
export class FavoritesEntityListComponent implements AfterViewInit {

  @Input()
  set entities(favoriteEntities: IFavoriteEntity[]) {
    this.pEntities = favoriteEntities ? [...favoriteEntities] : favoriteEntities;
    this.entitiesSubject.next(favoriteEntities);
    this.hasEntities = this.pEntities && this.pEntities.length > 0;
  }
  @Input()
  public placeholder = false;

  @Input()
  public showFilters = false;

  @Input()
  public endpointDisconnected = false;

  @Input()
  set endpointTypes(types: string[] | string) {
    if (!this.favoriteTypes) {
      if (Array.isArray(types)) {
        this.favoriteTypes = types.reduce((allTypes, endpointType) => {
          return [
            ...allTypes,
            ...favoritesConfigMapper.getAllTypesForEndpoint(endpointType)
          ];
        }, []);
      } else {
        this.favoriteTypes = favoritesConfigMapper.getAllTypesForEndpoint(types) || [];
      }
    }
  }

  @ViewChild('nameChange') public nameChange: NgModel;

  public hasEntities = false;
  public typeSubject = new ReplaySubject<string>();
  private entitiesSubject = new ReplaySubject<IFavoriteEntity[]>();
  private limitToggleSubject = new ReplaySubject<number>();

  private entities$ = this.entitiesSubject.asObservable();
  public limitedEntities$: Observable<IFavoriteEntity[]>;
  public searchedEntities$: Observable<IFavoriteEntity[]>;

  public noResultsDueToFilter$: Observable<boolean>;

  public favoriteTypes: IFavoriteTypes[] = null;

  // User to filter favorites
  public filterName: string;
  public filterType: string;

  public pEntities: IFavoriteEntity[] = [];

  public limitedEntities: IFavoriteEntity[];
  public minLimit = 3;
  public limit = this.minLimit;

  public limitToggle$ = this.limitToggleSubject.asObservable().pipe(
    scan((acc) => this.minLimit === acc ? null : this.minLimit, this.minLimit),
    startWith(this.minLimit)
  );

  public toggleExpand() {
    this.limitToggleSubject.next(this.minLimit ? null : this.minLimit);
  }

  public typeChanged(type: string) {
    this.typeSubject.next(type);
  }

  private limitEntities(entities: IFavoriteEntity[], limit: number) {
    if (!entities || limit === null) {
      return entities;
    } else {
      return entities.splice(0, limit);
    }
  }

  public trackByFavoriteId(index: number, entity: IFavoriteEntity) {
    return entity.favorite.guid;
  }

  ngAfterViewInit() {
    const type$ = this.typeSubject.asObservable().pipe(startWith(null));
    const typesEntities$ = combineLatest(
      this.entities$,
      type$
    ).pipe(
      map(([entities, type]) => {
        if (!type) {
          return entities;
        }
        return entities.filter(entity => entity.favorite.entityType === type);
      })
    );

    this.searchedEntities$ = combineLatest(
      typesEntities$,
      this.nameChange.valueChanges.pipe(startWith('')),
    ).pipe(
      map(([entities, nameSearch]) => {
        if (!nameSearch) {
          return entities;
        }
        const searchableEntities = [...entities];
        return searchableEntities.filter(entity => entity.cardMapper(entity.favorite.metadata).name.search(nameSearch) !== -1);
      }),
      map(searchEntities => searchEntities || [])
    );
    this.limitedEntities$ = combineLatest(
      this.searchedEntities$,
      this.limitToggle$
    ).pipe(
      map(([entities, limit]) => this.limitEntities([...entities], limit)),
      map(limitedEntities => limitedEntities || [])
    );

    this.noResultsDueToFilter$ = combineLatest(
      this.nameChange.valueChanges,
      type$,
      this.limitedEntities$,
    ).pipe(
      map(([nameSearch, type, entities]) => entities.length === 0 && (nameSearch || type))
    );
  }
}
