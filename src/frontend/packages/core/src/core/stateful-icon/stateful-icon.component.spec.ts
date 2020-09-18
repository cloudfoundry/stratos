import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StratosStatus } from '../../../../store/src/types/shared.types';
import { MDAppModule } from '../md.module';
import { StatefulIconComponent } from './stateful-icon.component';

describe('StatefulIconComponent', () => {
  let component: StatefulIconComponent;
  let fixture: ComponentFixture<StatefulIconComponent>;
  let element: HTMLElement;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [StatefulIconComponent],
      imports: [
        MDAppModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StatefulIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    element = fixture.nativeElement;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should icon based on state key', () => {
    component.state = StratosStatus.OK;
    fixture.detectChanges();

    expect(element.textContent).toContain('done');
  });

  it('should show spinner if state key is busy', () => {
    component.state = StratosStatus.BUSY;
    fixture.detectChanges();

    expect(element.querySelector('mat-spinner')).toBeTruthy();
  });
});
