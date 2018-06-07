import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { SharedModule } from '../../../../../shared.module';
import { CfEndpointCardComponent } from './endpoint-card.component';

describe('EndpointCardComponent', () => {
  let component: CfEndpointCardComponent;
  let fixture: ComponentFixture<CfEndpointCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        SharedModule,
        RouterTestingModule,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CfEndpointCardComponent);
    component = fixture.componentInstance;
    component.row = {
      name: 'test',
      user: {
        admin: false,
        name: '',
        guid: '',
      },
      metricsAvailable: false,
      system_shared_token: false,
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
