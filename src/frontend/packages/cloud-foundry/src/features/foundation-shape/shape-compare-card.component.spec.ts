import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { computeSessionShape } from './session-shape';
import { ShapeCompareCardComponent } from './shape-compare-card.component';
import { AgnosticExport, buildAgnosticExport } from './shape-export';
import { MeasuredEcosystem, MeasuredTotals, ShapeMeasureService } from './shape-measure.service';
import { ShapeSection } from './shape-section';
import { app, org, space } from './testing/entity-builders';

const stamp = { fetchedAt: new Date('2026-08-01T10:00:00Z'), stale: false };

const makeSection = (guid: string, name: string, stackName: string): ShapeSection => ({
  guid,
  name,
  shape: computeSessionShape(
    [org('o1'), org('o2')],
    [space('s1', 'o1')],
    [app(`${guid}-a1`, { spaceGuid: 's1', orgGuid: 'o1', memory: 256, diskQuota: 1024, stackName })]
  ),
  totals: {
    orgs: 2, spaces: 1, apps: 1, routes: 5,
    serviceInstances: 3, serviceOfferings: 4, servicePlans: 6, serviceBrokers: 1,
  },
  drains: { orgs: stamp, spaces: stamp, apps: stamp },
  loading: false,
  hasDrains: true,
  countsLoaded: true,
  servicesCountsLoaded: true,
  admin: true,
});

const exportFile = (name: string, exported: object): File =>
  new File([JSON.stringify(exported)], name, { type: 'application/json' });

const sampleExport = (): AgnosticExport =>
  buildAgnosticExport({
    shape: computeSessionShape([org('o1'), org('o2')], [space('s1', 'o1')], [
      app('f-a1', { spaceGuid: 's1', orgGuid: 'o1', memory: 512, stackName: 'cflinuxfs3' }),
    ]),
    sessionTotals: {
      orgs: 2, spaces: 1, apps: 1, routes: 9,
      serviceInstances: 0, serviceOfferings: 0, servicePlans: 0, serviceBrokers: 0,
    },
    drains: { counts: true, servicesCounts: true, orgs: true, spaces: true, apps: true },
    collectedAt: new Date('2026-07-31T12:00:00Z'),
  });

describe('ShapeCompareCardComponent', () => {
  let fixture: ComponentFixture<ShapeCompareCardComponent>;
  let component: ShapeCompareCardComponent;
  let measure: {
    totals: ReturnType<typeof signal<ReadonlyMap<string, MeasuredTotals>>>;
    ecosystem: ReturnType<typeof signal<ReadonlyMap<string, MeasuredEcosystem>>>;
  };

  const text = (): string => (fixture.nativeElement as HTMLElement).textContent ?? '';

  beforeEach(async () => {
    measure = {
      totals: signal<ReadonlyMap<string, MeasuredTotals>>(new Map()),
      ecosystem: signal<ReadonlyMap<string, MeasuredEcosystem>>(new Map()),
    };
    await TestBed.configureTestingModule({
      imports: [ShapeCompareCardComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ShapeMeasureService, useValue: measure },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShapeCompareCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('sections', [
      makeSection('cf-1', 'Lab CF', 'cflinuxfs4'),
      makeSection('cf-2', 'AWS CF', 'cflinuxfs3'),
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('defaults side A to the first live section and prompts until B is chosen', () => {
    expect(component.effectiveChoice('a')).toBe('live:cf-1');
    expect(component.comparison()).toBeNull();
    expect(text()).toContain('Choose a source for each side');
  });

  it('compares two live sections once side B is chosen', async () => {
    component.onSelect('b', 'live:cf-2');
    fixture.detectChanges();
    await fixture.whenStable();
    const cmp = component.comparison();
    expect(cmp?.a.label).toBe('Lab CF');
    expect(cmp?.b.label).toBe('AWS CF');
    // each side pins a different stack: both categories appear with zero-fill
    const stacks = cmp?.categorical.find(c => c.dimension === 'stacks_pinned_by_apps');
    expect(stacks?.rows).toContainEqual({ category: 'cflinuxfs4', a: 1, aShare: 1, b: 0, bShare: 0 });
    expect(text()).toContain('Totals');
  });

  it('imports a valid export file, labelling it from the filename', async () => {
    await component.importFrom('b', exportFile('aws-foundational-shape-anonymous-2026-07-31.json', sampleExport()));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.effectiveChoice('b')).toBe('file');
    expect(component.comparison()?.b.label).toBe('aws-foundational-shape-anonymous-2026-07-31');
    expect(component.errorB()).toBeNull();
  });

  it('prefers the file foundation_label when the export carries one', async () => {
    await component.importFrom('b', exportFile('x.json', { ...sampleExport(), foundation_label: 'prod-east' }));
    expect(component.comparison()?.b.label).toBe('prod-east');
  });

  it('rejects an invalid file with a reason and leaves the slot unchanged', async () => {
    await component.importFrom('b', exportFile('bad.json', { schema_version: 2 }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.errorB()).toContain('schema_version');
    expect(component.comparison()).toBeNull();
    expect(text()).toContain('bad.json');
  });

  it('swaps the two sides including imported files', async () => {
    await component.importFrom('b', exportFile('imported.json', sampleExport()));
    component.swap();
    fixture.detectChanges();
    await fixture.whenStable();
    const cmp = component.comparison();
    expect(cmp?.a.label).toBe('imported');
    expect(cmp?.b.label).toBe('Lab CF');
  });

  it('accepts imported files in both slots', async () => {
    await component.importFrom('a', exportFile('one.json', sampleExport()));
    await component.importFrom('b', exportFile('two.json', sampleExport()));
    const cmp = component.comparison();
    expect(cmp?.a.label).toBe('one');
    expect(cmp?.b.label).toBe('two');
  });

  it('collapses long unchanged lists behind a toggle', async () => {
    const buildpacks = ['a_bp', 'b_bp', 'c_bp', 'd_bp', 'e_bp', 'f_bp', 'g_bp'];
    const withEco = { ...sampleExport(), composition: { buildpacks_defined: buildpacks } };
    await component.importFrom('a', exportFile('one.json', withEco));
    await component.importFrom('b', exportFile('two.json', withEco));
    fixture.detectChanges();
    await fixture.whenStable();
    const list = component.listVms().find(l => l.key === 'buildpacks_defined');
    expect(list?.shown).toHaveLength(5);
    expect(list?.more).toBe(2);
    expect(text()).toContain('2 more unchanged');
    component.toggleList('buildpacks_defined');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.listVms().find(l => l.key === 'buildpacks_defined')?.shown).toHaveLength(7);
  });

  it('folds measured ecosystem data of a live section into its side', async () => {
    measure.ecosystem.set(new Map([
      ['cf-1', { stacksDefined: ['cflinuxfs4'], buildpacksDefined: ['ruby_buildpack'], fetchedAt: new Date() }],
    ]));
    component.onSelect('b', 'live:cf-2');
    fixture.detectChanges();
    await fixture.whenStable();
    const lists = component.comparison()?.lists;
    // cf-1 measured its definitions, cf-2 did not: the diff shows them as removed-side-only
    expect(lists?.find(l => l.key === 'stacks_defined')?.removed).toEqual(['cflinuxfs4']);
  });
});
