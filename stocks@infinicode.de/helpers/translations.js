const Gettext = imports.gettext
const _ = Gettext.gettext

var Translations = {
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
  SETTINGS: {
    ADD_SYMBOL: _('Add Symbol'),
    DEFAULT_NAME: _('Changeme %d'),
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
