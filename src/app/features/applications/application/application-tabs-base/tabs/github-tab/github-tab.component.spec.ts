import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GithubTabComponent } from './github-tab.component';

describe('GithubTabComponent', () => {
  let component: GithubTabComponent;
  let fixture: ComponentFixture<GithubTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GithubTabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GithubTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
