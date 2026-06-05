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
});
