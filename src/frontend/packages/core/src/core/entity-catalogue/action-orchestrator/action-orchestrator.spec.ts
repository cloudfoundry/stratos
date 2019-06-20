import { ActionOrchestrator } from "./action-orchestrator";

fdescribe('ActionOrchestrator', () => {
  it('should not have action builds', () => {
    const actionOrchestrator = new ActionOrchestrator('Empty');
    expect(actionOrchestrator.hasActionBuilder('get')).toBe(false);
    expect(actionOrchestrator.hasActionBuilder('delete')).toBe(false);
    expect(actionOrchestrator.hasActionBuilder('update')).toBe(false);
    expect(actionOrchestrator.hasActionBuilder('create')).toBe(false);
    expect(actionOrchestrator.hasActionBuilder('getAll')).toBe(false);
    expect(actionOrchestrator.hasActionBuilder('myMadeUpAction1')).toBe(false);
    expect(actionOrchestrator.hasActionBuilder('myMadeUpAction2')).toBe(false);
  });
});
