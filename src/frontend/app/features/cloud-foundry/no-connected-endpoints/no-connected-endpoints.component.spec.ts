import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { getBaseTestModules } from '../../../test-framework/cloud-foundry-endpoint-service.helper';
import { NoConnectedEndpointsComponent } from './no-connected-endpoints.component';

describe('NoConnectedEndpointsComponent', () => {
  let component: NoConnectedEndpointsComponent;
  let fixture: ComponentFixture<NoConnectedEndpointsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NoConnectedEndpointsComponent],
      imports: [...getBaseTestModules]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NoConnectedEndpointsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
