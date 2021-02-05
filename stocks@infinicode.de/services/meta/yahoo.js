var CHART_RANGES = {
  INTRADAY: '1d',
  WEEK: '5d',
  MONTH: '1mo',
  HALF_YEAR: '6mo',
  YEAR_TO_DATE: 'ytd',
  YEAR: '1y',
  FIVE_YEARS: '5y',
  MAX: 'max'
}

// "optimal" roll up for volume bars ~200 items
var INTERVAL_MAPPINGS = {
  [CHART_RANGES.INTRADAY]: '1m', // 4m roll up volume data
  [CHART_RANGES.WEEK]: '5m', // 5m roll up volume data
  [CHART_RANGES.MONTH]: '5m', // 4h roll up volume data
  [CHART_RANGES.HALF_YEAR]: '1h', // 24h roll up volume data
  [CHART_RANGES.YEAR_TO_DATE]: '1h', // 24h roll up volume data
  [CHART_RANGES.YEAR]: '1d', // 48h roll up volume data
  [CHART_RANGES.FIVE_YEARS]: '1d', // 240h roll up volume data
  [CHART_RANGES.MAX]: '1d', // 480h roll up volume data
}

var MARKET_STATES = {
  PRE: 'PRE',
  PRE_WITHOUT_DATA: 'POST_WITHOUT_DATA',
  POST: 'POST',
  POST_WITHOUT_DATA: 'POST_WITHOUT_DATA',
  REGULAR: 'REGULAR',
}
