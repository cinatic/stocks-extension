const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { cacheOrDefault } = Me.imports.helpers.data

const yahooService = Me.imports.services.yahoo

var getQuoteSummary = async ({ symbol, fallbackName }) => {
  return cacheOrDefault(`${symbol}_summary`, async () => {
    const summary = await yahooService.getQuoteSummary({ symbol })

    if (!summary.FullName) {
      summary.FullName = fallbackName
    }

    return summary
  })
}

var getHistoricalQuotes = async ({ symbol, range = '6mo', interval = '1d', includeTimestamps = true }) => {
  return cacheOrDefault(`${symbol}_chart_${range}_${interval}`, () => {
    return yahooService.getHistoricalQuotes({ symbol, range, interval, includeTimestamps })
  })
}
