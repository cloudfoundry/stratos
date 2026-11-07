import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';
import { RecentlyVisitedDataService } from '@stratosui/store';
import { createBasicStoreModule } from "@test-framework/core-test.helper";

import { CoreTestingModule } from "@test-framework/core-test.modules";
import { CoreModule } from '../../../core/core.module';
import { FreshEntityNameService } from '../../../core/signals/fresh-entity-name.service';
import { RecentEntitiesComponent } from './recent-entities.component';

describe('RecentEntitiesComponent', () => {
  let component: RecentEntitiesComponent;
  let fixture: ComponentFixture<RecentEntitiesComponent>;
  let freshName: string | null;
  let recents: RecentlyVisitedDataService;

  beforeEach(() => {
    freshName = null;
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: FreshEntityNameService, useValue: { freshNameFor: () => freshName } },
      ],
      imports: [
        RouterTestingModule,
        CoreModule,
        CommonModule,
        CoreTestingModule,
        createBasicStoreModule(),
      ]
    });
    TestBed.compileComponents();
    recents = TestBed.inject(RecentlyVisitedDataService);
    fixture = TestBed.createComponent(RecentEntitiesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('writes back the fresh name when a recent has been renamed', () => {
    recents.add({
      guid: 'app1', date: 1, entityType: 'application', endpointType: 'cf', entityId: 'app1',
      name: 'old app', routerLink: '/x', prettyType: 'Application', endpointId: 'ep1', metadata: { name: 'old app' },
    } as any);
    freshName = 'renamed app';
    fixture.detectChanges();
    expect(recents.state()['app1'].name).toBe('renamed app');
  });

  it('leaves the stored name when no fresh name is available', () => {
    recents.add({
      guid: 'app1', date: 1, entityType: 'application', endpointType: 'cf', entityId: 'app1',
      name: 'old app', routerLink: '/x', prettyType: 'Application', endpointId: 'ep1', metadata: { name: 'old app' },
    } as any);
    freshName = null;
    fixture.detectChanges();
    expect(recents.state()['app1'].name).toBe('old app');
  });

  // Each row was a div with a routerLink, which the keyboard cannot reach
  // (WCAG 2.1.1); the row is the link, with no anchor nested inside it.
  it('renders a recent entity with a route as a link to its page', async () => {
    recents.add({
      guid: 'app1', date: 1, entityType: 'application', endpointType: 'cf', entityId: 'app1',
      name: 'old app', routerLink: '/x', prettyType: 'Application', endpointId: 'ep1', metadata: { name: 'old app' },
    } as any);
    fixture.detectChanges();
    await fixture.whenStable();
    const row = fixture.nativeElement.querySelector('.recent-entity') as HTMLElement;
    expect(row.tagName).toBe('A');
    expect(row.getAttribute('href')).toBe('/x');
    expect(row.textContent).toContain('old app');
    expect(row.querySelector('a')).toBeNull();
  });

  // #4166: the entity type line was body text at opacity 0.6 (4.04:1 in light mode).
  it('shows the entity type in the muted text color', async () => {
    recents.add({
      guid: 'app1', date: 1, entityType: 'application', endpointType: 'cf', entityId: 'app1',
      name: 'old app', routerLink: '/x', prettyType: 'Application', endpointId: 'ep1', metadata: { name: 'old app' },
    } as any);
    fixture.detectChanges();
    await fixture.whenStable();
    const typeInfo = fixture.nativeElement.querySelector('.type-info') as HTMLElement;
    expect(typeInfo).toBeTruthy();
    expect(typeInfo.classList).toContain('text-content-muted');
  });
});
