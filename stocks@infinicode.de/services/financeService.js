const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { cacheOrDefault } = Me.imports.helpers.data

const yahooService = Me.imports.services.yahoo

var getQuoteSummary = async ({ symbol, fallbackName }) => {
  return cacheOrDefault(`${symbol}_summary`, async () => {

    let summary = {}

    if (symbol) {
      summary = await yahooService.getQuoteSummary({ symbol })
    }

    if (!summary.FullName) {
      summary.Symbol = symbol
      summary.FullName = fallbackName
    }

    return summary
  })
}

var getHistoricalQuotes = async ({ symbol, range = '6mo', interval = '1d', includeTimestamps = true }) => {
  return cacheOrDefault(`${symbol}_chart_${range}_${interval}`, () => {
    if (symbol) {
      return yahooService.getHistoricalQuotes({ symbol, range, interval, includeTimestamps })
    }
  })
}
