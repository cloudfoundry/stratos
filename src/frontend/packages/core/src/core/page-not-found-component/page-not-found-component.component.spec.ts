import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';

import { PageNotFoundComponentComponent } from './page-not-found-component.component';
import { CoreModule } from '../core.module';
import { SharedModule } from '../../shared/shared.module';

describe('PageNotFoundComponentComponent', () => {
  let component: PageNotFoundComponentComponent;
  let fixture: ComponentFixture<PageNotFoundComponentComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PageNotFoundComponentComponent ],
      imports: [ MatIconModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PageNotFoundComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
