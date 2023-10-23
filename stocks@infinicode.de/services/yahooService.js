import { fetch } from '../helpers/fetch.js'
import { SettingsHandler } from '../helpers/settings.js'
import { createNewsListFromYahooData } from './dto/newsList.js'
import { createQuoteHistoricalFromYahooData } from './dto/quoteHistorical.js'
import { createQuoteSummaryFromYahooData, createQuoteSummaryFromYahooQuoteListData } from './dto/quoteSummary.js'
import { INTERVAL_MAPPINGS } from './meta/yahoo.js'

const COOKIE_URL = 'https://fc.yahoo.com/'
const CRUMB_URL = 'https://query2.finance.yahoo.com/v1/test/getcrumb'

const API_ENDPOINT = 'https://query2.finance.yahoo.com'
const API_VERSION_SUMMARY = 'v10/finance'
const API_VERSION_CHART = 'v8/finance'
const API_VERSION_QUOTE_LIST = 'v7/finance'
const RSS_NEWS_ENDPOINT = 'https://feeds.finance.yahoo.com/rss/2.0/headline?s={SYMBOL}&region=US&lang=en-US'

const defaultQueryParameters = {
  formatted: 'false',
  lang: 'en-US',
  region: 'US',
  crumb: '',
}

// const createQuoteSummaryFromYahooData = createQuoteSummaryFromYahooDataV6;

const ensurePrerequisites = async () => {
  const settings = new SettingsHandler()

  if ((settings?.yahoo_meta?.expiration || 0) > Date.now()) {
    return settings.yahoo_meta
  }

  const cookieResponse = await fetch({
    url: COOKIE_URL
  })

  const cookie = cookieResponse.headers.get_one('set-cookie')

  const crumbResponse = await fetch({
    url: CRUMB_URL,
    cookies: [cookie]
  })

  const newMetaData = {
    cookie,
    crumb: crumbResponse.text(),
    expiration: Date.now() + (360 * 24 * 60 * 60 * 1000)
  }

  settings.yahoo_meta = newMetaData

  return newMetaData
}

export const getQuoteList = async ({ symbolsWithFallbackName }) => {
  const yahooMeta = await ensurePrerequisites()

  const queryParameters = {
    ...defaultQueryParameters,
    crumb: yahooMeta.crumb,
    fields: 'fields=currencySymbol,currency,fromCurrency,toCurrency,exchangeTimezoneName,exchangeTimezoneShortName,preMarketPrice,preMarketChange,preMarketChangePercent,gmtOffSetMilliseconds,regularMarketChange,regularMarketPreviousClose,regularMarketChangePercent,regularMarketVolume,regularMarketPrice,regularMarketTime,preMarketTime,postMarketTime,postMarketPrice,postMarketChange,postMarketChangePercent,exchangeName,longName,extendedMarketTime',
    symbols: symbolsWithFallbackName.map(item => item.symbol).join()
  }

  const url = `${API_ENDPOINT}/${API_VERSION_QUOTE_LIST}/quote`

  const response = await fetch({
    url,
    queryParameters,
    cookies: [yahooMeta.cookie]
  })

  const params = {
    symbolsWithFallbackName,
    quoteListData: response.json()
  }

  if (!response.ok) {
    params.error = `${response.statusText} - ${response.text()}`
  }

  return createQuoteSummaryFromYahooQuoteListData(params)
}

export const getQuoteSummary = async ({ symbol }) => {
  const yahooMeta = await ensurePrerequisites()

  const queryParameters = {
    ...defaultQueryParameters,
    crumb: yahooMeta.crumb,
    modules: 'price'
  }

  const url = `${API_ENDPOINT}/${API_VERSION_SUMMARY}/quoteSummary/${symbol}`

  const response = await fetch({
    url,
    queryParameters,
    cookies: [yahooMeta.cookie]
  })

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
  const yahooMeta = await ensurePrerequisites()

  const queryParameters = {
    ...defaultQueryParameters,
    crumb: yahooMeta.crumb,
    range,
    includePrePost: false,
    interval: INTERVAL_MAPPINGS[range],
    includeTimestamps: includeTimestamps ? 'true' : 'false'
  }

  const url = `${API_ENDPOINT}/${API_VERSION_CHART}/chart/${symbol}`
  const response = await fetch({
    url,
    queryParameters,
    cookies: [yahooMeta.cookie]
  })

  if (response.ok) {
    return createQuoteHistoricalFromYahooData(response.json())
  } else {
    return createQuoteHistoricalFromYahooData(null, `${response.statusText} - ${response.text()}`)
  }
}

export const getNewsList = async ({ symbol }) => {
  const yahooMeta = await ensurePrerequisites()
  const queryParameters = {
    crumb: yahooMeta.crumb,
  }

  const url = RSS_NEWS_ENDPOINT.replace('{SYMBOL}', symbol)

  const response = await fetch({
    url,
    queryParameters,
    cookies: [yahooMeta.cookie]
  })

  if (response.ok) {
    return createNewsListFromYahooData(response.text())
  } else {
    return createNewsListFromYahooData(null, `${response.statusText} - ${response.text()}`)
  }
}
