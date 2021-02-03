const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { fetch } = Me.imports.helpers.fetch
const { createQuoteSummaryFromYahooData } = Me.imports.services.dto.quoteSummary
const { createQuoteHistoricalFromYahooData } = Me.imports.services.dto.quoteHistorical

const API_ENDPOINT = 'https://query2.finance.yahoo.com'
const API_VERSION_SUMMARY = 'v10/finance'
const API_VERSION_CHART = 'v8/finance'

const defaultQueryParameters = {
  formatted: 'false',
  lang: 'en-US',
  region: 'US',
  corsDomain: 'finance.yahoo.com'
}

var getQuoteSummary = async ({ symbol }) => {
  const queryParameters = {
    ...defaultQueryParameters,
    modules: 'price%2CsummaryDetail%2CpageViews'
  }

  const url = `${API_ENDPOINT}/${API_VERSION_SUMMARY}/quoteSummary/${symbol}`

  const response = await fetch({ url, queryParameters })

  if (response.ok) {
    return createQuoteSummaryFromYahooData(symbol, response.json())
  } else {
    return createQuoteSummaryFromYahooData(symbol, response.json(), `${response.statusText} - ${response.text()}`)
  }
}

var getHistoricalQuotes = async ({ symbol, range = '6mo', interval = '1d', includeTimestamps = true }) => {
  const queryParameters = {
    ...defaultQueryParameters,
    range,
    interval,
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
