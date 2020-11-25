var QuoteHistorical = class QuoteSummary {
  constructor () {
    this.Data = []
    this.Error = null
  }
}

var createQuoteHistoricalFromYahooData = (responseData, error) => {
  const newObject = new QuoteHistorical()

  newObject.Error = error

  if (responseData && responseData.chart && responseData.chart.result) {
    const timestamps = responseData.chart.result[0].timestamp || []
    const quotes = (responseData.chart.result[0].indicators.quote || [])[0].close || []

    newObject.Data = timestamps.map((timestamp, index) => [timestamp * 1000, quotes[index]])
  }

  return newObject
}
