import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CoreModule } from '../../../../../core/src/core/core.module';
import { SharedModule } from '../../../../../core/src/shared/shared.module';
import { GitEndpointDetailsComponent } from './git-endpoint-details.component';

describe('GitEndpointDetailsComponent', () => {
  let component: GitEndpointDetailsComponent;
  let fixture: ComponentFixture<GitEndpointDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [GitEndpointDetailsComponent],
      imports: [
        CoreModule,
        SharedModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GitEndpointDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
