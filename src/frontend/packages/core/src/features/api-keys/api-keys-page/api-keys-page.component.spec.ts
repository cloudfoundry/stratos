import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ApiKeysPageComponent } from './api-keys-page.component';

describe('ApiKeysPageComponent', () => {
  let component: ApiKeysPageComponent;
  let fixture: ComponentFixture<ApiKeysPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ApiKeysPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApiKeysPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
