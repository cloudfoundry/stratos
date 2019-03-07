import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CoreModule } from '../../../../../../core/core.module';
import { SharedModule } from '../../../../../shared.module';
import { CfEndpointDetailsComponent } from './cf-endpoint-details.component';

describe('CfEndpointDetailsComponent', () => {
  let component: CfEndpointDetailsComponent;
  let fixture: ComponentFixture<CfEndpointDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [
        CoreModule,
        SharedModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CfEndpointDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
