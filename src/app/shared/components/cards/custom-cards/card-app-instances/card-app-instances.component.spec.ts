import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardAppInstancesComponent } from './card-app-instances.component';
import { CardStatusComponent } from '../../../card-status/card-status.component';
import { ApplicationStateComponent } from '../../../application-state/application-state.component';
import { ApplicationStateIconComponent } from '../../../application-state/application-state-icon/application-state-icon.component';
import { ApplicationStateIconPipe } from '../../../application-state/application-state-icon/application-state-icon.pipe';
import { CoreModule } from '../../../../../core/core.module';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { ApplicationServiceMock } from '../../../../../test-framework/application-service-helper';

describe('CardAppInstancesComponent', () => {
  let component: CardAppInstancesComponent;
  let fixture: ComponentFixture<CardAppInstancesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CardAppInstancesComponent,
        CardStatusComponent,
        ApplicationStateComponent,
        ApplicationStateIconComponent,
        ApplicationStateIconPipe,
      ],
      imports: [
        CoreModule
      ],
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock },
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardAppInstancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
