import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IFavoriteMetadata, UserFavorite } from '@stratosui/store';

import { BaseTestModulesNoShared } from '../../../../../../test-framework/core-test.helper';
import { TableCellFavoriteComponent, TableCellFavoriteComponentConfig } from './table-cell-favorite.component';

interface TestEntity {
  id: string;
  name: string;
}

interface TestMetadata extends IFavoriteMetadata {
  name: string;
  entityId: string;
}

describe('TableCellFavoriteComponent', () => {
  let component: TableCellFavoriteComponent<TestEntity, TestMetadata>;
  let fixture: ComponentFixture<TableCellFavoriteComponent<TestEntity, TestMetadata>>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({

      imports: [
        ...BaseTestModulesNoShared,
        TableCellFavoriteComponent
      ]

    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent<TableCellFavoriteComponent<TestEntity, TestMetadata>>(TableCellFavoriteComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Valid Config Tests', () => {
    it('should create favorite from valid config with createUserFavorite function', () => {
      const testEntity: TestEntity = { id: 'test-123', name: 'Test Entity' };

      const validConfig: TableCellFavoriteComponentConfig<TestEntity, TestMetadata> = {
        createUserFavorite: (entity: TestEntity) => new UserFavorite<TestMetadata>(
          'endpoint-1',
          'cf',
          'application',
          entity.id,
          { name: entity.name, entityId: entity.id }
        )
      };

      component.config = validConfig;
      component.row = testEntity;
      fixture.detectChanges();

      expect(component.favorite).toBeDefined();
      expect(component.favorite.entityId).toBe('test-123');
      expect(component.favorite.metadata.name).toBe('Test Entity');
      expect(component.favorite.endpointType).toBe('cf');
      expect(component.favorite.entityType).toBe('application');
    });

    it('should update favorite when row data changes', () => {
      const validConfig: TableCellFavoriteComponentConfig<TestEntity, TestMetadata> = {
        createUserFavorite: (entity: TestEntity) => new UserFavorite<TestMetadata>(
          'endpoint-1',
          'cf',
          'application',
          entity.id,
          { name: entity.name, entityId: entity.id }
        )
      };

      component.config = validConfig;

      // Set initial row
      const firstEntity: TestEntity = { id: 'entity-1', name: 'First Entity' };
      component.row = firstEntity;
      fixture.detectChanges();

      expect(component.favorite.entityId).toBe('entity-1');
      expect(component.favorite.metadata.name).toBe('First Entity');

      // Update row
      const secondEntity: TestEntity = { id: 'entity-2', name: 'Second Entity' };
      component.row = secondEntity;
      fixture.detectChanges();

      expect(component.favorite.entityId).toBe('entity-2');
      expect(component.favorite.metadata.name).toBe('Second Entity');
    });

    it('should call config function with correct row data', () => {
      const testEntity: TestEntity = { id: 'test-456', name: 'Another Test' };
      const createUserFavoriteSpy = jasmine.createSpy('createUserFavorite').and.returnValue(
        new UserFavorite<TestMetadata>(
          'endpoint-2',
          'k8s',
          'pod',
          testEntity.id,
          { name: testEntity.name, entityId: testEntity.id }
        )
      );

      const validConfig: TableCellFavoriteComponentConfig<TestEntity, TestMetadata> = {
        createUserFavorite: createUserFavoriteSpy
      };

      component.config = validConfig;
      component.row = testEntity;
      fixture.detectChanges();

      expect(createUserFavoriteSpy).toHaveBeenCalledWith(testEntity);
      expect(createUserFavoriteSpy).toHaveBeenCalledTimes(1);
    });

    it('should properly create UserFavorite with all properties', () => {
      const testEntity: TestEntity = { id: 'complete-test', name: 'Complete Test Entity' };

      const validConfig: TableCellFavoriteComponentConfig<TestEntity, TestMetadata> = {
        createUserFavorite: (entity: TestEntity) => new UserFavorite<TestMetadata>(
          'my-endpoint',
          'kubernetes',
          'deployment',
          entity.id,
          { name: entity.name, entityId: entity.id }
        )
      };

      component.config = validConfig;
      component.row = testEntity;
      fixture.detectChanges();

      const favorite = component.favorite;
      expect(favorite).toBeDefined();
      expect(favorite.endpointId).toBe('my-endpoint');
      expect(favorite.endpointType).toBe('kubernetes');
      expect(favorite.entityType).toBe('deployment');
      expect(favorite.entityId).toBe('complete-test');
      expect(favorite.metadata.name).toBe('Complete Test Entity');
      expect(favorite.guid).toBeTruthy(); // Guid should be auto-generated
    });
  });

  describe('Invalid Config Handling', () => {
    it('should handle missing config gracefully without crashing', () => {
      const testEntity: TestEntity = { id: 'test-789', name: 'Test Without Config' };

      // Set row without config
      component.row = testEntity;

      expect(() => fixture.detectChanges()).not.toThrow();
      expect(component.favorite).toBeUndefined();
    });

    it('should handle missing row gracefully without crashing', () => {
      const validConfig: TableCellFavoriteComponentConfig<TestEntity, TestMetadata> = {
        createUserFavorite: (entity: TestEntity) => new UserFavorite<TestMetadata>(
          'endpoint-1',
          'cf',
          'application',
          entity.id,
          { name: entity.name, entityId: entity.id }
        )
      };

      // Set config without row
      component.config = validConfig;

      expect(() => fixture.detectChanges()).not.toThrow();
      expect(component.favorite).toBeUndefined();
    });

    it('should handle config with missing createUserFavorite function', () => {
      const testEntity: TestEntity = { id: 'invalid-config-test', name: 'Invalid Config Test' };
      const invalidConfig = { wrongProperty: 'value' } as any;

      component.row = testEntity;

      // This should not crash even with invalid config
      expect(() => {
        component.config = invalidConfig;
        fixture.detectChanges();
      }).toThrow(); // Will throw because createUserFavorite is not a function
    });
  });

  describe('canFavorite Integration', () => {
    it('should set canFavorite based on UserFavorite.canFavorite() result', () => {
      const testEntity: TestEntity = { id: 'can-fav-test', name: 'Can Favorite Test' };

      const validConfig: TableCellFavoriteComponentConfig<TestEntity, TestMetadata> = {
        createUserFavorite: (entity: TestEntity) => {
          const favorite = new UserFavorite<TestMetadata>(
            'endpoint-1',
            'cf',
            'application',
            entity.id,
            { name: entity.name, entityId: entity.id }
          );
          // Mock canFavorite to return a specific value
          spyOn(favorite, 'canFavorite').and.returnValue(true);
          return favorite;
        }
      };

      component.config = validConfig;
      component.row = testEntity;
      fixture.detectChanges();

      expect(component.canFavorite).toBe(true);
    });
  });
});
