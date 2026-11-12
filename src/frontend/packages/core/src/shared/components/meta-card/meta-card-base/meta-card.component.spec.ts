import { Component, ViewChild, provideZonelessChangeDetection, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Observable, of } from 'rxjs';
import { IFavoriteMetadata, MenuItem, StratosStatus, UserFavorite, UserFavoriteManager, entityCatalog, TestEntityCatalog } from '@stratosui/store';
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
    <app-meta-card [favorite]="favorite()" [status$]="status$()" [actionMenu]="actionMenu()">
      <app-meta-card-title>Title</app-meta-card-title>
    </app-meta-card>`
})
class WrapperComponent {
  @ViewChild(MetaCardComponent, { static: true })
  metaCard!: MetaCardComponent;
  readonly actionMenu = signal<MenuItem[] | null | undefined>(undefined);
  readonly favorite = signal<UserFavorite<IFavoriteMetadata> | undefined>(undefined);
  readonly status$ = signal<Observable<StratosStatus> | undefined>(undefined);
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

  isFavorite() {
    return true;
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
    // No render here: each test sets its state first, then waits for the view
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

  it('should show action menu', async () => {
    fixture.componentInstance.actionMenu.set([
      {
        label: 'Action1',
        action: () => {},
        can: of(true),
      },
      {
        label: 'Action2',
        action: () => {},
      },
    ]);
    await fixture.whenStable();

    // The menu button should be visible when actionMenu is set and showMenu$ is true
    const menuButton = element.querySelector('button.meta-card__header__button');
    expect(menuButton).toBeTruthy();
  });

  // Material icon ligatures are text: the kebab was named "more_vert" and
  // each item read as glyph plus label ("link Connect").
  it('names the action menu button and hides item glyphs', async () => {
    fixture.componentInstance.actionMenu.set([{ label: 'Connect', icon: 'link', action: () => {}, can: of(true) }]);
    await fixture.whenStable();

    const menuButton = element.querySelector('button.meta-card__header__button') as HTMLButtonElement;
    expect(menuButton.getAttribute('aria-label')).toBe('Actions');
    expect(menuButton.querySelector('app-custom-icon')!.getAttribute('aria-hidden')).toBe('true');

    menuButton.click();
    await fixture.whenStable();
    const item = element.querySelector('[role="menu"] button') as HTMLButtonElement;
    expect(item.querySelector('app-custom-icon')!.getAttribute('aria-hidden')).toBe('true');
    expect(item.textContent).toContain('Connect');
    // A menu's items are menu items, or a screen reader finds the menu empty.
    expect(item.getAttribute('role')).toBe('menuitem');
  });

  it('should hide actions without permission', async () => {
    fixture.componentInstance.actionMenu.set([
      {
        label: 'Action1',
        action: () => {},
        can: of(false),
      },
    ]);
    await fixture.whenStable();

    // The menu button should not be visible when all actions have can: false
    const menuButton = element.querySelector('button.meta-card__header__button');
    expect(menuButton).toBeFalsy();
  });

  // Binding null keeps the menu the card already shows.
  it('keeps the last menu when the menu is set to null', async () => {
    fixture.componentInstance.actionMenu.set([{ label: 'Action1', action: () => {} }]);
    await fixture.whenStable();
    fixture.componentInstance.actionMenu.set(null);
    await fixture.whenStable();

    expect(element.querySelector('button.meta-card__header__button')).toBeTruthy();
  });

  it('should show star if favoritable', async () => {
    fixture.componentInstance.favorite.set(favorite);
    await fixture.whenStable();

    expect(element.querySelector('app-entity-favorite-star')).toBeTruthy();
  });

  // The card title looked like a heading but was a div (WCAG 1.3.1); it is a
  // heading at the level of the other card titles.
  it('renders its title as a heading', async () => {
    await fixture.whenStable();
    const title = element.querySelector('.meta-card__title') as HTMLElement;
    expect(title.tagName).toBe('H3');
    expect(title.textContent?.trim()).toBe('Title');
  });

  it('should show app state icon if status', async () => {
    expect(element.querySelector('app-application-state-icon')).toBeFalsy();

    fixture.componentInstance.status$.set(of(StratosStatus.TENTATIVE));
    await fixture.whenStable();

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
