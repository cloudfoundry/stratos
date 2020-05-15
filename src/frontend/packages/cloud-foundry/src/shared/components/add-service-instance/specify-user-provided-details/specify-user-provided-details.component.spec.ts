import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  CloudFoundryUserProvidedServicesService,
} from '../../../../../../core/src/shared/services/cloud-foundry-user-provided-services.service';
import { generateCfBaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CsiModeService } from '../csi-mode.service';
import { SpecifyUserProvidedDetailsComponent } from './specify-user-provided-details.component';

describe('SpecifyUserProvidedDetailsComponent', () => {
  let component: SpecifyUserProvidedDetailsComponent;
  let fixture: ComponentFixture<SpecifyUserProvidedDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SpecifyUserProvidedDetailsComponent],
      imports: [
        ...generateCfBaseTestModules(),
        HttpClientModule,
        HttpClientTestingModule
      ],
      providers: [
        CsiModeService,
        CloudFoundryUserProvidedServicesService,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpecifyUserProvidedDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
