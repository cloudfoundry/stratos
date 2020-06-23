import { Component, ViewChild } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule, NoopAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { createBasicStoreModule } from '@stratosui/store/testing';
import { Observable, of } from 'rxjs';

import { EntitySchema } from '../../../../../../../../store/src/helpers/entity-schema';
import { EntityMonitorFactory } from '../../../../../../../../store/src/monitors/entity-monitor.factory.service';
import { IFavoriteMetadata, UserFavorite } from '../../../../../../../../store/src/types/user-favorites.types';
import { CoreTestingModule } from '../../../../../../../test-framework/core-test.modules';
import * as favoriteHelpers from '../../../../../../core/user-favorite-helpers';
import { UserFavoriteManager } from '../../../../../../core/user-favorite-manager';
import { SharedModule } from '../../../../../shared.module';
import { ComponentEntityMonitorConfig, StratosStatus } from '../../../../../shared.types';
import { FavoritesConfigMapper } from '../../../../favorites-meta-card/favorite-config-mapper';
import { MetaCardComponent } from './meta-card.component';

@Component({
  template: `
    <app-meta-card>
      <app-meta-card-title>Title</app-meta-card-title>
    </app-meta-card>`
})
class WrapperComponent {
  @ViewChild(MetaCardComponent, { static: true })
  metaCard: MetaCardComponent;
}

class UserFavoriteManagerMock {
  getPrettyTypeName() {
    return 'prettyName';
  }

  getIsFavoriteObservable() {
    return of(true);
  }
}

class EntityMonitorFactoryMock {
  entity = {
    entity: {
      entity: {
        cfGuid: 1
      },
      metadata: {
        guid: 2
      }
    }
  };

  monitor = {
    isDeletingEntity$: of(false),
    entity$: new Observable(subscriber => {
      subscriber.next(this.entity);
      subscriber.complete();
    })
  };

  create() {
    return this.monitor;
  }
}

describe('MetaCardComponent', () => {
  const favorite = new UserFavorite<IFavoriteMetadata>('endpoint', 'endpointType', 'entityType');
  const entityConfig = new ComponentEntityMonitorConfig('guid', new EntitySchema('schema', 'endpointType'));

  let component: MetaCardComponent;
  let fixture: ComponentFixture<WrapperComponent>;
  let element: HTMLElement;
  let entityMonitorFactory: EntityMonitorFactoryMock;
  let favoritesConfigMapper: FavoritesConfigMapper;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        SharedModule,
        StoreModule,
        CoreTestingModule,
        NoopAnimationsModule,
        BrowserAnimationsModule,
        createBasicStoreModule()
      ],
      declarations: [WrapperComponent],
      providers: [
        { provide: EntityMonitorFactory, useClass: EntityMonitorFactoryMock },
        { provide: UserFavoriteManager, useClass: UserFavoriteManagerMock },
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WrapperComponent);
    entityMonitorFactory = TestBed.get(EntityMonitorFactory);
    favoritesConfigMapper = TestBed.get(FavoritesConfigMapper);
    component = fixture.componentInstance.metaCard;
    fixture.detectChanges();
    element = fixture.debugElement.nativeElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show progress bar if entity is being deleted', () => {
    entityMonitorFactory.monitor.isDeletingEntity$ = of(true);
    component.entityConfig = entityConfig;
    fixture.detectChanges();

    expect(element.querySelector('mat-progress-bar')).toBeTruthy();
  });

  it('should show action menu', () => {
    component.actionMenu = [
      {
        label: 'Action1',
        action: null,
        can: of(true),
      },
      {
        label: 'Action2',
        action: null,
      },
    ];
    fixture.detectChanges();

    expect(element.querySelector('mat-menu')).toBeTruthy();
  });

  it('should hide actions without permission', () => {
    component.actionMenu = [
      {
        label: 'Action1',
        action: null,
        can: of(false),
      },
    ];
    fixture.detectChanges();

    expect(element.querySelector('mat-menu')).toBeFalsy();
  });

  it('should show star if favoritable', () => {
    spyOn(favoritesConfigMapper, 'getPrettyTypeName').and.returnValue('prettyName');
    component.favorite = favorite;
    fixture.detectChanges();

    expect(element.querySelector('app-entity-favorite-star')).toBeTruthy();
  });

  it('should set favorite from entityConfig if not set', () => {
    spyOn(favoritesConfigMapper, 'getPrettyTypeName').and.returnValue('prettyName');
    spyOn(favoriteHelpers, 'getFavoriteFromEntity').and.returnValue(favorite);
    component.entityConfig = entityConfig;
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
