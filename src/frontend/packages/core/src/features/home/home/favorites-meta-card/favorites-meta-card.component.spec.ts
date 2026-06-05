import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IFavoriteMetadata, UserFavorite, UserFavoritesDataService } from '@stratosui/store';
import { BaseTestModulesNoShared, STORE_TEST_PROVIDERS } from "@test-framework/core-test.helper";
import { ConfirmationDialogService } from '../../../../shared/components/confirmation-dialog.service';
import { SessionService } from '../../../../shared/services/session.service';
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

  beforeEach(() => {
    freshName = null;
    TestBed.configureTestingModule({
      providers: [
        ...(STORE_TEST_PROVIDERS || []),
        ConfirmationDialogService,
        SessionService,
        { provide: FreshEntityNameService, useValue: { freshNameFor: () => freshName } },
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

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('shows the stored name when no fresh name is available', () => {
    freshName = null;
    component.favoriteEntity = makeFavoriteStub('stored name');
    fixture.detectChanges();
    expect(component.displayName()).toBe('stored name');
  });

  it('shows the fresh name when one is available', () => {
    freshName = 'fresh name';
    component.favoriteEntity = makeFavoriteStub('stored name');
    fixture.detectChanges();
    expect(component.displayName()).toBe('fresh name');
  });

  it('persists the corrected name once when fresh diverges from stored', () => {
    const favData = TestBed.inject(UserFavoritesDataService);
    const spy = vi.spyOn(favData, 'updateMetadata').mockImplementation(() => undefined);
    freshName = 'renamed app';
    component.favoriteEntity = makeFavoriteStub('old app');
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0].metadata.name).toBe('renamed app');
  });

  it('does not persist when fresh equals stored', () => {
    const favData = TestBed.inject(UserFavoritesDataService);
    const spy = vi.spyOn(favData, 'updateMetadata').mockImplementation(() => undefined);
    freshName = 'same name';
    component.favoriteEntity = makeFavoriteStub('same name');
    fixture.detectChanges();
    expect(spy).not.toHaveBeenCalled();
  });

  it('does not persist (and does not throw) when the favorite is malformed', () => {
    const favData = TestBed.inject(UserFavoritesDataService);
    const spy = vi.spyOn(favData, 'updateMetadata').mockImplementation(() => undefined);
    freshName = 'renamed app';
    // Missing entityType -> userFavoriteManager.getUserFavoriteFromObject returns null.
    const malformed = {
      guid: 'x', endpointId: 'ep1', endpointType: 'cf', entityId: 'x', metadata: { name: 'old' },
      getPrettyTypeName: () => 'App', getIcon: () => ({} as any), getLink: () => '/x',
    } as unknown as UserFavorite<IFavoriteMetadata>;
    expect(() => { component.favoriteEntity = malformed; fixture.detectChanges(); }).not.toThrow();
    expect(spy).not.toHaveBeenCalled();
  });
});
