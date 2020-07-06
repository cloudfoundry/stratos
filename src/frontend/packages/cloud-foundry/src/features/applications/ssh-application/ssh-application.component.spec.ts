import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../../core/src/core/core.module';
import { SharedModule } from '../../../../../core/src/shared/shared.module';
import { TabNavService } from '../../../../../core/tab-nav.service';
import { ApplicationServiceMock } from '../../../../test-framework/application-service-helper';
import { generateCfStoreModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ApplicationService } from '../application.service';
import { SshApplicationComponent } from './ssh-application.component';

describe('SshApplicationComponent', () => {
  let component: SshApplicationComponent;
  let fixture: ComponentFixture<SshApplicationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SshApplicationComponent],
      imports: [
        CoreModule,
        SharedModule,
        RouterTestingModule,
        generateCfStoreModules()
      ],
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        TabNavService
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SshApplicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
