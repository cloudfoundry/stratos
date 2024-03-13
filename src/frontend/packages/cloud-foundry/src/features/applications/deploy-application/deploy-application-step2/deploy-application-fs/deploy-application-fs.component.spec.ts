import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../../../../core/src/core/core.module';
import { SharedModule } from '../../../../../../../core/src/shared/shared.module';
import { generateCfStoreModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { DeployApplicationFsComponent } from './deploy-application-fs.component';

describe('DeployApplicationFsComponent', () => {
  let component: DeployApplicationFsComponent;
  let fixture: ComponentFixture<DeployApplicationFsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [DeployApplicationFsComponent],
      imports: [
        ...generateCfStoreModules(),
        CoreModule,
        SharedModule,
        RouterTestingModule,
        NoopAnimationsModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeployApplicationFsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
