import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import { IFavoriteMetadata, UserFavorite, UserFavoritesDataService } from '@stratosui/store';
import { BaseTestModulesNoShared, STORE_TEST_PROVIDERS } from "@test-framework/core-test.helper";
import { ConfirmationDialogService } from '../../../../shared/components/confirmation-dialog.service';
import { FreshEntityNameService } from '../../../../core/signals/fresh-entity-name.service';
import { FavoritesMetaCardComponent } from './favorites-meta-card.component';

// A favorite-shaped stub: only the fields/methods the card setter + effect use.
function makeFavoriteStub(name: string): UserFavorite<IFavoriteMetadata> {
  return {
    guid: 'app1', endpointId: 'ep1', endpointType: 'cf', entityType: 'application', entityId: 'app1',
    metadata: { name },
    getPrettyTypeName: () => 'Application',
    getIcon: () => ({} as any),
    getLink: () => '/cf/ep1/applications/app1',
  } as unknown as UserFavorite<IFavoriteMetadata>;
}

describe('FavoritesMetaCardComponent', () => {
  let component: FavoritesMetaCardComponent;
  let fixture: ComponentFixture<FavoritesMetaCardComponent>;
  let freshName: string | null;
  let fetchedName: string | null;

  beforeEach(() => {
    freshName = null;
    fetchedName = null;
    TestBed.configureTestingModule({
      providers: [
        ...(STORE_TEST_PROVIDERS || []),
        ConfirmationDialogService,
        { provide: FreshEntityNameService, useValue: { freshNameFor: () => freshName, fetchNameFor: () => of(fetchedName) } },
        provideZonelessChangeDetection(),
      ],
      imports: [
        ...BaseTestModulesNoShared,
        FavoritesMetaCardComponent,
      ],
    });
    TestBed.compileComponents();
    fixture = TestBed.createComponent(FavoritesMetaCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', async () => {
    await fixture.whenStable();
    expect(component).toBeTruthy();
  });

  // WCAG 4.1.2: the card was a button holding the favourite star, also a
  // button. A screen reader cannot tell the two apart (axe-core
  // nested-interactive). The name and type are now the open button; the
  // star sits beside it.
  it('opens from one button that holds no other control', async () => {
    fixture.componentRef.setInput('favoriteEntity', makeFavoriteStub('stored name'));
    await fixture.whenStable();
    const card = fixture.nativeElement.querySelector('.fav-card') as HTMLElement;
    expect(card.hasAttribute('role')).toBe(false);
    expect(card.hasAttribute('tabindex')).toBe(false);

    const open = card.querySelector('button[data-test="fav-open"]') as HTMLButtonElement;
    expect(open.textContent).toContain('stored name');
    expect(open.textContent).toContain('Application');
    expect(open.querySelector('button, a, [role=button], [tabindex]')).toBeNull();

    const spy = vi.spyOn(component, 'openFavorite').mockImplementation(() => {});
    open.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('shows the stored name when no fresh name is available', async () => {
    freshName = null;
    fixture.componentRef.setInput('favoriteEntity', makeFavoriteStub('stored name'));
    await fixture.whenStable();
    expect(component.displayName()).toBe('stored name');
  });

  it('shows the fresh name when one is available', async () => {
    freshName = 'fresh name';
    fixture.componentRef.setInput('favoriteEntity', makeFavoriteStub('stored name'));
    await fixture.whenStable();
    expect(component.displayName()).toBe('fresh name');
  });

  it('persists the corrected name once when fresh diverges from stored', async () => {
    const favData = TestBed.inject(UserFavoritesDataService);
    const spy = vi.spyOn(favData, 'updateMetadata').mockImplementation(() => undefined);
    freshName = 'renamed app';
    fixture.componentRef.setInput('favoriteEntity', makeFavoriteStub('old app'));
    await fixture.whenStable();
    expect(spy).toHaveBeenCalledTimes(1);
    const persisted = spy.mock.calls[0][0];
    expect(persisted.metadata).toBeDefined();
    // strict: asserted defined above; the corrected name is persisted in metadata
    expect(persisted.metadata!.name).toBe('renamed app');
  });

  it('does not persist when fresh equals stored', async () => {
    const favData = TestBed.inject(UserFavoritesDataService);
    const spy = vi.spyOn(favData, 'updateMetadata').mockImplementation(() => undefined);
    freshName = 'same name';
    fixture.componentRef.setInput('favoriteEntity', makeFavoriteStub('same name'));
    await fixture.whenStable();
    expect(spy).not.toHaveBeenCalled();
  });

  // Regression: a favorite whose entity hasn't resolved can arrive with null
  // metadata. Reading displayName() during template render must not throw — a
  // single nameless favorite was breaking change detection for the whole
  // endpoint home card (the "kevin 3 didn't load" report).
  function makeFavoriteStubNoMetadata(): UserFavorite<IFavoriteMetadata> {
    return {
      guid: 'app1', endpointId: 'ep1', endpointType: 'cf', entityType: 'application', entityId: 'app1',
      metadata: null,
      getPrettyTypeName: () => 'Application', getIcon: () => ({} as any), getLink: () => '/cf/ep1/applications/app1',
    } as unknown as UserFavorite<IFavoriteMetadata>;
  }

  it('does not throw and falls back to entity id when metadata is null', async () => {
    freshName = null;
    fixture.componentRef.setInput('favoriteEntity', makeFavoriteStubNoMetadata());
    // A throw while rendering rejects here and fails the test.
    await fixture.whenStable();
    expect(component.displayName()).toBe('app1');
  });

  it('still shows the fresh name when metadata is null', async () => {
    freshName = 'fresh name';
    fixture.componentRef.setInput('favoriteEntity', makeFavoriteStubNoMetadata());
    await fixture.whenStable();
    expect(component.displayName()).toBe('fresh name');
  });

  it('fetches the name on demand and backfills metadata when nothing else resolves', async () => {
    const favData = TestBed.inject(UserFavoritesDataService);
    const spy = vi.spyOn(favData, 'updateMetadata').mockImplementation(() => undefined);
    freshName = null;            // not in any loaded signal (home counts-only)
    fetchedName = 'opensource';  // single-resource fetch resolves the real name
    fixture.componentRef.setInput('favoriteEntity', makeFavoriteStubNoMetadata());
    await fixture.whenStable();
    // Renders the fetched name (not the entity-id fallback)...
    expect(component.displayName()).toBe('opensource');
    // ...and heals the null-metadata favorite for good.
    expect(spy).toHaveBeenCalledTimes(1);
    const persisted = spy.mock.calls[0][0];
    expect(persisted.metadata).toBeDefined();
    // strict: asserted defined above; the fetched name is backfilled into metadata
    expect(persisted.metadata!.name).toBe('opensource');
  });

  it('does not persist (and does not throw) when the favorite is malformed', async () => {
    const favData = TestBed.inject(UserFavoritesDataService);
    const spy = vi.spyOn(favData, 'updateMetadata').mockImplementation(() => undefined);
    freshName = 'renamed app';
    // Missing entityType -> userFavoriteManager.getUserFavoriteFromObject returns null.
    const malformed = {
      guid: 'x', endpointId: 'ep1', endpointType: 'cf', entityId: 'x', metadata: { name: 'old' },
      getPrettyTypeName: () => 'App', getIcon: () => ({} as any), getLink: () => '/x',
    } as unknown as UserFavorite<IFavoriteMetadata>;
    fixture.componentRef.setInput('favoriteEntity', malformed);
    // A throw while rendering rejects here and fails the test.
    await fixture.whenStable();
    expect(spy).not.toHaveBeenCalled();
  });
});
