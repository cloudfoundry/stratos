
export const PolicyDefaultSetting = {
  breach_duration_secs_default: 120,
  breach_duration_secs_min: 60,
  breach_duration_secs_max: 3600,
  cool_down_secs_default: 120,
  cool_down_secs_min: 60,
  cool_down_secs_max: 3600,
};
export const MetricTypes = ['memoryused', 'memoryutil', 'responsetime', 'throughput'];
export const ScaleTypes = ['upper', 'lower'];
export const UpperOperators = ['>', '>='];
export const LowerOperators = ['<', '<='];

export const normalColor = 'rgba(90,167,0,0.6)';
export const MomentFormateDate = 'YYYY-MM-DD';
export const MomentFormateDateTimeT = 'YYYY-MM-DDTHH:mm';
export const MomentFormateTime = 'HH:mm';
export const MomentFormateTimeS = 'HH:mm:ss';

export const metricMap = {
  memoryused: {
    unit_internal: 'MB',
    interval: 40,
  },
  memoryutil: {
    unit_internal: '%',
    interval: 40,
  },
  responsetime: {
    unit_internal: 'ms',
    interval: 40,
  },
  throughput: {
    unit_internal: 'rps',
    interval: 40,
  }
};

export const S2NS = 1000000000;

export function isEqual(a, b) {
  if (typeof (a) !== typeof (b)) {
    return false;
  } else {
    if (typeof (a) === 'object') {
      if (Object.keys(a).length !== Object.keys(b).length) {
        return false;
      }
      let equal = true;
      Object.keys(a).map((key) => {
        equal = equal && isEqual(a[key], b[key]);
      });
      return equal;
    } else {
      return JSON.stringify(a) === JSON.stringify(b);
    }
  }
}

export function getScaleType(operator) {
  if (LowerOperators.indexOf(operator) >= 0) {
    return 'lower';
  } else {
    return 'upper';
  }
}

export function getAdjustmentType(adjustment) {
  return adjustment.indexOf('%') >= 0 ? 'percentage' : 'value';
}

export function buildLegendData(trigger) {
  const legendData = [];
  let latestUl = {};
  if (trigger.upper && trigger.upper.length > 0) {
    latestUl = buildUpperLegendData(legendData, trigger.upper, !trigger.lower || trigger.lower.length === 0);
  }
  if (trigger.lower && trigger.lower.length > 0) {
    latestUl = buildLowerLegendData(legendData, trigger.lower, latestUl);
  }
  return legendData;
}

function buildUpperLegendData(legendData, upper, nolower) {
  let latestUl: any = {};
  upper.map((item, index) => {
    let name = '';
    if (index === 0) {
      name = `${item.metric_type} ${item.operator} ${item.threshold}`;
    } else {
      name = `${item.threshold} ${getLeftOperator(item.operator)} ${item.
        metric_type} ${getRightOperator(latestUl.operator)} ${latestUl.threshold}`;
    }
    legendData.push({
      name,
      value: item.color
    });
    latestUl = item;
  });
  if (nolower) {
    legendData.push({
      name: `${upper[0].metric_type} ${getOppositeOperator(latestUl.operator)} ${latestUl.threshold}`,
      value: normalColor
    });
  }
  return latestUl;
}

function buildLowerLegendData(legendData, lower, latestUl) {
  lower.map((item, index) => {
    let name = '';
    if (!latestUl.threshold) {
      name = `${item.metric_type} ${getOppositeOperator(item.operator)} ${item.threshold}`;
    } else {
      name = `${item.threshold} ${getLeftOperator(item.operator)} ${item.
        metric_type} ${getRightOperator(latestUl.operator)} ${latestUl.threshold}`;
    }
    legendData.push({
      name,
      value: index === 0 ? normalColor : latestUl.color
    });
    latestUl = item;
  });
  legendData.push({
    name: `${lower[0].metric_type} ${latestUl.operator} ${latestUl.threshold}`,
    value: latestUl.color
  });
  return {};
}

function getOppositeOperator(operator) {
  switch (operator) {
    case '>':
      return '<=';
    case '>=':
      return '<';
    case '<':
      return '>=';
    default:
      return '>';
  }
}

function getRightOperator(operator) {
  switch (operator) {
    case '>':
      return '<=';
    case '>=':
      return '<';
    default:
      return operator;
  }
}

function getLeftOperator(operator) {
  switch (operator) {
    case '>':
      return '<';
    case '>=':
      return '<=';
    case '<':
      return '<=';
    default:
      return '<';
  }
}
