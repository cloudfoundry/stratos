import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardAppStatusComponent } from './card-app-status.component';
import { CardStatusComponent } from '../../../card-status/card-status.component';
import { CoreModule } from '../../../../../core/core.module';
import { ApplicationStateIconComponent } from '../../../application-state/application-state-icon/application-state-icon.component';
import { ApplicationStateIconPipe } from '../../../application-state/application-state-icon/application-state-icon.pipe';
import { ApplicationStateComponent } from '../../../application-state/application-state.component';
import { ApplicationStateService } from '../../../application-state/application-state.service';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { ApplicationServiceMock } from '../../../../../test-framework/application-service-helper';

describe('CardAppStatusComponent', () => {
  let component: CardAppStatusComponent;
  let fixture: ComponentFixture<CardAppStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CardAppStatusComponent,
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
    fixture = TestBed.createComponent(CardAppStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
