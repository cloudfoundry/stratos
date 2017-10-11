import { it } from '@angular/cli/lib/ast-tools/spec-utils';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MDAppModule } from '../../../core/md.module';
import { StatefulIconComponent } from './stateful-icon.component';

describe('StatefulIconComponent', () => {
  let component: StatefulIconComponent;
  let fixture: ComponentFixture<StatefulIconComponent>;

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
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
