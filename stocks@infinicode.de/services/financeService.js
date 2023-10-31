const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { cacheOrDefault } = Me.imports.helpers.data
const { SettingsHandler } = Me.imports.helpers.settings

const { FINANCE_PROVIDER } = Me.imports.services.meta.generic

const yahooService = Me.imports.services.yahooService
const eastMoneyService = Me.imports.services.eastMoneyService

const services = {
  [FINANCE_PROVIDER.YAHOO]: yahooService,
  [FINANCE_PROVIDER.EAST_MONEY]: eastMoneyService
}

var getQuoteSummaryList = async ({ symbolsWithFallbackName, provider }) => {
  const settings = new SettingsHandler()

  return cacheOrDefault(`summary_list_${symbolsWithFallbackName.map(item => item.symbol).sort().join('-')}_${provider}`, async () => {
    const service = services[provider]

    if (!service) {
      return symbolsWithFallbackName.map(({ symbol, fallbackName }) => new QuoteSummary(symbol, provider, fallbackName, 'Invalid Provider'))
    }

    let resultList = []

    symbolsWithFallbackName = symbolsWithFallbackName.map(item => ({
      ...item,
      forceFallbackName: !settings.use_provider_instrument_names
    }))

    if (symbolsWithFallbackName?.length > 0) {
      resultList = await service.getQuoteList({ symbolsWithFallbackName })
    }

    return resultList
  })
}

var getQuoteSummary = async ({ symbol, provider, fallbackName }) => {
  const settings = new SettingsHandler()

  return cacheOrDefault(`summary_${symbol}_${provider}`, async () => {
    const service = services[provider]

    if (!service) {
      return new QuoteSummary(symbol, provider, fallbackName, 'Invalid Provider')
    }

    let summary = {}

    if (symbol) {
      summary = await service.getQuoteSummary({ symbol })
    }

    if (!summary.Symbol) {
      summary.Symbol = symbol
    }

    if (!summary.FullName || !settings.use_provider_instrument_names) {
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

var getNewsList = async ({ symbol, provider }) => {
  return cacheOrDefault(`news_${provider}_${symbol}`, () => {
    const service = services[provider]

    if (symbol && service) {
      return service.getNewsList({ symbol })
    }
  }, 15 * 60 * 1000)
}
