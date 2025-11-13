import { Component, ViewChild, provideZonelessChangeDetection, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Observable, of } from 'rxjs';
import {
  ComponentEntityMonitorConfig,
  EntityMonitorFactory,
  EntitySchema,
  EntityServiceFactory,
  IFavoriteMetadata,
  StratosStatus,
  UserFavorite,
  UserFavoriteManager,
  entityCatalog,
  TestEntityCatalog,
} from '@stratosui/store';
import { createBasicStoreModule, CoreTestingModule } from '@test-framework';
import { generateGenericMockEntities } from '@test-framework/mock-catalog-entities';
import { MetaCardComponent } from './meta-card.component';
import { MetaCardTitleComponent } from '../meta-card-title/meta-card-title.component';

@Component({
  standalone: false,
  template: `
    <app-meta-card>
      <app-meta-card-title>Title</app-meta-card-title>
    </app-meta-card>`
})
class WrapperComponent {
  @ViewChild(MetaCardComponent, { static: true })
  metaCard!: MetaCardComponent;
}

class UserFavoriteManagerMock {
  getPrettyTypeName() {
    return 'prettyName';
  }

  getIsFavoriteObservable() {
    return of(true);
  }

  getFavorite() {
    return null;
  }
}

class EntityMonitorFactoryMock {
  entity = {
    entity: {
      entity: {
        cfGuid: 1,
      },
      metadata: {
        guid: 2,
      }
    }
  };

  monitor = {
    isDeletingEntity$: of(false),
    entity$: new Observable(subscriber => {
      subscriber.next(this.entity);
      subscriber.complete();
    }),
  };

  create() {
    return this.monitor;
  }
}

describe('MetaCardComponent', () => {
  // Register generic mock entities BEFORE any test data is created
  // This must run at module load time because const declarations below use the catalog
  const testEntityCatalog = entityCatalog as TestEntityCatalog;
  testEntityCatalog.clear();
  generateGenericMockEntities().forEach(entity => entityCatalog.register(entity));

  const favorite = new UserFavorite<IFavoriteMetadata>('endpoint', 'endpointType', 'entityType');
  const entityConfig = new ComponentEntityMonitorConfig('guid', new EntitySchema('schema', 'endpointType'));

  let component: MetaCardComponent;
  let fixture: ComponentFixture<WrapperComponent>;
  let element: HTMLElement;
  let entityMonitorFactory: EntityMonitorFactoryMock;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      imports: [
        MetaCardComponent,
        MetaCardTitleComponent,
        CoreTestingModule,
        NoopAnimationsModule,
        createBasicStoreModule(),
      ],
      declarations: [WrapperComponent],
      providers: [
        EntityServiceFactory,
        { provide: EntityMonitorFactory, useClass: EntityMonitorFactoryMock },
        { provide: UserFavoriteManager, useClass: UserFavoriteManagerMock },
        provideZonelessChangeDetection(),
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WrapperComponent);
    entityMonitorFactory = TestBed.inject(EntityMonitorFactory) as any as EntityMonitorFactoryMock;
    component = fixture.componentInstance.metaCard;
    element = fixture.debugElement.nativeElement;
    // Don't call detectChanges here - let each test control when it happens
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show progress bar if entity is being deleted', () => {
    entityMonitorFactory.monitor.isDeletingEntity$ = of(true);
    component.entityConfig = entityConfig;
    fixture.detectChanges();

    expect(element.querySelector('app-progress-bar')).toBeTruthy();
  });

  it('should show action menu', () => {
    component.actionMenu = [
      {
        label: 'Action1',
        action: () => {},
        can: of(true),
      },
      {
        label: 'Action2',
        action: () => {},
      },
    ];
    fixture.detectChanges();

    // The menu button should be visible when actionMenu is set and showMenu$ is true
    const menuButton = element.querySelector('button.meta-card__header__button');
    expect(menuButton).toBeTruthy();
  });

  it('should hide actions without permission', () => {
    component.actionMenu = [
      {
        label: 'Action1',
        action: () => {},
        can: of(false),
      },
    ];
    fixture.detectChanges();

    // The menu button should not be visible when all actions have can: false
    const menuButton = element.querySelector('button.meta-card__header__button');
    expect(menuButton).toBeFalsy();
  });

  it('should show star if favoritable', () => {
    component.favorite = favorite;
    fixture.detectChanges();

    expect(element.querySelector('app-entity-favorite-star')).toBeTruthy();
  });

  it('should show app state icon if status', () => {
    expect(element.querySelector('app-application-state-icon')).toBeFalsy();

    component.status$ = of(StratosStatus.TENTATIVE);
    fixture.detectChanges();

    expect(element.querySelector('app-application-state-icon')).toBeTruthy();
  });
});
