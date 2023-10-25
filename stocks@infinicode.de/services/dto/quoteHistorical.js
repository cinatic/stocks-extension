export const QuoteHistorical = class QuoteSummary {
  constructor () {
    this.MarketStart = null
    this.MarketEnd = null
    this.Data = []
    this.VolumeData = []
    this.Error = null
  }
}

export const createQuoteHistoricalFromEastMoneyData = (responseData, type, error) => {
  const newObject = new QuoteHistorical()

  newObject.Error = error
  const data = (responseData || {}).data

  if (!data) {
    return newObject
  }

  const seriesData = data[type] || []
  let firstTimeStamp

  newObject.Data = []
  newObject.VolumeData = []

  seriesData.forEach(rawValue => {
    const [rawTimestamp, close, volume, open] = rawValue.split(',')

    const timestamp = new Date(rawTimestamp).valueOf()

    if (!firstTimeStamp) {
      firstTimeStamp = timestamp
    }

    newObject.Data.push([timestamp, close])
    newObject.VolumeData.push([timestamp, volume])
  })

  if (data.tradePeriods && data.tradePeriods.periods) {
    // there can be multiple tradingPeriods and multiple entries inside a tradingPeriod for each time series entry
    // afaik japan have a break, maybe they have two periods then

    const tradingPeriods = data.tradePeriods.periods
    newObject.MarketStart = _parseEastMarketDateString(tradingPeriods[0])
    newObject.MarketEnd = _parseEastMarketDateString(tradingPeriods[tradingPeriods.length - 1])
  }

  // FIXME: data could have pre market values, but pre / after periods are not provided (only important for intraday)
  if (newObject.MarketStart && firstTimeStamp && firstTimeStamp < newObject.MarketStart) {
    newObject.MarketStart = firstTimeStamp
  }

  return newObject
}

export const createQuoteHistoricalFromYahooData = (responseData, error) => {
  const newObject = new QuoteHistorical()

  newObject.Error = error

  if (responseData && responseData.chart && responseData.chart.result) {
    const result = responseData.chart.result[0]
    const timestamps = result.timestamp || []
    const quotes = (result.indicators.quote || [])[0].close || []
    const volumes = (result.indicators.quote || [])[0].volume || []

    newObject.Data = []
    newObject.VolumeData = []

    timestamps.forEach((timestamp, index) => {
      newObject.Data.push([timestamp * 1000, quotes[index]])
      newObject.VolumeData.push([timestamp * 1000, volumes[index]])
    })

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

const _parseEastMarketDateString = dateString => {
  if (!dateString) {
    return
  }

  try {
    return new Date(`${dateString.slice(0, 4)}-${dateString.slice(4, 6)}-${dateString.slice(6, 8)} ${dateString.slice(8, 10)}:${dateString.slice(10, 12)}`)
  } catch (e) {
    return
  }
}
