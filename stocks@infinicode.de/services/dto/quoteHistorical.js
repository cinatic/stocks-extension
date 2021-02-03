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

    if (result.meta && result.meta.tradingPeriods) {
      // there can be multiple tradingPeriods and multiple entries inside a tradingPeriod for each time series entry
      // afaik japan have a break, maybe they have two periods then

      const tradingPeriods = result.meta.tradingPeriods
      const firstTradingPeriod = tradingPeriods[0]
      const lastTradingPeriod = tradingPeriods[tradingPeriods.length - 1]

      // get start from very first trading period
      newObject.MarketStart = firstTradingPeriod[0].start * 1000

      // get end from very latest trading period
      newObject.MarketEnd = lastTradingPeriod[lastTradingPeriod.length - 1].end * 1000
    }
  }

  return newObject
}
