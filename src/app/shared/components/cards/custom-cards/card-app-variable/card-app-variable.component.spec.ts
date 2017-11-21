import { CoreModule } from '../../../../../core/core.module';
import { it } from '@angular/cli/lib/ast-tools/spec-utils';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardAppVariableComponent } from './card-app-variable.component';
import { AppEnvVar } from '../../../../data-sources/cf-app-variables-data-source';

describe('CardAppVariableComponent', () => {
  let component: CardAppVariableComponent;
  let fixture: ComponentFixture<CardAppVariableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CardAppVariableComponent
      ],
      imports: [
        CoreModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardAppVariableComponent);
    component = fixture.componentInstance;
    component.row = {

    } as AppEnvVar;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
