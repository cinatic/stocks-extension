const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const DOMAIN = Me.metadata['gettext-domain'];

const Gettext = imports.gettext.domain(DOMAIN);
var _ = Gettext.gettext;

ExtensionUtils.initTranslations(DOMAIN)

var Translations = {
  BACK: _('back'),
  FILTER_PLACEHOLDER: _('Filter Results'),
  LOADING_DATA: _('Loading Data'),
  NO_SYMBOLS_CONFIGURED_ERROR: _('No Symbols / Tickers configured.'),
  EMPTY_TICKER_TEXT: _('stocks'),
  UNKNOWN: _('UNKNOWN'),
  SETTINGS: {
    QUOTE_NAME: _('Name'),
    SYMBOL: _('Symbol'),
    SHOW_IN_TICKER: _('Show in Ticker'),
    PROVIDER: _('Provider'),
    REMOVE_CONFIRMATION_TEXT: _('Remove %s?')
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
  FORMATS: {
    DEFAULT_DATE_TIME: _('%H:%M:%S %d.%m.%Y')
  }
}
