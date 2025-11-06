import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { TabNavService } from '../../../../../core/src/tab-nav.service';
import { CFBaseTestModules } from '../../../../test-framework/cf-test-helper';
import { AddSpaceComponent } from './add-space.component';
import { CreateSpaceStepComponent } from './create-space-step/create-space-step.component';

describe('AddSpaceComponent', () => {
  let component: AddSpaceComponent;
  let fixture: ComponentFixture<AddSpaceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddSpaceComponent, CreateSpaceStepComponent],
      imports: [
        ...CFBaseTestModules,
      ],
      providers: [TabNavService]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddSpaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
