import { AddParams, SetParams } from './actions/pagination.actions';

export enum QParamJoiners {
  greaterThanOrEqual = '>=',
  lessThanOrEqual = '<=',
  lessThan = '<',
  greaterThan = '>',
  in = ' IN ',
  colon = ':',
  equal = '='
}

export class QParam {
  static fromString(qString: string) {
    const qParamComponents = Object.values(QParamJoiners).reduce((split, joiner) => {
      if (split) {
        return split;
      }
      const testSplit = qString.split(joiner);
      if (testSplit.length === 3) {
        split = testSplit;
      }
    }, null as []);
    if (qParamComponents && qParamComponents.length === 3) {
      return new QParam(
        qParamComponents[0],
        qParamComponents[2],
        qParamComponents[1]
      );
    }
    return null;
  }

  static fromStrings(qStrings: string[]) {
    return qStrings.map(qString => QParam.fromString(qString));
  }

  static keyFromString(qParamString: string): string {
    const match = qParamString.match(/(>=|<=|<|>| IN |,|:|=)/);
    return match.index >= 0 ? qParamString.substring(0, match.index) : null;
  }

  constructor(
    public key: string,
    public value: string | string[],
    public joiner: QParamJoiners = QParamJoiners.equal
  ) { }
  public toString() {
    return `${this.key}${this.joiner}${(this.value as string[]).join ? (this.value as string[]).join(',') : this.value}`;
  }
}
// TODO This isn't being used but there are some commented out with todo that need to be looked into.
export function getUniqueQParams(action: AddParams | SetParams, state) {
  let qStatePrams: QParam[] = [].concat(state.params.q || []);
  const qActionPrams: QParam[] = [].concat(action.params.q || []);

  // Update existing q params
  for (const actionParam of qActionPrams) {
    const existingParamIndex = qStatePrams.findIndex((stateParam: QParam) => stateParam.key === actionParam.key);
    if (existingParamIndex >= 0) {
      qStatePrams[existingParamIndex] = { ...actionParam };
    } else {
      qStatePrams.push(actionParam);
    }
  }

  //  Ensure q params are unique
  if (action.params.q) {
    qStatePrams = qStatePrams.concat(qActionPrams)
      .filter((q, index, self) => self.findIndex(
        (qs) => {
          return qs.key === q.key;
        }
      ) === index)
      .filter((q: QParam) => {
        // Filter out empties
        return !!q.value;
      });
  }
  return qStatePrams;
}
