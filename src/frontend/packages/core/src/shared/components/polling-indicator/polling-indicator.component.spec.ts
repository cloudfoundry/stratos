import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { CoreModule } from '../../../core/core.module';
import { PollingIndicatorComponent } from './polling-indicator.component';


describe('PollingIndicatorComponent', () => {
  let component: PollingIndicatorComponent;
  let fixture: ComponentFixture<PollingIndicatorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        PollingIndicatorComponent,
        CoreModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PollingIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
