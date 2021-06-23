const { Clutter, GObject, St } = imports.gi

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { ButtonGroup } = Me.imports.components.buttons.buttonGroup
const { Chart } = Me.imports.components.chart.chart
const { StockDetails } = Me.imports.components.stocks.stockDetails
const { SearchBar } = Me.imports.components.searchBar.searchBar

const { clearCache, roundOrDefault } = Me.imports.helpers.data
const { Translations } = Me.imports.helpers.translations

const { CHART_RANGES } = Me.imports.services.meta.generic
const FinanceService = Me.imports.services.financeService

var StockDetailsScreen = GObject.registerClass({
  GTypeName: 'StockExtension_StockDetailsScreen'
}, class StockDetailsScreen extends St.BoxLayout {
  _init ({ quoteSummary }) {
    super._init({
      style_class: 'screen stock-details-screen',
      vertical: true
    })

    this._passedQuoteSummary = quoteSummary
    this._selectedChartRange = CHART_RANGES.INTRADAY
    this._quoteSummary = null

    this._sync()
  }

  async _sync () {
    const [quoteSummary, quoteHistorical] = await Promise.all([
      FinanceService.getQuoteSummary({
        symbol: this._passedQuoteSummary.Symbol,
        provider: this._passedQuoteSummary.Provider,
        fallbackName: this._passedQuoteSummary.FullName
      }),
      FinanceService.getHistoricalQuotes({
        symbol: this._passedQuoteSummary.Symbol,
        provider: this._passedQuoteSummary.Provider,
        range: this._selectedChartRange
      })
    ])

    this._isIntrayDayChart = CHART_RANGES.INTRADAY === this._selectedChartRange

    this._quoteSummary = quoteSummary

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

    const chartRangeButtonGroup = new ButtonGroup({
      buttons: Object.keys(CHART_RANGES).map(range => ({
        label: Translations.CHART.RANGES[range],
        value: CHART_RANGES[range],
        selected: CHART_RANGES[range] === this._selectedChartRange
      }))
    })

    chartRangeButtonGroup.connect('clicked', (_, stButton) => {
      this._selectedChartRange = stButton.buttonData.value
      this._sync()
    })

    this._chart = new Chart({
      data: quoteHistorical.Data,
      x1: quoteHistorical.MarketStart,
      x2: quoteHistorical.MarketEnd,
      barData: quoteHistorical.VolumeData,
      additionalYData: this._isIntrayDayChart ? [this._quoteSummary.PreviousClose] : [],
      onDraw: this._onChartDraw.bind(this)
    })

    const chartValueLabel = new St.Label({ style_class: 'chart-hover-label', text: `` })

    // TODO: figure out how we can determine if chart lost focus
    this._chart.connect('chart-hover', (item, x, y) => {
      if (!x) {
        chartValueLabel.text = ''
        return
      }

      let text = chartValueLabel.get_clutter_text()
      text.set_markup(`${(new Date(x)).toLocaleFormat(Translations.FORMATS.DEFAULT_DATE_TIME)} <b>${roundOrDefault(y)}</b>`)
    })

    this.add_child(searchBar)
    this.add_child(stockDetails)

    // FIXME: adding chart throws a lot of "Can't update stage views actor", no clue what is going on here
    this.add_child(chartRangeButtonGroup)
    this.add_child(this._chart)
    this.add_child(chartValueLabel)
  }

  _onChartDraw ({ width, height, cairoContext, secondaryColor }) {
    if (this._isIntrayDayChart && this._quoteSummary && this._quoteSummary.PreviousClose) {
      const [minValueY, maxValueY] = this._chart.getYRange()

      const convertedValue = this._chart.encodeValue(this._quoteSummary.PreviousClose, minValueY, maxValueY, 0, height)

      this._chart.draw_line({
        x1: 0,
        x2: width,
        y1: height - convertedValue,
        y2: height - convertedValue,
        color: secondaryColor,
        lineWidth: 1,
        dashed: true,
        cairoContext
      })
    }
  }
})
