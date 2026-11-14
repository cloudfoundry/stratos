import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EndpointModel, EntityCatalogHelper, EntityCatalogHelpers, StratosCatalogEndpointEntity, entityCatalog } from '@stratosui/store';
import { BaseTestModules, STORE_TEST_PROVIDERS } from '@test-framework/core-test.helper';
import { seedEndpointsDataService } from '@stratosui/store/testing';

import { EndpointRegisterModalComponent } from '../../endpoint-register-modal/endpoint-register-modal.component';

// The tiles come from the endpoint types and how many of each are already
// registered; the register dialog is one of the two pages that show them.
describe('BaseEndpointTileManager tiles', () => {
  let fixture: ComponentFixture<EndpointRegisterModalComponent>;
  const hubLimit = signal<number | null>(1);
  let types: StratosCatalogEndpointEntity[];

  const endpoint = (guid: string, type: string) => ({ guid, cnsi_type: type, sub_type: '' }) as EndpointModel;
  const labels = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('app-tile-selector-tile'))
    .map(tile => tile.textContent!.trim());

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [...BaseTestModules, EndpointRegisterModalComponent],
      providers: [...STORE_TEST_PROVIDERS, provideZonelessChangeDetection()],
    });
    EntityCatalogHelpers.SetEntityCatalogHelper(TestBed.inject(EntityCatalogHelper));
    hubLimit.set(1);
    types = [
      new StratosCatalogEndpointEntity({
        type: 'one-only', label: 'One only', labelPlural: 'One only', logoUrl: '', authTypes: [],
        registeredLimit: () => 1,
      }),
      new StratosCatalogEndpointEntity({
        type: 'watched', label: 'Watched', labelPlural: 'Watched', logoUrl: '', authTypes: [],
        registeredLimit: () => hubLimit,
      }),
      new StratosCatalogEndpointEntity({
        type: 'free', label: 'Free', labelPlural: 'Free', logoUrl: '', authTypes: [],
      }),
    ];
    vi.spyOn(entityCatalog, 'getAllEndpointTypes').mockImplementation(() => types);
    fixture = TestBed.createComponent(EndpointRegisterModalComponent);
    await fixture.whenStable();
  });

  afterEach(() => vi.restoreAllMocks());

  it('offers every type while none is registered', () => {
    expect(labels()).toEqual(['Free', 'One only', 'Watched']);
  });

  // The page can open before the endpoints are listed; the tiles used to
  // keep what that first empty list said.
  it('takes a type away once its limit of endpoints is registered', async () => {
    seedEndpointsDataService([endpoint('a', 'one-only')]);
    await fixture.whenStable();
    expect(labels()).toEqual(['Free', 'Watched']);

    seedEndpointsDataService([]);
    await fixture.whenStable();
    expect(labels()).toEqual(['Free', 'One only', 'Watched']);
  });

  it('follows a limit that changes', async () => {
    hubLimit.set(0);
    await fixture.whenStable();
    expect(labels()).toEqual(['Free', 'One only']);
  });

  // A limit that waits on the session is null until it is known; showing the
  // tiles first would flash a type that is about to be taken away.
  it('shows no tiles until every limit is known', async () => {
    hubLimit.set(null);
    await fixture.whenStable();
    expect(labels()).toEqual([]);

    hubLimit.set(0);
    await fixture.whenStable();
    expect(labels()).toEqual(['Free', 'One only']);
  });
});
