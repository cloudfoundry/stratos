/**
 * total: the overall total value.
 * used: how much of the total has been used.
 *
 * @export
 */
export interface ISimpleUsageChartData {
  total: number;
  used: number;
  unknown?: number;
  usedLabel?: string;
  remainingLabel?: string;
  unknownLabel?: string;
  // Will show on hover when one or more unknown values are found.
  warningText?: string;
}
/**
 * The % usage thresholds at which to show the various colors on the chart.
 * The threshold will be met if the used value is greater than the threshold,
 * this is to allow > 0% but not 0% thresholds.
 * The 'ok' color will always be used if no threshold is met or no thresholds are found.
 *
 * If inverted, danger comparison becomes less than.
 *
 * The colors are take from the $status-colors scss theme variable.
 * @export
 */
export interface IChartThresholds {
  danger?: number;
  warning?: number;
  inverted?: boolean;
}

/**
 * Internal
 *
 * @export
 */
export interface IUsageColor {
  domain: [string, string, string];
}

/**
 * Internal
 *
 * @export
 */
export interface IChartData {
  colors: IUsageColor;
  total: number;
  used: number;
  unknown: number;
  warningText: string;
  results: [
    {
      name: string,
      value: number
    },
    {
      name: string,
      value: number
    },
    {
      name: string,
      value: number
    }
  ];
}
