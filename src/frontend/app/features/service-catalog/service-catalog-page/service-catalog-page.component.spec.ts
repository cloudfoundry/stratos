import { CoreModule } from '../../../core/core.module';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { appReducers } from '../../../store/reducers.module';
import { SharedModule } from '../../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceCatalogPageComponent } from './service-catalog-page.component';
import { createBasicStoreModule } from '../../../test-framework/store-test-helper';

describe('ServiceCatalogPageComponent', () => {
  let component: ServiceCatalogPageComponent;
  let fixture: ComponentFixture<ServiceCatalogPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        RouterTestingModule,
        BrowserAnimationsModule,
        createBasicStoreModule()
      ],
      declarations: [ServiceCatalogPageComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceCatalogPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
