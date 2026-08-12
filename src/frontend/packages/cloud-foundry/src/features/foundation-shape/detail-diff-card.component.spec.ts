import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { DetailDiffCardComponent } from './detail-diff-card.component';
import { DetailExport } from './detail-export';
import { computeSessionShape } from './session-shape';
import { ShapeSection } from './shape-section';

const stamp = { fetchedAt: new Date('2026-08-01T10:00:00Z'), stale: false };
const never = { fetchedAt: null, stale: false };

const makeSection = (guid: string, name: string, over: Partial<ShapeSection> = {}): ShapeSection => ({
  guid,
  name,
  shape: computeSessionShape([], [], []),
  totals: {
    orgs: 0, spaces: null, apps: 0, routes: 0,
    serviceInstances: 0, serviceOfferings: 0, servicePlans: 0, serviceBrokers: 0,
  },
  drains: { orgs: stamp, spaces: never, apps: never },
  loading: false,
  hasDrains: true,
  countsLoaded: true,
  servicesCountsLoaded: true,
  admin: true,
  ...over,
});

const detailExport = (over: Partial<DetailExport> = {}): DetailExport => ({
  schema_version: 1,
  mode: 'detail',
  endpoint: { guid: 'cf-1', name: 'Lab CF' },
  collected_at: '2026-08-12T10:00:00.000Z',
  coverage_note: 'note',
  drains: { orgs: '2026-08-12T10:00:00.000Z', spaces: null, apps: null },
  totals: {},
  organizations: [{ guid: 'o1', name: 'payments-prod', status: 'active', quota_guid: '' }],
  orphans: {},
  ...over,
});

const exportFile = (name: string, exported: object): File =>
  new File([JSON.stringify(exported)], name, { type: 'application/json' });

describe('DetailDiffCardComponent', () => {
  let fixture: ComponentFixture<DetailDiffCardComponent>;
  let component: DetailDiffCardComponent;

  const text = (): string => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const payloads = new Map<string, DetailExport | null>();

  beforeEach(async () => {
    payloads.clear();
    await TestBed.configureTestingModule({
      imports: [DetailDiffCardComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(DetailDiffCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('sections', [
      makeSection('cf-1', 'Lab CF'),
      makeSection('cf-2', 'AWS CF', { admin: false }),
      makeSection('cf-3', 'Empty CF', { drains: { orgs: never, spaces: never, apps: never } }),
    ]);
    fixture.componentRef.setInput('detailPayload', (section: ShapeSection) => payloads.get(section.guid) ?? null);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('offers only admin sections whose orgs drain ran as live sides', () => {
    const ids = component.options().map(option => option.id);
    expect(ids).toEqual(['live:cf-1']);
  });

  it('accepts an imported detail file as a side and rejects an anonymous one', async () => {
    await component.importFrom(exportFile('lab-detail.json', detailExport()));
    expect(component.options().some(option => option.label.includes('Lab CF'))).toBe(true);

    await component.importFrom(exportFile('shape.json', { schema_version: 1, mode: 'anonymous' }));
    expect(component.importError()).toContain('anonymous');
  });

  it('diffs two selected sides and names what changed', async () => {
    await component.importFrom(exportFile('before.json', detailExport()));
    await component.importFrom(
      exportFile('after.json', detailExport({
        collected_at: '2026-08-12T11:00:00.000Z',
        organizations: [{ guid: 'o2', name: 'new-org', status: 'active', quota_guid: '' }],
      }))
    );
    component.select('before', component.options()[1].id);
    component.select('after', component.options()[2].id);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(text()).toContain('new-org');
    expect(text()).toContain('payments-prod');
  });

  it('uses the live payload for a live side', async () => {
    payloads.set('cf-1', detailExport({ organizations: [] }));
    await component.importFrom(exportFile('before.json', detailExport()));
    component.select('before', component.options()[1].id);
    component.select('after', 'live:cf-1');
    fixture.detectChanges();
    await fixture.whenStable();

    // payments-prod exists only on the imported before side → reads as removed.
    expect(text()).toContain('payments-prod');
    expect(component.diff()?.levels.find(level => level.key === 'organizations')?.removed).toHaveLength(1);
  });

  it('renders nothing but the prompt until two distinct sides are chosen', () => {
    expect(component.diff()).toBeNull();
    expect(text()).toContain('named diff');
  });
});
