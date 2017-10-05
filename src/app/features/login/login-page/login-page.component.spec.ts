import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { MDAppModule } from '../../../core/md.module';
import { authReducer } from '../../../store/reducers/auth.reducer';
import { cnsisReducer } from '../../../store/reducers/cnsis.reducer';
import { LoginPageComponent } from './login-page.component';

describe('LoginPageComponent', () => {
  let component: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [LoginPageComponent],
      imports: [
        RouterTestingModule,
        FormsModule,
        ReactiveFormsModule,
        MDAppModule,
        StoreModule.forRoot({
          auth: authReducer,
          cnsis: cnsisReducer
        })
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
