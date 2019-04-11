import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardAutoscalerDefaultComponent } from './card-autoscaler-default.component';
import { CoreModule } from '../../../core/core.module';
import { ApplicationService } from '../../../features/applications/application.service';
import { ApplicationServiceMock } from '../../../test-framework/application-service-helper';
import { createBasicStoreModule } from '../../../../../test-framework/store-test-helper';
import { ApplicationStateService } from '../../application-state/application-state.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { MetadataItemComponent } from '../../metadata-item/metadata-item.component';

describe('CardAutoscalerDefaultComponent', () => {
  let component: CardAutoscalerDefaultComponent;
  let fixture: ComponentFixture<CardAutoscalerDefaultComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CardAutoscalerDefaultComponent,
        MetadataItemComponent,
      ],
      imports: [
        CoreModule,
        CommonModule,
        BrowserAnimationsModule,
        createBasicStoreModule()
      ],
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        ApplicationStateService,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardAutoscalerDefaultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
