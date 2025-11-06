import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule } from '@stratosui/store/testing';

import { CoreTestingModule } from '../../../../test-framework/core-test.modules';
import { CoreModule } from '../../../core/core.module';
import { RecentEntitiesComponent } from './recent-entities.component';

describe('RecentEntitiesComponent', () => {
  let component: RecentEntitiesComponent;
  let fixture: ComponentFixture<RecentEntitiesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        CoreModule,
        CommonModule,
        CoreTestingModule,
        createBasicStoreModule()
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecentEntitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
