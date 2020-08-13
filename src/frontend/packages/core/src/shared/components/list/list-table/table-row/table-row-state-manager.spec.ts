import { tap, skip } from 'rxjs/operators';
import { RowsState, RowState } from '../../data-sources-controllers/list-data-source-types';
import { Observable, Subscription } from 'rxjs';
import { async } from '@angular/core/testing';
import { TableRowStateManager } from './table-row-state-manager';


describe('TableRowStateManager', () => {
  let sub: Subscription;
  let stateManager: TableRowStateManager;
  let obs: Observable<RowsState>;
  const checkState = (manager: TableRowStateManager, actualState: RowState, expectedState: RowState) => {
    const fake = {
      FAKE: {
        error: false
      }
    };
    expect(actualState).toEqual(expectedState);
    expect(stateManager.rowState).toEqual(expectedState);
    expect(actualState).not.toEqual(fake);
    expect(stateManager.rowState).not.toEqual(fake);
  };
  beforeEach(async(() => {
    stateManager = new TableRowStateManager();
    obs = stateManager.observable;
    if (sub) {
      sub.unsubscribe();
    }
  }));


  it('should init the state', async(() => {
    const initState = {
      1: {
        error: true
      },
      2: {
        error: false,
        blocked: true
      }
    };

    stateManager = new TableRowStateManager(initState);
    obs = stateManager.observable;

    sub = obs.pipe(
      tap(state => {
        checkState(stateManager, state, initState);
      })
    ).subscribe();
  }));
  it('should update the row state', async(() => {
    const initState = {
      1: {
        error: true,
        customProp: 'custom'
      },
      2: {
        error: false,
        blocked: true,
        customprop: 'nah'
      }
    };
    const updateState = {
      error: false,
      blocked: true,
      customProp1: 'customed'
    };
    const expectedState = {
      1: {
        error: false,
        blocked: true,
        customProp: 'custom',
        customProp1: 'customed'
      },
      2: {
        error: false,
        blocked: true,
        customprop: 'nah'
      }
    };

    stateManager = new TableRowStateManager(initState);
    obs = stateManager.observable;
    sub = obs.pipe(
      skip(1),
      tap(state => {
        checkState(stateManager, state, expectedState);
      })
    ).subscribe();
    stateManager.updateRowState('1', updateState);
  }));
  it('should update the state', async(() => {
    const initState = {
      1: {
        error: true,
        customProp: 'custom'
      },
      2: {
        error: false,
        blocked: true
      }
    };
    const updateState = {
      1: {
        error: false,
        blocked: true
      },
      2: {
        blocked: false
      }
    };
    const expectedState = {
      1: {
        error: false,
        blocked: true,
        customProp: 'custom'
      },
      2: {
        blocked: false,
        error: false
      }
    };

    stateManager = new TableRowStateManager(initState);
    obs = stateManager.observable;
    sub = obs.pipe(
      skip(1),
      tap(state => {
        checkState(stateManager, state, expectedState);
      }),
    ).subscribe();
    stateManager.updateState(updateState);
  }));

  it('should set the state', async(() => {
    const initState = {
      1: {
        error: true,
        customProp: 'custom'
      },
      2: {
        error: false,
        blocked: true
      }
    };
    const setState = {
      1: {
        error: false,
        blocked: true
      },
      2: {
        blocked: false
      }
    };

    stateManager = new TableRowStateManager(initState);
    obs = stateManager.observable;
    sub = obs.pipe(
      skip(1),
      tap(state => {
        checkState(stateManager, state, setState);
      }),
    ).subscribe();
    stateManager.setState(setState);
  }));

  it('should set the row state', async((done) => {
    const initState = {
      1: {
        error: true,
        customProp: 'custom'
      },
      2: {
        error: false,
        blocked: true
      }
    };
    const setState = {
      error: false,
      blocked: true,
      cusrtomProp2: 'test123'
    };
    const expectedState = {
      1: {
        error: false,
        blocked: true,
        cusrtomProp2: 'test123'
      },
      2: {
        error: false,
        blocked: true
      }
    };

    stateManager = new TableRowStateManager(initState);
    obs = stateManager.observable;
    sub = obs.pipe(
      skip(1),
      tap(state => {
        checkState(stateManager, state, expectedState);
      }),
    ).subscribe();
    stateManager.setRowState('1', setState);
  }));
});
