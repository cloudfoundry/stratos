import { SharedModule } from '../../../../shared/shared.module';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateEndpointCfStep2Component } from './create-endpoint-cf-step-2.component';
import { CoreModule } from '../../../../core/core.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { createBasicStoreModule } from '../../../../test-framework/store-test-helper';

describe('CreateEndpointCfStep2Component', () => {
  let component: CreateEndpointCfStep2Component;
  let fixture: ComponentFixture<CreateEndpointCfStep2Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreateEndpointCfStep2Component],
      imports: [
        CoreModule,
        SharedModule,
        createBasicStoreModule(),
        NoopAnimationsModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateEndpointCfStep2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
