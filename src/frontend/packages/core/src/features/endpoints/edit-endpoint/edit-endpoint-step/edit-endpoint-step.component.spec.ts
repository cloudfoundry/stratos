import { CommonModule } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { createBasicStoreModule } from '../../../../../../store/testing/public-api';
import { CoreTestingModule } from '../../../../../test-framework/core-test.modules';
import { CoreModule } from '../../../../core/core.module';
import { SharedModule } from './../../../../shared/shared.module';
import { EditEndpointStepComponent } from './edit-endpoint-step.component';

describe('EditEndpointStepComponent', () => {
  let component: EditEndpointStepComponent;
  let fixture: ComponentFixture<EditEndpointStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EditEndpointStepComponent],
      imports: [
        CoreTestingModule,
        createBasicStoreModule(),
        CommonModule,
        CoreModule,
        SharedModule,
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: { id: 'guid' }
            }
          }
        },
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditEndpointStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterAll(() => {
    component.ngOnDestroy();
  });
});
