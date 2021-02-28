const Gettext = imports.gettext
const _ = Gettext.gettext

const Config = imports.misc.config
const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { SETTINGS_SCHEMA_DOMAIN } = Me.imports.helpers.settings

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

/**
 * initTranslations:
 * @domain: (optional): the gettext domain to use
 *
 * Initialize Gettext to load translations from extensionsdir/locale.
 * If @domain is not provided, it will be taken from metadata['gettext-domain']
 */
var initTranslations = domain => {
  if (ExtensionUtils.versionCheck(['3.32'], Config.PACKAGE_VERSION)) {
    ExtensionUtils.initTranslations(domain)
  } else {
    const extension = ExtensionUtils.getCurrentExtension()

    domain = domain || SETTINGS_SCHEMA_DOMAIN || extension.metadata['gettext-domain']

    // check if this extension was built with "make zip-file", and thus
    // has the locale files in a subfolder
    // otherwise assume that extension has been installed in the
    // same prefix as gnome-shell
    const localeDir = extension.dir.get_child('locale')
    if (localeDir.query_exists(null)) {
      Gettext.bindtextdomain(domain, localeDir.get_path())
    } else {
      Gettext.bindtextdomain(domain, Config.LOCALEDIR)
    }
  }
}
