import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SessionService } from 'frontend/packages/core/src/shared/services/session.service';
import { createBasicStoreModule } from '@stratosui/store/testing';
import { CreateEndpointHelperComponent } from './create-endpoint-helper.component';
import { CoreTestingModule } from '../../../../../test-framework/core-test.modules';

describe('CreateEndpointHelperComponent', () => {
  let component: CreateEndpointHelperComponent;
  let fixture: ComponentFixture<CreateEndpointHelperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateEndpointHelperComponent ],
      imports: [
        CoreTestingModule,
        createBasicStoreModule(),
      ],
      providers: [ SessionService ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateEndpointHelperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
