var QuoteHistorical = class QuoteSummary {
  constructor () {
    this.MarketStart = null
    this.MarketEnd = null
    this.Data = []
    this.Error = null
  }
}

var createQuoteHistoricalFromYahooData = (responseData, error) => {
  const newObject = new QuoteHistorical()

  newObject.Error = error

  if (responseData && responseData.chart && responseData.chart.result) {
    const result = responseData.chart.result[0]
    const timestamps = result.timestamp || []
    const quotes = (result.indicators.quote || [])[0].close || []

    newObject.Data = timestamps.map((timestamp, index) => [timestamp * 1000, quotes[index]])

    if (result.meta && result.meta.currentTradingPeriod && result.meta.currentTradingPeriod.regular) {
      newObject.MarketStart = result.meta.currentTradingPeriod.regular.start * 1000
      newObject.MarketEnd = result.meta.currentTradingPeriod.regular.end * 1000
    }
  }

  return newObject
}
