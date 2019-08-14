import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../../core/src/core/core.module';
import { SharedModule } from '../../../../../core/src/shared/shared.module';
import { generateCfStoreModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundryService } from '../../data-services/cloud-foundry.service';
import { CfEndpointsMissingComponent } from './cf-endpoints-missing.component';


describe('CfEndpointsMissingComponent', () => {
  let component: CfEndpointsMissingComponent;
  let fixture: ComponentFixture<CfEndpointsMissingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CfEndpointsMissingComponent],
      imports: [
        ...generateCfStoreModules(),
        CoreModule,
        SharedModule,
        RouterTestingModule
      ],
      providers: [
        CloudFoundryService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CfEndpointsMissingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
