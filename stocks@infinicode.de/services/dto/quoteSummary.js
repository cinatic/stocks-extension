const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { isNullOrUndefined } = Me.imports.helpers.data
const { MARKET_STATES } = Me.imports.services.meta.yahoo

var QuoteSummary = class QuoteSummary {
  constructor (symbol) {
    this.Name = null
    this.FullName = null
    this.Symbol = symbol
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

    this.Error = null
  }
}

var createQuoteSummaryFromYahooData = (symbol, quoteData, error) => {
  const newObject = new QuoteSummary(symbol)
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

      if(newObject.MarketState === MARKET_STATES.PRE && isNullOrUndefined(newObject.PreMarketPrice)){
        newObject.MarketState = MARKET_STATES.PRE_WITHOUT_DATA
      }

      if(newObject.MarketState === MARKET_STATES.POST && isNullOrUndefined(newObject.PostMarketPrice)){
        newObject.MarketState = MARKET_STATES.POST_WITHOUT_DATA
      }
    }

    if (quoteData.quoteSummary.error && quoteData.quoteSummary.error.description) {
      newObject.Error = quoteData.quoteSummary.error.description
    }
  }

  return newObject
}
