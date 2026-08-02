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

  it('prompts until two sides are selected', () => {
    expect(component.sideCount()).toBe(0);
    expect(component.comparison()).toBeNull();
    expect(text()).toContain('Select at least two sides');
    component.toggleLive('cf-1');
    expect(component.comparison()).toBeNull();
  });

  it('compares live sections in selection order, first selected as baseline', async () => {
    component.toggleLive('cf-2');
    component.toggleLive('cf-1');
    fixture.detectChanges();
    await fixture.whenStable();
    const cmp = component.comparison();
    expect(cmp?.sides.map(s => s.label)).toEqual(['AWS CF', 'Lab CF']);
    expect(component.sideVms()[0].isBaseline).toBe(true);
    // each side pins a different stack: both categories appear with zero-fill
    const stacks = cmp?.categorical.find(c => c.dimension === 'stacks_pinned_by_apps');
    expect(stacks?.rows.find(r => r.category === 'cflinuxfs3')?.counts).toEqual([1, 0]);
    expect(text()).toContain('Totals');
  });

  it('unselecting on the bar removes the side again', () => {
    component.toggleLive('cf-1');
    component.toggleLive('cf-2');
    expect(component.comparison()).not.toBeNull();
    component.toggleLive('cf-1');
    expect(component.isSelected('cf-1')).toBe(false);
    expect(component.comparison()).toBeNull();
  });

  it('imports a valid export file as a side, labelling it from the filename', async () => {
    component.toggleLive('cf-1');
    await component.importFrom(exportFile('aws-foundational-shape-anonymous-2026-07-31.json', sampleExport()));
    fixture.detectChanges();
    await fixture.whenStable();
    const cmp = component.comparison();
    expect(cmp?.sides.map(s => s.label)).toEqual(['Lab CF', 'aws-foundational-shape-anonymous-2026-07-31']);
    expect(component.importError()).toBeNull();
  });

  it('prefers the file foundation_label when the export carries one', async () => {
    component.toggleLive('cf-1');
    await component.importFrom(exportFile('x.json', { ...sampleExport(), foundation_label: 'prod-east' }));
    expect(component.comparison()?.sides[1].label).toBe('prod-east');
  });

  it('rejects an invalid file with a reason and adds no side', async () => {
    await component.importFrom(exportFile('bad.json', { schema_version: 2 }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.importError()).toContain('schema_version');
    expect(component.sideCount()).toBe(0);
    expect(text()).toContain('bad.json');
  });

  it('compares three sides and re-baselines on demand', async () => {
    component.toggleLive('cf-1');
    component.toggleLive('cf-2');
    await component.importFrom(exportFile('imported.json', sampleExport()));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.comparison()?.sides.map(s => s.label)).toEqual(['Lab CF', 'AWS CF', 'imported']);

    const fileId = component.sideVms()[2].id;
    component.makeBaseline(fileId);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.comparison()?.sides.map(s => s.label)).toEqual(['imported', 'Lab CF', 'AWS CF']);
    expect(component.sideVms()[0].isBaseline).toBe(true);
  });

  it('keeps each side its identity color across re-baselining', async () => {
    component.toggleLive('cf-1');
    component.toggleLive('cf-2');
    const colorsBefore = new Map(component.sideVms().map(vm => [vm.id, vm.dotClass]));
    expect(colorsBefore.get('cf-1')).not.toBe(colorsBefore.get('cf-2'));
    component.makeBaseline(component.sideVms()[1].id);
    const colorsAfter = new Map(component.sideVms().map(vm => [vm.id, vm.dotClass]));
    expect(colorsAfter).toEqual(colorsBefore);
    // the bar chip matches the side's color everywhere
    expect(component.dotFor('cf-2')).toBe(colorsBefore.get('cf-2'));
    expect(component.dotFor('cf-1')).toBe(colorsBefore.get('cf-1'));
  });

  it('frees a removed side color for the next selection', () => {
    component.toggleLive('cf-1');
    component.toggleLive('cf-2');
    const first = component.dotFor('cf-1');
    component.toggleLive('cf-1'); // unselect: frees the first color
    component.toggleLive('cf-1'); // reselect: takes the freed slot again
    expect(component.dotFor('cf-1')).toBe(first);
    expect(component.dotFor('cf-1')).not.toBe(component.dotFor('cf-2'));
  });

  it('removes a side by chip', async () => {
    component.toggleLive('cf-1');
    component.toggleLive('cf-2');
    const id = component.sideVms()[1].id;
    component.remove(id);
    expect(component.sideCount()).toBe(1);
    expect(component.comparison()).toBeNull();
  });

  it('collapses unchanged matrix rows behind a toggle, keeping changed rows visible', async () => {
    const shared = ['a_bp', 'b_bp', 'c_bp', 'd_bp', 'e_bp', 'f_bp', 'g_bp'];
    await component.importFrom(exportFile('one.json', {
      ...sampleExport(), composition: { buildpacks_defined: [...shared, 'only_in_one'] },
    }));
    await component.importFrom(exportFile('two.json', {
      ...sampleExport(), composition: { buildpacks_defined: shared },
    }));
    fixture.detectChanges();
    await fixture.whenStable();
    const list = component.listVms().find(l => l.key === 'buildpacks_defined');
    // the changed row survives the collapse; 5 of 7 unchanged show
    expect(list?.rows.some(row => row.label === 'only_in_one')).toBe(true);
    expect(list?.rows).toHaveLength(6);
    expect(list?.more).toBe(2);
    expect(text()).toContain('2 more unchanged');
    component.toggleList('buildpacks_defined');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.listVms().find(l => l.key === 'buildpacks_defined')?.rows).toHaveLength(8);
  });

  it('judges added and removed against the baseline side', async () => {
    await component.importFrom(exportFile('base.json', {
      ...sampleExport(), composition: { stacks_defined: ['cflinuxfs3', 'cflinuxfs4'] },
    }));
    await component.importFrom(exportFile('next.json', {
      ...sampleExport(), composition: { stacks_defined: ['cflinuxfs4', 'windows'] },
    }));
    fixture.detectChanges();
    await fixture.whenStable();
    const list = component.listVms().find(l => l.key === 'stacks_defined');
    expect(list?.rows.find(r => r.label === 'windows')?.cells).toEqual(['absent', 'added']);
    expect(list?.rows.find(r => r.label === 'cflinuxfs3')?.cells).toEqual(['present', 'removed']);
    expect(list?.rows.find(r => r.label === 'cflinuxfs4')?.cells).toEqual(['present', 'present']);
  });

  it('marks a side that never measured a list as unmeasured, not empty', async () => {
    component.toggleLive('cf-1'); // live section without measured ecosystem
    await component.importFrom(exportFile('file.json', {
      ...sampleExport(), composition: { stacks_defined: ['cflinuxfs4'] },
    }));
    fixture.detectChanges();
    await fixture.whenStable();
    const list = component.listVms().find(l => l.key === 'stacks_defined');
    expect(list?.rows.find(r => r.label === 'cflinuxfs4')?.cells[0]).toBe('unmeasured');
  });

  it('folds measured ecosystem data of a live section into its side', async () => {
    measure.ecosystem.set(new Map([
      ['cf-1', { stacksDefined: ['cflinuxfs4'], buildpacksDefined: ['ruby_buildpack'], fetchedAt: new Date() }],
    ]));
    component.toggleLive('cf-1');
    component.toggleLive('cf-2');
    fixture.detectChanges();
    await fixture.whenStable();
    const list = component.listVms().find(l => l.key === 'stacks_defined');
    expect(list?.measured).toEqual([true, false]);
    expect(list?.rows.find(r => r.label === 'cflinuxfs4')?.cells[0]).toBe('present');
  });
});
