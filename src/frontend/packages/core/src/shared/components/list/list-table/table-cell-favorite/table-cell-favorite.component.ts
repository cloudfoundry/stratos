
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { IFavoriteMetadata, UserFavorite } from '@stratosui/store';

import { EntityFavoriteStarComponent } from '../../../../../core/entity-favorite-star/entity-favorite-star.component';
import { TableCellCustom } from '../../list.types';
import { ITableColumn } from '../table.types';

/**
 * Configuration required by the {@link TableCellFavoriteComponent}.
 *
 * This interface defines the contract for configuring the favorite cell component.
 * It must be passed as the `cellConfig` value in an {@link ITableColumn} definition.
 *
 * @typeParam T - The row data type (the entity being favorited)
 * @typeParam Y - The favorite metadata type, must extend {@link IFavoriteMetadata}
 *
 * @example
 * // Creating a table column with favorite cell
 * const myColumn: ITableColumn<MyEntity> = {
 *   columnId: 'favorite',
 *   cellComponent: TableCellFavoriteComponent,
 *   cellConfig: {
 *     createUserFavorite: (entity: MyEntity) => {
 *       return new UserFavorite<MyMetadata>({
 *         key: entity.guid,
 *         metadata: { name: entity.name }
 *       });
 *     }
 *   }
 * };
 *
 * @remarks
 * IMPORTANT PATTERN TO FOLLOW:
 *
 * 1. **Use the helper function** {@link createTableColumnFavorite}
 *    - The helper automatically creates properly typed configuration
 *    - Reduces boilerplate and type errors
 *    - Example: `createTableColumnFavorite((entity) => new UserFavorite(...))`
 *
 * 2. **Type safety is critical**
 *    - Generic type T must match your row/entity type
 *    - Generic type Y must match your favorite metadata structure
 *    - The `createUserFavorite` function signature must be exact
 *
 * 3. **What createUserFavorite receives and returns**
 *    - **Receives**: The row entity of type T
 *    - **Returns**: A UserFavorite<Y> instance properly initialized with metadata
 *    - This is called once per row during render
 *
 * 4. **Metadata requirements**
 *    - Metadata must extend {@link IFavoriteMetadata}
 *    - Metadata is used for favorite identification and display
 *    - Keep metadata consistent across all rows for reliable favorite matching
 *
 * @see {@link createTableColumnFavorite} - Recommended helper function
 * @see {@link TableCellFavoriteComponent} - The component being configured
 */
export interface TableCellFavoriteComponentConfig<T, Y extends IFavoriteMetadata> {
  /**
   * Factory function to create a UserFavorite for a given row entity.
   *
   * This function is called for each row in the table to create the appropriate
   * UserFavorite instance with the correct metadata.
   *
   * @param entity - The row data/entity to create a favorite for
   * @returns A {@link UserFavorite} instance with metadata of type Y
   *
   * @example
   * createUserFavorite: (app: CloudFoundryApplication) => new UserFavorite({
   *   key: app.guid,
   *   metadata: {
   *     name: app.name,
   *     spaceGuid: app.space_guid
   *   }
   * })
   */
  createUserFavorite: (entity: T) => UserFavorite<Y>;
}

@Component({
selector: 'app-table-cell-favorite',
  templateUrl: './table-cell-favorite.component.html',
  styleUrls: ['./table-cell-favorite.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    EntityFavoriteStarComponent
]
})
export class TableCellFavoriteComponent<T, Y extends IFavoriteMetadata> extends
  TableCellCustom<T, TableCellFavoriteComponentConfig<T, Y>> {

  constructor(private cdr: ChangeDetectorRef) {
    super();
  }

  public favorite: UserFavorite<Y>;
  public canFavorite = false;

  @Input('config')
  set config(config: TableCellFavoriteComponentConfig<T, Y>) {
    super.config = config;
    this.createUserFavorite();
  }

  @Input('row')
  set row(row: T) {
    super.row = row;
    this.createUserFavorite();
  }

  private createUserFavorite() {
    if (this.pRow && this.pConfig) {
      // Runtime validation to catch config errors early
      if (!this.pConfig.createUserFavorite || typeof this.pConfig.createUserFavorite !== 'function') {
        console.error(
          '[TableCellFavoriteComponent] Invalid config: createUserFavorite must be a function.',
          'Received config:', this.pConfig,
          'Expected: TableCellFavoriteComponentConfig with createUserFavorite function'
        );
        return;
      }

      this.favorite = this.pConfig.createUserFavorite(this.pRow);
      this.canFavorite = this.favorite.canFavorite();
      this.cdr.markForCheck();
    }
  }
}

export function createTableColumnFavorite<T, Y extends IFavoriteMetadata>(
  createUserFavorite: (entity: T) => UserFavorite<Y>
): ITableColumn<T> {
  const cellConfig: TableCellFavoriteComponentConfig<T, Y> = {
    createUserFavorite
  };
  return {
    columnId: 'favorite',
    headerCell: () => '',
    cellComponent: TableCellFavoriteComponent,
    cellFlex: '0 0 100px',
    cellConfig
  };
}
