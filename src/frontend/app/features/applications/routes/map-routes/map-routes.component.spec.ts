import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../core/core.module';
import { ListConfig } from '../../../../shared/components/list/list.component.types';
import { SharedModule } from '../../../../shared/shared.module';
import { ApplicationServiceMock } from '../../../../test-framework/application-service-helper';
import { createBasicStoreModule } from '../../../../test-framework/store-test-helper';
import { ApplicationService } from '../../application.service';
import { MapRoutesComponent } from './map-routes.component';

describe('MapRoutesComponent', () => {
  let component: MapRoutesComponent;
  let fixture: ComponentFixture<MapRoutesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapRoutesComponent ],
      providers: [
        ListConfig,
        { provide: ApplicationService, useClass: ApplicationServiceMock }

      ],
      imports: [
        CoreModule,
        SharedModule,
        createBasicStoreModule(),
        RouterTestingModule
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapRoutesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
