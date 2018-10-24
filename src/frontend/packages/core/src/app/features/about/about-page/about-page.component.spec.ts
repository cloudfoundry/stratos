import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutPageComponent } from './about-page.component';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { createBasicStoreModule } from '../../../test-framework/store-test-helper';
import { RouterTestingModule } from '@angular/router/testing';

describe('AboutPageComponent', () => {
  let component: AboutPageComponent;
  let fixture: ComponentFixture<AboutPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AboutPageComponent ],
      imports: [
        CoreModule,
        RouterTestingModule,
        SharedModule,
        createBasicStoreModule(),
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AboutPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
