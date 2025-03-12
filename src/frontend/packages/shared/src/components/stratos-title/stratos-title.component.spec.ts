import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { StratosTitleComponent } from './stratos-title.component';

describe('StratosTitleComponent', () => {
  let component: StratosTitleComponent;
  let fixture: ComponentFixture<StratosTitleComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    declarations: [StratosTitleComponent],
    teardown: { destroyAfterEach: false }
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StratosTitleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
