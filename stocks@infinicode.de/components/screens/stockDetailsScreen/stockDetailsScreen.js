const { GObject, St } = imports.gi

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { Chart } = Me.imports.components.chart.chart
const { StockDetails } = Me.imports.components.stocks.stockDetails
const { SearchBar } = Me.imports.components.searchBar.searchBar

const { clearCache, roundOrDefault } = Me.imports.helpers.data
const { Translations } = Me.imports.helpers.translations

const FinanceService = Me.imports.services.financeService

var StockDetailsScreen = GObject.registerClass({}, class StockDetailsScreen extends St.BoxLayout {
  _init ({ quoteSummary }) {
    super._init({
      style_class: 'screen stock-details-screen',
      vertical: true
    })

    this.symbol = quoteSummary.Symbol
    this.fallbackName = quoteSummary.FullName

    this._sync()
  }

  async _sync () {
    const [quoteSummary, quoteHistorical] = await Promise.all([
      FinanceService.getQuoteSummary({ symbol: this.symbol, fallbackName: this.fallbackName }),
      FinanceService.getHistoricalQuotes({ symbol: this.symbol })
    ])

    this.destroy_all_children()

    const searchBar = new SearchBar({
      back_screen_name: 'overview',
      showFilterInputBox: false
    })

    searchBar.connect('refresh', () => {
      clearCache()
      this._sync()
    })

    const stockDetails = new StockDetails({ quoteSummary })
    const chart = new Chart({ data: quoteHistorical.Data })

    const chartValueLabel = new St.Label({ style_class: 'chart-hover-label', text: `` })

    // TODO: figure out how we can determine if chart lost focus
    chart.connect('chart-hover', (item, x, y) => {
      chartValueLabel.text = `${(new Date(x)).toLocaleFormat(Translations.FORMATS.DEFAULT_DATE_TIME)} ${roundOrDefault(y)}`
    })

    this.add_child(searchBar)
    this.add_child(stockDetails)

    // FIXME: adding chart throws a lot of "Can't update stage views actor", no clue what is going on here
    this.add_child(chart)
    this.add_child(chartValueLabel)
  }
})
