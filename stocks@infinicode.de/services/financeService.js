const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { cacheOrDefault } = Me.imports.helpers.data

const { FINANCE_PROVIDER } = Me.imports.services.meta.generic

const yahooService = Me.imports.services.yahooService
const eastMoneyService = Me.imports.services.eastMoneyService

const services = {
  [FINANCE_PROVIDER.YAHOO]: yahooService,
  [FINANCE_PROVIDER.EAST_MONEY]: eastMoneyService
}

var getQuoteSummary = async ({ symbol, provider, fallbackName }) => {
  return cacheOrDefault(`summary_${symbol}_${provider}`, async () => {
    const service = services[provider]

    if (!service) {
      return new QuoteSummary(symbol, provider, fallbackName, 'Invalid Provider')
    }

    let summary = {}

    if (symbol) {
      summary = await service.getQuoteSummary({ symbol })
    }

    if (!summary.FullName) {
      summary.Symbol = symbol
      summary.FullName = fallbackName
    }

    return summary
  })
}

var getHistoricalQuotes = async ({ symbol, provider, range = '1y', includeTimestamps = true }) => {
  return cacheOrDefault(`chart_${symbol}_${provider}_${range}`, () => {
    const service = services[provider]

    if (symbol && service) {
      return service.getHistoricalQuotes({ symbol, range, includeTimestamps })
    }
  })
}
