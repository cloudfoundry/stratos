import { RouterTestingModule } from '@angular/router/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CfEndpointCardComponent } from './endpoint-card.component';
import { SharedModule } from '../../../../../shared.module';

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
      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
