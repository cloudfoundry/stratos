import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFoundryPageComponent } from './cloud-foundry-page.component';

describe('CloudFoundryPageComponent', () => {
  let component: CloudFoundryPageComponent;
  let fixture: ComponentFixture<CloudFoundryPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CloudFoundryPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
