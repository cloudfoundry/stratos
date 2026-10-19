import { Component, ViewChild, provideZonelessChangeDetection, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { IFavoriteMetadata, StratosStatus, UserFavorite, UserFavoriteManager, entityCatalog, TestEntityCatalog } from '@stratosui/store';
import { createBasicStoreModule, CoreTestingModule } from '@test-framework';
import { generateGenericMockEntities } from '@test-framework/mock-catalog-entities';
import { MetaCardComponent } from './meta-card.component';
import { MetaCardTitleComponent } from '../meta-card-title/meta-card-title.component';
import { MetaCardItemComponent } from '../meta-card-item/meta-card-item.component';
import { MetaCardKeyComponent } from '../meta-card-key/meta-card-key.component';
import { MetaCardValueComponent } from '../meta-card-value/meta-card-value.component';

@Component({
  imports: [MetaCardComponent, MetaCardTitleComponent],
  template: `
    <app-meta-card>
      <app-meta-card-title>Title</app-meta-card-title>
    </app-meta-card>`
})
class WrapperComponent {
  @ViewChild(MetaCardComponent, { static: true })
  metaCard!: MetaCardComponent;
}

// An item behind an @if that turns on after the first render, the way
// cards add rows once their async data lands.
@Component({
  imports: [MetaCardComponent, MetaCardItemComponent, MetaCardKeyComponent, MetaCardValueComponent],
  template: `
    <app-meta-card>
      <app-meta-card-item>
        <app-meta-card-key>Always</app-meta-card-key>
        <app-meta-card-value>here</app-meta-card-value>
      </app-meta-card-item>
      @if (showLate()) {
        <app-meta-card-item>
          <app-meta-card-key>Late</app-meta-card-key>
          <app-meta-card-value>arrived</app-meta-card-value>
        </app-meta-card-item>
      }
    </app-meta-card>`
})
class LateItemWrapperComponent {
  readonly showLate = signal(false);
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

describe('MetaCardComponent', () => {
  // Register generic mock entities BEFORE any test data is created
  // This must run at module load time because const declarations below use the catalog
  const testEntityCatalog = entityCatalog as TestEntityCatalog;
  testEntityCatalog.clear();
  generateGenericMockEntities().forEach(entity => entityCatalog.register(entity));

  const favorite = new UserFavorite<IFavoriteMetadata>('endpoint', 'endpointType', 'entityType');

  let component: MetaCardComponent;
  let fixture: ComponentFixture<WrapperComponent>;
  let element: HTMLElement;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      imports: [
        MetaCardComponent,
        MetaCardTitleComponent,
        CoreTestingModule,
        NoopAnimationsModule,
        createBasicStoreModule(),
        WrapperComponent,
        LateItemWrapperComponent,
      ],
      providers: [
        { provide: UserFavoriteManager, useClass: UserFavoriteManagerMock },
        provideZonelessChangeDetection(),
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WrapperComponent);
    component = fixture.componentInstance.metaCard;
    element = fixture.debugElement.nativeElement;
    // Don't call detectChanges here - let each test control when it happens
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('constructs without an EntityMonitorFactory (ngrx-free)', () => {
    // The legacy entity-monitor favorite-star fallback was removed; the
    // component must construct without that ngrx dependency being provided.
    expect(component).toBeTruthy();
    expect((component as unknown as { entityMonitorFactory?: unknown }).entityMonitorFactory).toBeUndefined();
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

  it('renders an item added after the first render', async () => {
    const lateFixture = TestBed.createComponent(LateItemWrapperComponent);
    await lateFixture.whenStable();
    const host: HTMLElement = lateFixture.nativeElement;
    expect(host.textContent).toContain('here');
    expect(host.textContent).not.toContain('arrived');

    lateFixture.componentInstance.showLate.set(true);
    await lateFixture.whenStable();

    expect(host.textContent).toContain('Late');
    expect(host.textContent).toContain('arrived');
  });
});
