const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { isNullOrUndefined, moveDecimal } = Me.imports.helpers.data
const { MARKETS } = Me.imports.services.meta.eastMoney
const { FINANCE_PROVIDER, MARKET_STATES } = Me.imports.services.meta.generic
const { Translations } = Me.imports.helpers.translations

var QuoteSummary = class QuoteSummary {
  constructor (symbol, provider, name, error) {
    this.Name = name
    this.FullName = null
    this.Symbol = symbol
    this.Provider = provider
    this.Timestamp = null
    this.Change = null
    this.ChangePercent = null
    this.PreviousClose = null
    this.Close = null
    this.Open = null
    this.Low = null
    this.High = null
    this.Volume = null
    this.CurrencySymbol = null
    this.ExchangeName = null

    this.MarketState = null

    this.PreMarketPrice = null
    this.PreMarketChange = null
    this.PreMarketChangePercent = null
    this.PreMarketTimestamp = null

    this.PostMarketPrice = null
    this.PostMarketChange = null
    this.PostMarketChangePercent = null
    this.PostMarketTimestamp = null

    this.Error = error
  }
}

var createQuoteSummaryFromEastMoneyData = ({ symbol, quoteData, error }) => {
  const newObject = new QuoteSummary(symbol, FINANCE_PROVIDER.EAST_MONEY)
  newObject.Error = error

  const data = (quoteData || {}).data

  if (data) {
    const decimalPlace = data.f59

    newObject.FullName = data.f58
    if (data.f86) {
      newObject.Timestamp = data.f86 * 1000
    }

    newObject.ChangePercent = moveDecimal(data.f170, decimalPlace)
    newObject.Change = moveDecimal(data.f169, decimalPlace)

    newObject.PreviousClose = moveDecimal(data.f60, decimalPlace)
    newObject.Close = moveDecimal(data.f43, decimalPlace)
    newObject.Open = moveDecimal(data.f46, decimalPlace)
    newObject.Low = moveDecimal(data.f45, decimalPlace)
    newObject.High = moveDecimal(data.f44, decimalPlace)

    newObject.Volume = data.f47
    // newObject.CurrencySymbol = data.f111 !== 2 ? '元' : null // 2 are shares, 0,5,1 are markets or indices
    newObject.CurrencySymbol = '元' // don't really know let's assume it's always renminbi, f111 seems not to be the instrument type
    newObject.ExchangeName = MARKETS[data.f107] || Translations.UNKNOWN

    newObject.MarketState = MARKET_STATES.REGULAR
  }

  return newObject
}

var createQuoteSummaryFromYahooData = ({ symbol, quoteData, error }) => {
  const newObject = new QuoteSummary(symbol, FINANCE_PROVIDER.YAHOO)
  newObject.Error = error

  if (quoteData && quoteData.quoteSummary) {
    if (quoteData.quoteSummary.result) {
      const priceData = (quoteData.quoteSummary.result[0] || []).price || {}

      newObject.FullName = priceData.longName

      if (priceData.regularMarketTime) {
        newObject.Timestamp = priceData.regularMarketTime * 1000
      }

      if (priceData.regularMarketChangePercent) {
        newObject.ChangePercent = priceData.regularMarketChangePercent * 100
      }

      newObject.Change = priceData.regularMarketChange
      newObject.PreviousClose = priceData.regularMarketPreviousClose
      newObject.Close = priceData.regularMarketPrice
      newObject.Open = priceData.regularMarketOpen
      newObject.Low = priceData.regularMarketDayLow
      newObject.High = priceData.regularMarketDayHigh
      newObject.Volume = priceData.regularMarketVolume
      newObject.CurrencySymbol = priceData.currencySymbol
      newObject.ExchangeName = priceData.exchangeName

      newObject.MarketState = priceData.marketState

      newObject.PreMarketPrice = priceData.preMarketPrice
      newObject.PreMarketChange = priceData.preMarketChange
      newObject.PreMarketChangePercent = priceData.preMarketChangePercent * 100

      if (priceData.preMarketTime) {
        newObject.PreMarketTimestamp = priceData.preMarketTime * 1000
      }

      newObject.PostMarketPrice = priceData.postMarketPrice
      newObject.PostMarketChange = priceData.postMarketChange
      newObject.PostMarketChangePercent = priceData.postMarketChangePercent * 100

      if (priceData.postMarketTime) {
        newObject.PostMarketTimestamp = priceData.postMarketTime * 1000
      }

      if (newObject.MarketState === MARKET_STATES.PRE && isNullOrUndefined(newObject.PreMarketPrice)) {
        newObject.MarketState = MARKET_STATES.PRE_WITHOUT_DATA
      }

      if (newObject.MarketState === MARKET_STATES.POST && isNullOrUndefined(newObject.PostMarketPrice)) {
        newObject.MarketState = MARKET_STATES.POST_WITHOUT_DATA
      }
    }

    if (quoteData.quoteSummary.error && quoteData.quoteSummary.error.description) {
      newObject.Error = quoteData.quoteSummary.error.description
    }
  }

  return newObject
}
