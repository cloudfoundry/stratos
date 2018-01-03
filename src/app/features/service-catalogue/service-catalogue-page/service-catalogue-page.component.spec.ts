import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceCataloguePageComponent } from './service-catalogue-page.component';

describe('ServiceCataloguePageComponent', () => {
  let component: ServiceCataloguePageComponent;
  let fixture: ComponentFixture<ServiceCataloguePageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ServiceCataloguePageComponent ]
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
