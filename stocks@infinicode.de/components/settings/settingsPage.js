import Adw from 'gi://Adw'
import GObject from 'gi://GObject'
import Gtk from 'gi://Gtk'

import { SettingsHandler } from '../../helpers/settings.js'
import { Translations } from '../../helpers/translations.js'

export const SettingsPage = GObject.registerClass({
      GTypeName: 'StockExtension-SettingsPage',
    },
    class StockListPreferencePage extends Adw.PreferencesPage {
      _init () {
        super._init({
          title: Translations.SETTINGS.TITLE_SETTINGS,
          icon_name: 'view-list-symbolic',
          name: 'SettingsPage'
        })

        const preferenceGroup = new GeneralPreferenceGroup()
        this.add(preferenceGroup)
      }
    })

class GeneralPreferenceGroup extends Adw.PreferencesGroup {
  static {
    GObject.registerClass({ GTypeName: 'StockExtension-GeneralPreferenceGroup' }, this)
  }

  constructor () {
    super({
      title: Translations.SETTINGS.TITLE_GENERAL
    })

    this._settings = new SettingsHandler()

    const panelPositions = new Gtk.StringList()
    panelPositions.append(Translations.SETTINGS.POSITION_IN_PANEL_LEFT)
    panelPositions.append(Translations.SETTINGS.POSITION_IN_PANEL_CENTER)
    panelPositions.append(Translations.SETTINGS.POSITION_IN_PANEL_RIGHT)

    const panelPositionRow = new Adw.ComboRow({
      title: Translations.SETTINGS.POSITION_IN_PANEL,
      model: panelPositions,
      selected: this._settings.position_in_panel
    })

    panelPositionRow.connect('notify::selected', (widget) => {
      this._settings.position_in_panel = widget.selected
    })
    this.add(panelPositionRow)

    const tickerDisplayVariations = new Gtk.StringList()
    tickerDisplayVariations.append(Translations.SETTINGS.TICKER_DISPLAY_VARIATION.COMPACT)
    tickerDisplayVariations.append(Translations.SETTINGS.TICKER_DISPLAY_VARIATION.REGULAR)
    tickerDisplayVariations.append(Translations.SETTINGS.TICKER_DISPLAY_VARIATION.TREMENDOUS)
    tickerDisplayVariations.append(Translations.SETTINGS.TICKER_DISPLAY_VARIATION.MINIMAL)

    const tickerDisplayVariationRow = new Adw.ComboRow({
      title: Translations.SETTINGS.TICKER_DISPLAY_VARIATION.TITLE,
      model: tickerDisplayVariations,
      selected: this._settings.position_in_panel
    })

    tickerDisplayVariationRow.connect('notify::selected', (widget) => {
      this._settings.ticker_display_variation = widget.selected
    })
    this.add(tickerDisplayVariationRow)

    const tickerStockAmountSpinButton = new Gtk.SpinButton({
      adjustment: new Gtk.Adjustment({
        lower: 0, upper: 15, step_increment: 1, page_increment: 1, page_size: 0,
      }),
      climb_rate: 1,
      digits: 0,
      numeric: true,
      valign: Gtk.Align.CENTER,
    })

    tickerStockAmountSpinButton.set_value(this._settings.ticker_stock_amount)

    tickerStockAmountSpinButton.connect('value-changed', (widget) => {
      this._settings.ticker_stock_amount = widget.get_value()
    })

    const tickerStockAmountRow = new Adw.ActionRow({
      title: Translations.SETTINGS.TICKER_STOCK_AMOUNT_LABEL,
      activatable_widget: tickerStockAmountSpinButton
    })

    tickerStockAmountRow.add_suffix(tickerStockAmountSpinButton)
    this.add(tickerStockAmountRow)

    const tickerIntervalSpinButton = new Gtk.SpinButton({
      adjustment: new Gtk.Adjustment({
        lower: 0, upper: 600, step_increment: 1, page_increment: 1, page_size: 0,
      }),
      climb_rate: 1,
      digits: 0,
      numeric: true,
      valign: Gtk.Align.CENTER,
    })

    tickerIntervalSpinButton.set_value(this._settings.ticker_interval)

    tickerIntervalSpinButton.connect('value-changed', (widget) => {
      this._settings.ticker_interval = widget.get_value()
    })

    const tickerIntervalRow = new Adw.ActionRow({
      title: Translations.SETTINGS.TICKER_INTERVAL_LABEL,
      activatable_widget: tickerIntervalSpinButton
    })

    tickerIntervalRow.add_suffix(tickerIntervalSpinButton)
    this.add(tickerIntervalRow)

    const showTickerOffMarketPricesSwitch = new Gtk.Switch({
      valign: Gtk.Align.CENTER
    })

    const showTickerOffMarketPricesRow = new Adw.ActionRow({
      title: Translations.SETTINGS.SHOW_TICKER_OFF_MARKET_PRICES_LABEL,
      activatable_widget: showTickerOffMarketPricesSwitch
    })

    showTickerOffMarketPricesSwitch.set_active(this._settings.show_ticker_off_market_prices)

    showTickerOffMarketPricesSwitch.connect('notify::active', (widget) => {
      this._settings.show_ticker_off_market_prices = widget.get_active()
    })

    showTickerOffMarketPricesRow.add_suffix(showTickerOffMarketPricesSwitch)
    this.add(showTickerOffMarketPricesRow)

    const useNamesFromProviderSwitch = new Gtk.Switch({
      valign: Gtk.Align.CENTER
    })

    const useNamesFromProviderRow = new Adw.ActionRow({
      title: Translations.SETTINGS.USE_NAMES_FROM_PROVIDER_LABEL,
      activatable_widget: useNamesFromProviderSwitch
    })

    useNamesFromProviderSwitch.set_active(this._settings.use_provider_instrument_names)

    useNamesFromProviderSwitch.connect('notify::active', (widget) => {
      this._settings.use_provider_instrument_names = widget.get_active()
    })

    useNamesFromProviderRow.add_suffix(useNamesFromProviderSwitch)
    this.add(useNamesFromProviderRow)
  }
}
