import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SshApplicationComponent } from './ssh-application.component';
import { SharedModule } from '../../../shared/shared.module';
import { CoreModule } from '../../../core/core.module';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule } from '../../../test-framework/store-test-helper';
import { ApplicationService } from '../application.service';
import { ApplicationServiceMock } from '../../../test-framework/application-service-helper';

describe('SshApplicationComponent', () => {
  let component: SshApplicationComponent;
  let fixture: ComponentFixture<SshApplicationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SshApplicationComponent ],
      imports: [
        CoreModule,
        SharedModule,
        RouterTestingModule,
        createBasicStoreModule()
      ],
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock },
      ]
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
