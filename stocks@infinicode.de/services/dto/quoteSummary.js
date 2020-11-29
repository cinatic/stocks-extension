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
    }

    if (quoteData.quoteSummary.error && quoteData.quoteSummary.error.description) {
      newObject.Error = quoteData.quoteSummary.error.description
    }
  }

  return newObject
}
