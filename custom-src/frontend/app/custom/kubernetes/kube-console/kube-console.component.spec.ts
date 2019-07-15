import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { TabNavService } from '../../../../tab-nav.service';
import { ApplicationServiceMock } from '../../../../test-framework/application-service-helper';
import { createBasicStoreModule } from '../../../../test-framework/store-test-helper';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { KubeConsoleComponent } from './kube-console.component';

describe('KubeConsoleComponent', () => {
  let component: KubeConsoleComponent;
  let fixture: ComponentFixture<KubeConsoleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubeConsoleComponent],
      imports: [
        CoreModule,
        SharedModule,
        RouterTestingModule,
        createBasicStoreModule()
      ],
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        TabNavService
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeConsoleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
