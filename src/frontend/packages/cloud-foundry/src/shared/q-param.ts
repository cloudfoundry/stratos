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
      if (testSplit.length === 2) {
        return [testSplit[0], testSplit[1], joiner];
      }
    }, null as []);
    if (qParamComponents && qParamComponents.length === 3) {
      return new QParam(
        qParamComponents[0],
        qParamComponents[1],
        QParamJoiners[qParamComponents[2]]
      );
    }
    return null;
  }

  static fromStrings(qStrings: string[]) {
    return qStrings.map(qString => QParam.fromString(qString)).filter(qObject => !!qObject);
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
