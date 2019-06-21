import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { TabNavService } from '../../../../../tab-nav.service';
import { createBasicStoreModule } from '../../../../../test-framework/store-test-helper';
import { CoreModule } from '../../../../core/core.module';
import { SharedModule } from '../../../../shared/shared.module';
import { CreateEndpointBaseStepComponent } from './create-endpoint-base-step.component';

describe('CreateEndpointBaseStepComponent', () => {
  let component: CreateEndpointBaseStepComponent;
  let fixture: ComponentFixture<CreateEndpointBaseStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CreateEndpointBaseStepComponent,
      ],
      imports: [
        CoreModule,
        SharedModule,
        RouterTestingModule,
        createBasicStoreModule(),
        NoopAnimationsModule
      ],
      providers: [{
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            queryParams: {},
            params: { type: 'metrics' }
          }
        }
      }, TabNavService],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateEndpointBaseStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
