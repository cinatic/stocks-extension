const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { cacheOrDefault } = Me.imports.helpers.data

const yahooService = Me.imports.services.yahoo

var getQuoteSummary = async ({ symbol, fallbackName }) => {
  return cacheOrDefault(`summary_${symbol}`, async () => {

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

var getHistoricalQuotes = async ({ symbol, range = '1y', includeTimestamps = true }) => {
  return cacheOrDefault(`chart_${symbol}_${range}`, () => {
    if (symbol) {
      return yahooService.getHistoricalQuotes({ symbol, range, includeTimestamps })
    }
  })
}
