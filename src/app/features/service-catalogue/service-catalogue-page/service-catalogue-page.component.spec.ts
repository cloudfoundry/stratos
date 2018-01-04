import { CoreModule } from '../../../core/core.module';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { appReducers } from '../../../store/reducers.module';
import { SharedModule } from '../../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceCataloguePageComponent } from './service-catalogue-page.component';

describe('ServiceCataloguePageComponent', () => {
  let component: ServiceCataloguePageComponent;
  let fixture: ComponentFixture<ServiceCataloguePageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        RouterTestingModule,
        BrowserAnimationsModule,
        StoreModule.forRoot(
          appReducers
        )
      ],
      declarations: [ServiceCataloguePageComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceCataloguePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
