import { CHART_RANGES } from './generic.js'

// "optimal" roll up for volume bars ~200 items
export const INTERVAL_MAPPINGS = {
  [CHART_RANGES.INTRADAY]: '1m', // 4m roll up volume data
  [CHART_RANGES.WEEK]: '5m', // 5m roll up volume data
  [CHART_RANGES.MONTH]: '5m', // 4h roll up volume data
  [CHART_RANGES.HALF_YEAR]: '1h', // 24h roll up volume data
  [CHART_RANGES.YEAR_TO_DATE]: '1h', // 24h roll up volume data
  [CHART_RANGES.YEAR]: '1d', // 48h roll up volume data
  [CHART_RANGES.FIVE_YEARS]: '1d', // 240h roll up volume data
  [CHART_RANGES.MAX]: '1d' // 480h roll up volume data
}
