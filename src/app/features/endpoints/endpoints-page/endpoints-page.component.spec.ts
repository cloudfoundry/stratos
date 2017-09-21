import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { cnsisReducer } from '../../../store/reducers/cnsis.reducer';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MDAppModule } from './../../md/md.module';

import { EndpointsPageComponent } from './endpoints-page.component';

describe('EndpointsPageComponent', () => {
  let component: EndpointsPageComponent;
  let fixture: ComponentFixture<EndpointsPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EndpointsPageComponent ],
      imports: [
        RouterTestingModule,
        StoreModule.forRoot({
          cnsis: cnsisReducer
        }),
        MDAppModule
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EndpointsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
