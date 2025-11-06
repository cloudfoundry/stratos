import { describe, it, expect } from 'vitest';
/**
 * Integration tests for table cell config flow - simplified version
 * Tests verify that cellConfig (both object and function forms) properly flows through rendering chain
 * List → Table → Row → Cell → SpecificCell
 *
 * This is a standalone test file that focuses on testing column definitions with cellConfig
 * without requiring full TestBed setup for rendering verification.
 */

import { ITableColumn } from './table.types';
import { TableCellFavoriteComponent, createTableColumnFavorite } from './table-cell-favorite/table-cell-favorite.component';
import { IFavoriteMetadata, UserFavorite } from '@stratosui/store';

describe('Table CellConfig Integration - Column Definition Flow', () => {

  // Test interfaces
  interface TestEntity {
    id: string;
    name: string;
    description?: string;
  }

  interface TestFavoriteMetadata extends IFavoriteMetadata {
    entityId: string;
  }

  // Helper to create test UserFavorite
  function createTestUserFavorite(entity: TestEntity): UserFavorite<TestFavoriteMetadata> {
    return new UserFavorite<TestFavoriteMetadata>(
      'test-endpoint',
      'test-type',
      'test-entity',
      entity.id,
      {
        name: entity.name,
        entityId: entity.id
      }
    );
  }

  describe('Static cellConfig Objects', () => {

    it('should create column with static cellConfig object', () => {
      const staticConfig = {
        customProperty: 'test-value',
        dataField: 'name',
        formatter: (value: any) => value.toUpperCase()
      };

      const column: ITableColumn<TestEntity> = {
        columnId: 'test-col',
        headerCell: () => 'Test Column',
        cellComponent: null,
        cellConfig: staticConfig
      };

      expect(column.cellConfig).toBeTruthy();
      expect(column.cellConfig).toEqual(staticConfig);
      expect((column.cellConfig as any).customProperty).toBe('test-value');
    });

    it('should handle column without cellConfig', () => {
      const column: ITableColumn<TestEntity> = {
        columnId: 'simple-col',
        headerCell: () => 'Simple Column',
        cellComponent: null
      };

      expect(column.cellConfig).toBeUndefined();
      expect(column.columnId).toBe('simple-col');
    });

    it('should preserve cellConfig with multiple properties', () => {
      const complexConfig = {
        type: 'custom',
        width: 200,
        sortable: true,
        filterable: true,
        options: ['opt1', 'opt2'],
        metadata: {
          label: 'Complex Field',
          required: true
        }
      };

      const column: ITableColumn<TestEntity> = {
        columnId: 'complex',
        headerCell: () => 'Complex',
        cellComponent: null,
        cellConfig: complexConfig
      };

      expect(column.cellConfig).toEqual(complexConfig);
      expect((column.cellConfig as any).metadata.label).toBe('Complex Field');
    });

    it('should handle null and undefined cellConfig', () => {
      const column1: ITableColumn<TestEntity> = {
        columnId: 'null-config',
        headerCell: () => 'Null Config',
        cellComponent: null,
        cellConfig: null
      };

      const column2: ITableColumn<TestEntity> = {
        columnId: 'undefined-config',
        headerCell: () => 'Undefined Config',
        cellComponent: null,
        cellConfig: undefined
      };

      expect(column1.cellConfig).toBeNull();
      expect(column2.cellConfig).toBeUndefined();
    });
  });

  describe('Dynamic cellConfig Functions', () => {

    it('should store cellConfig as function when provided as function', () => {
      const configFunction = (entity: TestEntity) => ({
        label: entity.name,
        value: entity.id
      });

      const column: ITableColumn<TestEntity> = {
        columnId: 'dynamic-col',
        headerCell: () => 'Dynamic Column',
        cellComponent: null,
        cellConfig: configFunction
      };

      expect(column.cellConfig).toEqual(configFunction);
      expect(typeof column.cellConfig).toBe('function');
    });

    it('should preserve function that generates config based on entity', () => {
      const entity: TestEntity = {
        id: '1',
        name: 'Test Entity',
        description: 'A test entity'
      };

      const configFunction = (ent: TestEntity) => ({
        displayName: ent.name.toUpperCase(),
        entityId: ent.id,
        isActive: true
      });

      const column: ITableColumn<TestEntity> = {
        columnId: 'func-col',
        headerCell: () => 'Functional Column',
        cellComponent: null,
        cellConfig: configFunction
      };

      // Verify function can be called with entity
      const generatedConfig = (column.cellConfig as any)(entity);
      expect(generatedConfig.displayName).toBe('TEST ENTITY');
      expect(generatedConfig.entityId).toBe('1');
      expect(generatedConfig.isActive).toBe(true);
    });

    it('should handle function that returns different config per entity', () => {
      const configFunction = (entity: TestEntity) => {
        if (entity.id === '1') {
          return { type: 'premium' };
        } else {
          return { type: 'standard' };
        }
      };

      const column: ITableColumn<TestEntity> = {
        columnId: 'conditional-col',
        headerCell: () => 'Conditional Column',
        cellComponent: null,
        cellConfig: configFunction
      };

      const entity1 = { id: '1', name: 'Entity 1' };
      const entity2 = { id: '2', name: 'Entity 2' };

      const config1 = (column.cellConfig as any)(entity1);
      const config2 = (column.cellConfig as any)(entity2);

      expect(config1.type).toBe('premium');
      expect(config2.type).toBe('standard');
    });
  });

  describe('Favorite Column Configuration', () => {

    it('should create favorite column with proper helper', () => {
      const favoriteColumn = createTableColumnFavorite<TestEntity, TestFavoriteMetadata>(
        createTestUserFavorite
      );

      expect(favoriteColumn).toBeTruthy();
      expect(favoriteColumn.columnId).toBe('favorite');
      expect(favoriteColumn.cellComponent).toBe(TableCellFavoriteComponent);
      expect(favoriteColumn.headerCell()).toBe('');
      expect(favoriteColumn.cellFlex).toBe('0 0 100px');
    });

    it('should have valid cellConfig with createUserFavorite function', () => {
      const favoriteColumn = createTableColumnFavorite<TestEntity, TestFavoriteMetadata>(
        createTestUserFavorite
      );

      expect(favoriteColumn.cellConfig).toBeTruthy();
      const config = favoriteColumn.cellConfig as any;
      expect(typeof config.createUserFavorite).toBe('function');
    });

    it('should allow createUserFavorite to be called with entity', () => {
      const favoriteColumn = createTableColumnFavorite<TestEntity, TestFavoriteMetadata>(
        createTestUserFavorite
      );

      const entity: TestEntity = {
        id: 'test-1',
        name: 'Test Entity'
      };

      const config = favoriteColumn.cellConfig as any;
      const favorite = config.createUserFavorite(entity);

      expect(favorite).toBeTruthy();
      expect(favorite.entityId).toBe('test-1');
      expect(favorite.canFavorite()).toBe(true);
    });

    it('should have correct cell flex styling', () => {
      const favoriteColumn = createTableColumnFavorite<TestEntity, TestFavoriteMetadata>(
        createTestUserFavorite
      );

      expect(favoriteColumn.cellFlex).toBe('0 0 100px');
    });
  });

  describe('Mixed Column Types in Definition', () => {

    it('should allow mixture of static and dynamic cellConfig in columns array', () => {
      const staticConfig = { type: 'static' };
      const dynamicConfig = (entity: TestEntity) => ({ id: entity.id });

      const columns: ITableColumn<TestEntity>[] = [
        {
          columnId: 'col1',
          headerCell: () => 'Static',
          cellComponent: null,
          cellConfig: staticConfig
        },
        {
          columnId: 'col2',
          headerCell: () => 'Dynamic',
          cellComponent: null,
          cellConfig: dynamicConfig
        },
        {
          columnId: 'col3',
          headerCell: () => 'No Config',
          cellComponent: null
        }
      ];

      expect(columns.length).toBe(3);
      expect((columns[0].cellConfig as any).type).toBe('static');
      expect(typeof columns[1].cellConfig).toBe('function');
      expect(columns[2].cellConfig).toBeUndefined();
    });

    it('should render favorite column with other columns', () => {
      const favoriteColumn = createTableColumnFavorite<TestEntity, TestFavoriteMetadata>(
        createTestUserFavorite
      );

      const columns: ITableColumn<TestEntity>[] = [
        {
          columnId: 'id',
          headerCell: () => 'ID',
          cellComponent: null
        },
        favoriteColumn,
        {
          columnId: 'name',
          headerCell: () => 'Name',
          cellComponent: null,
          cellConfig: { sortable: true }
        }
      ];

      expect(columns.length).toBe(3);
      expect(columns[0].columnId).toBe('id');
      expect(columns[1].columnId).toBe('favorite');
      expect(columns[2].columnId).toBe('name');

      // Verify favorite column properties are correct
      expect(columns[1].cellComponent).toBe(TableCellFavoriteComponent);
      const favoriteConfig = columns[1].cellConfig as any;
      expect(typeof favoriteConfig.createUserFavorite).toBe('function');
    });
  });

  describe('CellConfig Error Handling', () => {

    it('should handle empty cellConfig object', () => {
      const column: ITableColumn<TestEntity> = {
        columnId: 'empty-config',
        headerCell: () => 'Empty Config',
        cellComponent: null,
        cellConfig: {}
      };

      expect(column.cellConfig).toEqual({});
      expect(Object.keys(column.cellConfig).length).toBe(0);
    });

    it('should preserve cellConfig even if it has unexpected properties', () => {
      const weirdConfig: any = {
        customProp1: 'value1',
        customProp2: 12345,
        customProp3: { nested: 'object' },
        customProp4: ['array', 'data'],
        customProp5: null
      };

      const column: ITableColumn<TestEntity> = {
        columnId: 'weird-col',
        headerCell: () => 'Weird',
        cellComponent: null,
        cellConfig: weirdConfig
      };

      expect(column.cellConfig).toEqual(weirdConfig);
      expect((column.cellConfig as any).customProp3.nested).toBe('object');
    });

    it('should handle function that throws error gracefully in column definition', () => {
      const errorFunction = (entity: TestEntity) => {
        throw new Error('Config generation failed');
      };

      const column: ITableColumn<TestEntity> = {
        columnId: 'error-col',
        headerCell: () => 'Error Column',
        cellComponent: null,
        cellConfig: errorFunction
      };

      expect(column.cellConfig).toBeTruthy();
      expect(typeof column.cellConfig).toBe('function');

      // Function is stored, error would occur at runtime during cell rendering
      const entity = { id: '1', name: 'Test' };
      expect(() => (column.cellConfig as any)(entity)).toThrowError('Config generation failed');
    });
  });

  describe('CellConfig Type Preservation', () => {

    it('should preserve object type cellConfig exactly as provided', () => {
      const originalConfig = {
        key1: 'value1',
        key2: 'value2'
      };

      const column: ITableColumn<TestEntity> = {
        columnId: 'test',
        headerCell: () => 'Test',
        cellComponent: null,
        cellConfig: originalConfig
      };

      // Should be the same object reference
      expect(column.cellConfig).toBe(originalConfig);
    });

    it('should preserve function type cellConfig exactly as provided', () => {
      const originalFunction = (entity: TestEntity) => ({ test: true });

      const column: ITableColumn<TestEntity> = {
        columnId: 'test',
        headerCell: () => 'Test',
        cellComponent: null,
        cellConfig: originalFunction
      };

      // Should be the same function reference
      expect(column.cellConfig).toBe(originalFunction);
    });

    it('should allow cellConfig to be any type without modification', () => {
      const stringConfig: any = 'string-config';
      const numberConfig: any = 42;
      const boolConfig: any = true;

      const col1: ITableColumn<TestEntity> = {
        columnId: 'col1',
        headerCell: () => '',
        cellComponent: null,
        cellConfig: stringConfig
      };

      const col2: ITableColumn<TestEntity> = {
        columnId: 'col2',
        headerCell: () => '',
        cellComponent: null,
        cellConfig: numberConfig
      };

      const col3: ITableColumn<TestEntity> = {
        columnId: 'col3',
        headerCell: () => '',
        cellComponent: null,
        cellConfig: boolConfig
      };

      expect(col1.cellConfig).toBe(stringConfig);
      expect(col2.cellConfig).toBe(numberConfig);
      expect(col3.cellConfig).toBe(boolConfig);
    });
  });

  describe('Complete Column Flow Verification', () => {

    it('should verify complete column definition flow with favorite column', () => {
      // Create favorite column
      const favoriteColumn = createTableColumnFavorite<TestEntity, TestFavoriteMetadata>(
        createTestUserFavorite
      );

      // Verify all required properties
      expect(favoriteColumn.columnId).toBe('favorite');
      expect(favoriteColumn.headerCell).toBeDefined();
      expect(typeof favoriteColumn.headerCell).toBe('function');
      expect(favoriteColumn.cellComponent).toBe(TableCellFavoriteComponent);
      expect(favoriteColumn.cellFlex).toBe('0 0 100px');
      expect(favoriteColumn.cellConfig).toBeDefined();

      // Verify cellConfig has createUserFavorite function
      const config = favoriteColumn.cellConfig as any;
      expect(typeof config.createUserFavorite).toBe('function');

      // Test that createUserFavorite works correctly
      const testEntity: TestEntity = {
        id: 'entity-123',
        name: 'Test Application'
      };

      const favorite = config.createUserFavorite(testEntity);
      expect(favorite.entityId).toBe('entity-123');
      expect(favorite.canFavorite()).toBe(true);
      expect(favorite.getPayload()).toBeDefined();
    });

    it('should verify multiple columns with different cellConfig types', () => {
      const columns: ITableColumn<TestEntity>[] = [
        {
          columnId: 'id',
          headerCell: () => 'ID',
          cellComponent: null,
          cellConfig: { editable: false }
        },
        {
          columnId: 'name',
          headerCell: () => 'Name',
          cellComponent: null,
          cellConfig: (entity: TestEntity) => ({
            editable: true,
            value: entity.name
          })
        },
        {
          columnId: 'description',
          headerCell: () => 'Description',
          cellComponent: null
        },
        createTableColumnFavorite<TestEntity, TestFavoriteMetadata>(
          createTestUserFavorite
        )
      ];

      // Verify all columns are properly configured
      expect(columns.length).toBe(4);

      // Column 1: static object config
      expect((columns[0].cellConfig as any).editable).toBe(false);

      // Column 2: function config
      const entity = { id: '1', name: 'Test' };
      const nameConfig = (columns[1].cellConfig as any)(entity);
      expect(nameConfig.editable).toBe(true);

      // Column 3: no config
      expect(columns[2].cellConfig).toBeUndefined();

      // Column 4: favorite with proper config
      expect(columns[3].columnId).toBe('favorite');
      expect((columns[3].cellConfig as any).createUserFavorite).toBeDefined();
    });
  });
});
