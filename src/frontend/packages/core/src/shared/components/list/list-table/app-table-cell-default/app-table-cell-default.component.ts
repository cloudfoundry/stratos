import { Component, Input } from '@angular/core';
import { combineLatest, Observable, of as observableOf, ReplaySubject } from 'rxjs';
import { distinctUntilChanged, map, startWith, switchMap } from 'rxjs/operators';
import { objectHelper } from '../../../../../core/helper-classes/object.helpers';
import { pathGet } from '../../../../../core/utils.service';
import { TableCellCustom } from '../../list.types';
import { ICellDefinition } from '../table.types';


interface IValueContext {
  value: string;
  link: string;
  linkConfig: {
    linkTarget: string;
    isExternalLink: boolean;
    showShortLink: boolean;
  };
}
interface ILinkConfig {
  linkTarget: string;
  isExternalLink: boolean;
  showShortLink: boolean;
}
@Component({
  moduleId: module.id,
  selector: 'app-table-cell-default',
  templateUrl: 'app-table-cell-default.component.html',
  styleUrls: ['app-table-cell-default.component.scss']
})
export class TableCellDefaultComponent<T> extends TableCellCustom<T> {

  public cellDefinition: ICellDefinition<T>;
  @Input('row')
  set row(row: T) {
    this.rowSubject.next(row);
  }

  @Input('schemaKey')
  set schemaKey(schemaKey: string) {
    this.schemaKeySubject.next(schemaKey);
  }

  public valueContext = { value: null };
  public rowSubject = new ReplaySubject<T>();
  public schemaKeySubject = new ReplaySubject<string>();
  public asyncValueContext$: Observable<IValueContext>;

  public init() {
    const row$ = this.rowSubject.asObservable().pipe(distinctUntilChanged());
    const schemaKey$ = this.schemaKeySubject.asObservable().pipe(startWith(null), distinctUntilChanged());
    this.asyncValueContext$ = this.getValueContext(row$, schemaKey$, this.cellDefinition);
  }

  private getValueContext(
    row$: Observable<T>,
    schemaKey$: Observable<string>,
    cellDefinition: ICellDefinition<T>
  ): Observable<IValueContext> {
    const valueGenerator = this.getValueGenerator(cellDefinition);
    const asyncConfig = cellDefinition.asyncValue;
    return combineLatest(row$, schemaKey$).pipe(
      switchMap(([row, schemaKey]) => {
        const obs$ = asyncConfig ? row[asyncConfig.pathToObs] : null;
        const value$ = this.getValue(row, cellDefinition, schemaKey, valueGenerator, obs$);
        const link$ = this.getLink(row, cellDefinition, obs$);
        const linkConfig$ = this.getLinkConfig(cellDefinition, link$);
        return combineLatest(value$, link$, linkConfig$).pipe(
          map(([value, link, linkConfig]) => ({
            value,
            link,
            linkConfig
          }))
        );
      })
    );
  }

  private getValue(
    row: T,
    cellDefinition: ICellDefinition<T>,
    schemaKey: string,
    valueGenerator: (row: T, schemaKey?: string) => string,
    obs$: Observable<any>
  ) {
    if (obs$) {
      const asyncConfig = cellDefinition.asyncValue;
      return obs$.pipe(
        map(value => {
          return pathGet(asyncConfig.pathToValue, value);
        })
      );
    } else {
      return observableOf(valueGenerator(row, schemaKey));
    }
  }

  private getLink(row: T, cellDefinition: ICellDefinition<T>, obs$: Observable<any>): Observable<string> {
    if (cellDefinition.getAsyncLink) {
      return obs$.pipe(
        map(value => cellDefinition.getAsyncLink(value))
      );
    } else if (cellDefinition.getLink) {
      return observableOf(cellDefinition.getLink(row));
    }
    return observableOf(null);
  }

  private getLinkConfig(cellDefinition: ICellDefinition<T>, link$: Observable<string>): Observable<ILinkConfig> {
    return link$.pipe(
      distinctUntilChanged(),
      map(link => {
        if (!link) {
          return null;
        }
        return {
          linkTarget: cellDefinition.newTab ? '_blank' : '_self',
          isExternalLink: cellDefinition.externalLink,
          showShortLink: cellDefinition.showShortLink
        };
      })
    );
  }

  private getValueGenerator(cellDefinition: ICellDefinition<T>) {
    return this.getValueGetter(cellDefinition);
  }

  private getValueGetter(cellDefinition: ICellDefinition<T>) {
    if (cellDefinition.getValue) {
      return cellDefinition.getValue;
    } else if (cellDefinition.valuePath) {
      return (row: T) => objectHelper.getPathFromString(row, cellDefinition.valuePath);
    }
    return null;
  }
}
