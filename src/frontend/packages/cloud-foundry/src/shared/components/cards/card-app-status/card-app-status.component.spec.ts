import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CoreModule } from '../../../../../../core/src/core/core.module';
import {
  ApplicationStateIconComponent,
} from '../../../../../../core/src/shared/components/application-state/application-state-icon/application-state-icon.component';
import {
  ApplicationStateIconPipe,
} from '../../../../../../core/src/shared/components/application-state/application-state-icon/application-state-icon.pipe';
import {
  ApplicationStateComponent,
} from '../../../../../../core/src/shared/components/application-state/application-state.component';
import { CardStatusComponent } from '../../../../../../core/src/shared/components/cards/card-status/card-status.component';
import { ApplicationServiceMock } from '../../../../../test-framework/application-service-helper';
import { ApplicationService } from '../../../../features/applications/application.service';
import { CardAppStatusComponent } from './card-app-status.component';

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
