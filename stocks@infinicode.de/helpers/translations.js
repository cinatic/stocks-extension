export let Translations = {}

export const initTranslations = (_) => {
  Translations = {
    EXTENSION: {
      NAME: _('Stocks Extension'),
      DESCRIPTION: _('A extension to display stock quotes in GNOME Shell Panel')
    },
    BACK: _('back'),
    FILTER_PLACEHOLDER: _('Filter Results'),
    LOADING_DATA: _('Loading Data'),
    NO_SYMBOLS_CONFIGURED_ERROR: _('No Symbols / Tickers configured.'),
    EMPTY_TICKER_TEXT: _('stocks'),
    UNKNOWN: _('UNKNOWN'),
    PROVIDERS: {
      YAHOO: _('Yahoo'),
      EAST_MONEY: _('EastMoney')
    },
    TRANSACTIONS: {
      INVALID_PRICE: _('Price could not be parsed'),
      INVALID_AMOUNT: _('Amount must be a whole number'),
      INVALID_DATE: _('Date could not be parsed'),
      TITLE_TRANSACTION_TYPE: _('Transaction Type'),
      NO_TRANSACTIONS_ERROR: _('No transactions, use the + Icon in the Search Bar to add transactions.'),
      UNSOLD_ITEMS: _('%d of this transactions could not be assigned, check if your transactions are correct')
    },
    SETTINGS: {
      ADD_SYMBOL: _('Add Symbol'),
      ADD_PORTFOLIO: _('Add Portfolio'),
      PORTFOLIO_NAME: _('Portfolio Name'),
      DEFAULT_NAME: _('Changeme %d'),
      DEFAULT_PORTFOLIO_NAME: _('List %d'),
      QUOTE_NAME: _('Name'),
      SYMBOL: _('Symbol'),
      SHOW_IN_TICKER_LABEL: _('In Ticker?'),
      SHOW_IN_TICKER_INFO: _(' - in Ticker'),
      PROVIDER: _('Provider'),
      REMOVE_CONFIRMATION_TEXT: _('Remove %s?'),
      TITLE_GENERAL: _('General'),
      TITLE_SETTINGS: _('Settings'),
      TITLE_ABOUT: _('About'),
      TITLE_SYMBOLS: _('Symbols'),
      TITLE_SYMBOLS_LIST: _('Symbol List'),
      TITLE_PORTFOLIOS: _('Portfolios'),
      TITLE_PORTFOLIOS_LIST: _('Portfolio List'),
      POSITION_IN_PANEL: _('Position in Panel'),
      POSITION_IN_PANEL_LEFT: _('Left'),
      POSITION_IN_PANEL_CENTER: _('Center'),
      POSITION_IN_PANEL_RIGHT: _('Right'),
      TICKER_DISPLAY_VARIATION: {
        TITLE: _('Ticker Display Variation'),
        COMPACT: _('Compact'),
        REGULAR: _('Regular'),
        TREMENDOUS: _('Tremendous'),
        MINIMAL: _('Minimal')
      },
      TICKER_STOCK_AMOUNT_LABEL: _('Items to show in ticker'),
      TICKER_INTERVAL_LABEL: _('Stock Panel Ticker Interval in Seconds'),
      SHOW_TICKER_OFF_MARKET_PRICES_LABEL: _('Show off-market prices in Ticker'),
      USE_NAMES_FROM_PROVIDER_LABEL: _('Use instrument names from provider')
    },
    STOCKS: {
      SYMBOL: _('Symbol'),
      CHANGE: _('Change'),
      CHANGE_PRE_MARKET: _('Pre Market*'),
      CHANGE_POST_MARKET: _('Post Market*'),
      VOLUME: _('Volume'),
      EXCHANGE: _('Exchange'),
      PREVIOUS_CLOSE: _('Prev. Close'),
      OPEN: _('Open'),
      CLOSE: _('Close'),
      HIGH: _('High'),
      LOW: _('Low'),
      TIME: _('Time'),
      TIME_PRE_MARKET: _('Before Hours*'),
      TIME_POST_MARKET: _('After Hours*'),
      PRE_MARKET: _('Pre Market*'),
      POST_MARKET: _('Post Market*'),
      REALIZED: _('Realized'),
      VALUE: _('Value'),
      COST: _('Cost'),
      PRICE: _('Price'),
      TRANSACTION_TYPE: {
        BUY: _('Buy'),
        SELL: _('Sell')
      }
    },
    CHART: {
      RANGES: {
        INTRADAY: _('1D'),
        WEEK: _('5D'),
        MONTH: _('1M'),
        HALF_YEAR: _('6M'),
        YEAR_TO_DATE: _('YTD'),
        YEAR: _('1Y'),
        FIVE_YEARS: _('5Y'),
        MAX: _('Max'),
      }
    },
    MISC: {
      SAVE: _('Save'),
      DATE: _('Date'),
      ALLTIME: _('Alltime'),
      TOTAL: _('Total'),
      TODAY: _('Today'),
      AMOUNT: _('Amount'),
      OS: _('OS'),
      EXTENSION_VERSION: _('Extension Version'),
      GIT_COMMIT: _('Git Commit'),
      GNOME_VERSION: _('GNOME Version'),
      SESSION_TYPE: _('Session Type'),
    },
    FORMATS: {
      DEFAULT_DATE_TIME: _('%H:%M:%S %d.%m.%Y')
    }
  }
}
