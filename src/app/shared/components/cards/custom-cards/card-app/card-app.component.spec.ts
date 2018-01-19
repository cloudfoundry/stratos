import { ApplicationStateComponent } from '../../../application-state/application-state.component';
import {
    ApplicationStateIconComponent,
} from '../../../application-state/application-state-icon/application-state-icon.component';
import { ApplicationStateIconPipe } from '../../../application-state/application-state-icon/application-state-icon.pipe';
import { CoreModule } from '../../../../../core/core.module';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';
import { createBasicStoreModule } from '../../../../../test-framework/store-test-helper';
import { ApplicationStateService } from '../../../../../shared/components/application-state/application-state.service';

import { CardAppComponent } from './card-app.component';
import { RouterTestingModule } from '@angular/router/testing';
import { APIResourceMetadata } from '../../../../../store/types/api.types';
import { CardStatusComponent } from '../../../card-status/card-status.component';

describe('CardAppComponent', () => {
  let component: CardAppComponent;
  let fixture: ComponentFixture<CardAppComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CardAppComponent,
        CardStatusComponent,
        ApplicationStateComponent,
        ApplicationStateIconComponent,
        ApplicationStateIconPipe,
      ],
      imports: [
        CoreModule,
        RouterTestingModule,
        createBasicStoreModule()
      ],
      providers: [
        ApplicationStateService,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardAppComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        state: ''
      },
      metadata: {} as APIResourceMetadata,
    };
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
