import { cacheOrDefault } from '../helpers/data.js'
import { SettingsHandler } from '../helpers/settings.js'

import { FINANCE_PROVIDER } from './meta/generic.js'
import { QuoteSummary } from './dto/quoteSummary.js'

import * as yahooService from '../services/yahooService.js'
import * as eastMoneyService from '../services/eastMoneyService.js'

const services = {
  [FINANCE_PROVIDER.YAHOO]: yahooService,
  [FINANCE_PROVIDER.EAST_MONEY]: eastMoneyService
}

export const getQuoteSummary = async ({ symbol, provider, fallbackName }) => {
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

export const getHistoricalQuotes = async ({ symbol, provider, range = '1y', includeTimestamps = true }) => {
  return cacheOrDefault(`chart_${symbol}_${provider}_${range}`, () => {
    const service = services[provider]

    if (symbol && service) {
      return service.getHistoricalQuotes({ symbol, range, includeTimestamps })
    }
  })
}

export const getNewsList = async ({ symbol, provider }) => {
  return cacheOrDefault(`news_${provider}_${symbol}`, () => {
    const service = services[provider]

    if (symbol && service) {
      return service.getNewsList({ symbol })
    }
  }, 15 * 60 * 1000)
}
