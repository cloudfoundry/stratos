import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UserAvatarComponent } from './user-avatar.component';
import { MDAppModule } from '../../../core/md.module';

describe('UserAvatarComponent', () => {
  let component: UserAvatarComponent;
  let fixture: ComponentFixture<UserAvatarComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ UserAvatarComponent ],
      imports: [
        MDAppModule,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserAvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
