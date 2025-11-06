import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { AcmeSupportInfoComponent } from './acme-support-info.component';
import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';

describe('AcmeSupportInfoComponent', () => {
  let component: AcmeSupportInfoComponent;
  let fixture: ComponentFixture<AcmeSupportInfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ AcmeSupportInfoComponent ],
      imports: [
        CoreModule,
        SharedModule
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AcmeSupportInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
