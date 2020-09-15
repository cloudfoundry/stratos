import { CommonModule } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../../core/src/core/core.module';
import { SharedModule } from '../../../../../core/src/shared/shared.module';
import { TabNavService } from '../../../../../core/src/tab-nav.service';
import { generateCfStoreModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CfEndpointsMissingComponent } from '../../../shared/components/cf-endpoints-missing/cf-endpoints-missing.component';
import { CloudFoundryService } from '../../../shared/data-services/cloud-foundry.service';
import { ServiceCatalogPageComponent } from './service-catalog-page.component';

describe('ServiceCatalogPageComponent', () => {
  let component: ServiceCatalogPageComponent;
  let fixture: ComponentFixture<ServiceCatalogPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        RouterTestingModule,
        NoopAnimationsModule,
        generateCfStoreModules()
      ],
      declarations: [
        ServiceCatalogPageComponent,
        CfEndpointsMissingComponent
      ],
      providers: [
        TabNavService,
        CloudFoundryService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceCatalogPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
