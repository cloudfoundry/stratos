import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../../../core/src/core/core.module';
import { ListConfig } from '../../../../../../core/src/shared/components/list/list.component.types';
import { SharedModule } from '../../../../../../core/src/shared/shared.module';
import { ApplicationServiceMock } from '../../../../../test-framework/application-service-helper';
import { generateCfStoreModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ApplicationService } from '../../application.service';
import { MapRoutesComponent } from './map-routes.component';

describe('MapRoutesComponent', () => {
  let component: MapRoutesComponent;
  let fixture: ComponentFixture<MapRoutesComponent>;

  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        declarations: [MapRoutesComponent],
        providers: [
          ListConfig,
          { provide: ApplicationService, useClass: ApplicationServiceMock },
          DatePipe
        ],
        imports: [
          ...generateCfStoreModules(),
          CoreModule,
          SharedModule,
          NoopAnimationsModule,
          RouterTestingModule
        ]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(MapRoutesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
