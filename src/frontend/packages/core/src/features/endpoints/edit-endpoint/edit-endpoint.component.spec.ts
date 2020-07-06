import { CommonModule } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { createBasicStoreModule } from '../../../../../store/testing/public-api';
import { TabNavService } from '../../../../tab-nav.service';
import { CoreTestingModule } from '../../../../test-framework/core-test.modules';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { EditEndpointStepComponent } from './edit-endpoint-step/edit-endpoint-step.component';
import { EditEndpointComponent } from './edit-endpoint.component';

describe('EditEndpointComponent', () => {
  let component: EditEndpointComponent;
  let fixture: ComponentFixture<EditEndpointComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EditEndpointComponent, EditEndpointStepComponent],
      imports: [
        CoreTestingModule,
        createBasicStoreModule(),
        CommonModule,
        CoreModule,
        SharedModule,
        RouterTestingModule,
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: { id: 'guid' },
              queryParams: { breadcrumbs: '' }
            }
          }
        },
        TabNavService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditEndpointComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
