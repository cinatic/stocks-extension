import { toLocalDateFormat } from '../helpers/data.js'
import { fetch } from '../helpers/fetch.js'
import { createQuoteSummaryFromEastMoneyData } from './dto/quoteSummary.js'
import { createQuoteHistoricalFromEastMoneyData } from './dto/quoteHistorical.js'
import { CHART_RANGES } from './meta/generic.js'
import { INTERVAL_MAPPINGS } from './meta/eastMoney.js'

const API_ENDPOINT = 'https://push2his.eastmoney.com'
const API_VERSION_SUMMARY = 'api/qt/stock/get'
const API_VERSION_INTRADAY_CHART = 'api/qt/stock/trends2/get'
const API_VERSION_HISTORY_CHART = 'api/qt/stock/kline/get'

const API_SUMMARY_FIELDS = 'f43,f44,f45,f46,f47,f57,f58,f59,f60,f86,f107,f111,f169,f170,f493'
const API_CHART_FIELDS = 'f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f13,f14,f15,f16,f17,f18,f20,f21,f23,f24,f25,f22,f11,f51,f53,f56,f58,f62,f128,f136,f115,f152'
const API_CHART_SERIES_FIELDS = 'f51,f53,f56,f58,f86'

const defaultQueryParameters = {}

export const getQuoteSummary = async ({ symbol }) => {
  const queryParameters = {
    ...defaultQueryParameters,
    secid: symbol,
    fields: API_SUMMARY_FIELDS
  }

  const url = `${API_ENDPOINT}/${API_VERSION_SUMMARY}`
  const response = await fetch({ url, queryParameters })

  const params = {
    symbol,
    quoteData: response.json()
  }

  if (!response.ok) {
    params.error = `${response.statusText} - ${response.text()}`
  }

  return createQuoteSummaryFromEastMoneyData(params)
}

export const getHistoricalQuotes = async ({ symbol, range = '1mo' }) => {
  const queryParameters = {
    ...defaultQueryParameters,
    secid: symbol,
    fields1: API_CHART_FIELDS,
    fields2: API_CHART_SERIES_FIELDS
  }

  if (range === CHART_RANGES.INTRADAY) {
    return _getIntradayQuotes({ queryParameters })
  } else {
    return _getHistoricalQuotes({ queryParameters, range })
  }
}

export const getNewsList = async () => {
  // FIXME ...
  return []
}

const _getIntradayQuotes = async ({ queryParameters }) => {
  const url = `${API_ENDPOINT}/${API_VERSION_INTRADAY_CHART}`

  queryParameters = {
    ...queryParameters,
    ndays: 1
  }

  const response = await fetch({ url, queryParameters })

  if (response.ok) {
    return createQuoteHistoricalFromEastMoneyData(response.json(), 'trends')
  } else {
    return createQuoteHistoricalFromEastMoneyData(null, 'trends', `${response.statusText} - ${response.text()}`)
  }
}

const _getHistoricalQuotes = async ({ queryParameters, range }) => {
  const url = `${API_ENDPOINT}/${API_VERSION_HISTORY_CHART}`

  const [startDate, endDate] = _createDateRange(range)

  queryParameters = {
    ...queryParameters,
    klt: INTERVAL_MAPPINGS[range],
    fqt: 1, // 1 before rehabilitation, 2 after rehabilitation
    beg: toLocalDateFormat(startDate, '%Y%m%d'),
    end: toLocalDateFormat(endDate, '%Y%m%d')
  }

  const response = await fetch({ url, queryParameters })

  if (response.ok) {
    return createQuoteHistoricalFromEastMoneyData(response.json(), 'klines')
  } else {
    return createQuoteHistoricalFromEastMoneyData(null, 'klines', `${response.statusText} - ${response.text()}`)
  }
}

// FIXME: use somehow better date manipulation
const _createDateRange = range => {
  const endDate = new Date()
  let startDate

  switch (range) {
    default:
    case CHART_RANGES.WEEK:
      startDate = new Date(_manipulateDate(endDate.valueOf(), -7))
      return [startDate, endDate]

    case CHART_RANGES.MONTH:
      startDate = new Date(_manipulateDate(endDate.valueOf(), -30))
      return [startDate, endDate]

    case CHART_RANGES.HALF_YEAR:
      startDate = new Date(_manipulateDate(endDate.valueOf(), -6 * 30))
      return [startDate, endDate]

    case CHART_RANGES.YEAR_TO_DATE:
      startDate = new Date(toLocalDateFormat(endDate, '%Y-01-01'))
      return [startDate, endDate]

    case CHART_RANGES.YEAR:
      startDate = new Date(toLocalDateFormat(endDate, `${endDate.getFullYear() - 1}-%m-%d`))
      return [startDate, endDate]

    case CHART_RANGES.FIVE_YEARS:
      startDate = new Date(toLocalDateFormat(endDate, `${endDate.getFullYear() - 5}-%m-%d`))
      return [startDate, endDate]

    case CHART_RANGES.MAX:
      startDate = new Date(toLocalDateFormat(endDate, `${endDate.getFullYear() - 20}-%m-%d`))
      return [startDate, endDate]
  }
}

const _manipulateDate = (timestamp, days) => timestamp + (days * 86400000)
