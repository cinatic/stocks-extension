export const CHART_RANGES = {
  INTRADAY: '1d',
  WEEK: '5d',
  MONTH: '1mo',
  HALF_YEAR: '6mo',
  YEAR_TO_DATE: 'ytd',
  YEAR: '1y',
  FIVE_YEARS: '5y',
  MAX: 'max'
}

export const TRANSACTION_TYPES = {
  BUY: 'buy',
  SELL: 'sell'
}

export const CHART_RANGES_MAX_GAP = {
  [CHART_RANGES.INTRADAY]: null,
  [CHART_RANGES.WEEK]: 3600 * 1000,
  [CHART_RANGES.MONTH]: 3600 * 1000,
  [CHART_RANGES.HALF_YEAR]: 3600 * 6 * 1000,
  [CHART_RANGES.YEAR_TO_DATE]: 3600 * 6 * 1000,
  [CHART_RANGES.YEAR]: null,
  [CHART_RANGES.FIVE_YEARS]: null,
  [CHART_RANGES.MAX]: null
}

export const FINANCE_PROVIDER = {
  YAHOO: 'yahoo',
  EAST_MONEY: 'eastmoney'
}

export const MARKET_STATES = {
  PRE: 'PRE',
  PRE_WITHOUT_DATA: 'POST_WITHOUT_DATA',
  POST: 'POST',
  POST_WITHOUT_DATA: 'POST_WITHOUT_DATA',
  REGULAR: 'REGULAR'
}

export const CHART_RANGES_IN_DAYS = {
  INTRADAY: 1,
  WEEK: 7,
  MONTH: 30,
  HALF_YEAR: 6 * 30,
  YEAR_TO_DATE: 'ytd',
  YEAR: 365,
  FIVE_YEARS: 5 * 365,
  MAX: 10 * 365
}
