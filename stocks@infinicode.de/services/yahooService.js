import { fetch } from '../helpers/fetch.js'
import { createQuoteSummaryFromYahooDataV6 } from './dto/quoteSummary.js'
import { createQuoteHistoricalFromYahooData } from './dto/quoteHistorical.js'
import { createNewsListFromYahooData } from './dto/newsList.js'
import { INTERVAL_MAPPINGS } from './meta/yahoo.js'

const API_ENDPOINT = 'https://query1.finance.yahoo.com'
const API_VERSION_SUMMARY = 'v6/finance'
const API_VERSION_CHART = 'v8/finance'
const RSS_NEWS_ENDPOINT = 'https://feeds.finance.yahoo.com/rss/2.0/headline?s={SYMBOL}&region=US&lang=en-US'

const defaultQueryParameters = {
  formatted: 'false',
  lang: 'en-US',
  region: 'US',
  corsDomain: 'finance.yahoo.com'
}

const createQuoteSummaryFromYahooData = createQuoteSummaryFromYahooDataV6;

export const getQuoteSummary = async ({ symbol }) => {
  const queryParameters = {
    ...defaultQueryParameters,
    modules: 'price'
  }

  const url = `${API_ENDPOINT}/${API_VERSION_SUMMARY}/quoteSummary/${symbol}`

  const response = await fetch({ url, queryParameters })

  const params = {
    symbol,
    quoteData: response.json()
  }

  if (!response.ok) {
    params.error = `${response.statusText} - ${response.text()}`
  }

  return createQuoteSummaryFromYahooData(params)
}

export const getHistoricalQuotes = async ({ symbol, range = '1mo', includeTimestamps = true }) => {
  const queryParameters = {
    ...defaultQueryParameters,
    range,
    includePrePost: false,
    interval: INTERVAL_MAPPINGS[range],
    includeTimestamps: includeTimestamps ? 'true' : 'false'
  }

  const url = `${API_ENDPOINT}/${API_VERSION_CHART}/chart/${symbol}`
  const response = await fetch({ url, queryParameters })

  if (response.ok) {
    return createQuoteHistoricalFromYahooData(response.json())
  } else {
    return createQuoteHistoricalFromYahooData(null, `${response.statusText} - ${response.text()}`)
  }
}

export const getNewsList = async ({ symbol }) => {
  const url = RSS_NEWS_ENDPOINT.replace('{SYMBOL}', symbol)

  const response = await fetch({ url })

  if (response.ok) {
    return createNewsListFromYahooData(response.text())
  } else {
    return createNewsListFromYahooData(null, `${response.statusText} - ${response.text()}`)
  }
}
