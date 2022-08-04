const { Clutter, GObject, St } = imports.gi

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { ButtonGroup } = Me.imports.components.buttons.buttonGroup
const { Chart } = Me.imports.components.chart.chart
const { StockDetails } = Me.imports.components.stocks.stockDetails
const { SearchBar } = Me.imports.components.searchBar.searchBar

const { clearCache, roundOrDefault, getStockColorStyleClass } = Me.imports.helpers.data
const { Translations } = Me.imports.helpers.translations

const { CHART_RANGES, CHART_RANGES_MAX_GAP } = Me.imports.services.meta.generic
const FinanceService = Me.imports.services.financeService

var StockDetailsScreen = GObject.registerClass({
  GTypeName: 'StockExtension_StockDetailsScreen'
}, class StockDetailsScreen extends St.BoxLayout {
  _init ({ quoteSummary, mainEventHandler }) {
    super._init({
      style_class: 'screen stock-details-screen',
      vertical: true
    })

    this._mainEventHandler = mainEventHandler

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
      showFilterInputBox: false,
      mainEventHandler: this._mainEventHandler
    })

    searchBar.connect('refresh', () => {
      clearCache()
      this._sync()
    })

    const stockDetailsTabButtonGroup = new ButtonGroup({
      style_class: 'stock-details-tab-button-group',
      enableScrollbar: false,
      y_expand: false,
      buttons: ['KeyData', 'NewsList'].map(tabKey => ({
        label: tabKey,
        value: tabKey,
        selected: tabKey === 'KeyData'
      }))
    })

    stockDetailsTabButtonGroup.connect('clicked', (_, stButton) => {
      const selectedTab = stButton.buttonData.value

      if (selectedTab === 'KeyData') {
        this._mainEventHandler.emit('show-screen', {
          screen: 'stock-details',
          additionalData: {
            item: this._passedQuoteSummary
          }
        })
      } else {
        this._mainEventHandler.emit('show-screen', {
          screen: 'stock-news-list',
          additionalData: {
            item: this._passedQuoteSummary
          }
        })
      }
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
      maxGapSize: CHART_RANGES_MAX_GAP[this._selectedChartRange],
      onDraw: this._onChartDraw.bind(this)
    })

    const chartValueHoverBox = new St.BoxLayout({
      style_class: 'chart-hover-box',
      x_align: Clutter.ActorAlign.CENTER
    })

    const chartValueLabel = new St.Label({ style_class: 'chart-hover-label', text: `` })
    const chartValueChangeLabel = new St.Label({ style_class: 'chart-hover-change-label', text: `` })

    chartValueHoverBox.add_child(chartValueLabel)
    chartValueHoverBox.add_child(chartValueChangeLabel)

    // TODO: figure out how we can determine if chart lost focus
    this._chart.connect('chart-hover', (item, x, y) => {
      if (!x) {
        chartValueLabel.text = ''
        chartValueChangeLabel.text = ''
        return
      }

      const changeAbsolute = roundOrDefault(this._quoteSummary.Close - y)
      const changePercentage = roundOrDefault((this._quoteSummary.Close / y * 100) - 100)

      const changeColorStyleClass = getStockColorStyleClass(changePercentage)

      chartValueLabel.text = `${(new Date(x)).toLocaleFormat(Translations.FORMATS.DEFAULT_DATE_TIME)} ${roundOrDefault(y)}`
      chartValueChangeLabel.text = `(${changeAbsolute} / ${changePercentage} %)`
      chartValueChangeLabel.style_class = `chart-hover-change-label ${changeColorStyleClass}`
    })

    this.add_child(searchBar)

    this.add_child(stockDetailsTabButtonGroup)
    this.add_child(stockDetails)

    // FIXME: adding chart throws a lot of "Can't update stage views actor", no clue what is going on here
    this.add_child(chartRangeButtonGroup)
    this.add_child(this._chart)
    this.add_child(chartValueHoverBox)
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
