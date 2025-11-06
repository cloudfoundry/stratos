import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { CoreModule } from '../../../../../core/src/core/core.module';
import { SharedModule } from '../../../../../core/src/shared/shared.module';
import { CfEndpointDetailsComponent } from './cf-endpoint-details.component';

describe('CfEndpointDetailsComponent', () => {
  let component: CfEndpointDetailsComponent;
  let fixture: ComponentFixture<CfEndpointDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CfEndpointDetailsComponent],
      imports: [
        CoreModule,
        SharedModule
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CfEndpointDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
