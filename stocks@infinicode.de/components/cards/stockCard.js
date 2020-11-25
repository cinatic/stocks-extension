const { GObject, St } = imports.gi

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { fallbackIfNaN, formatDate, roundOrDefault, getStockColorStyleClass } = Me.imports.helpers.data

var StockCard = GObject.registerClass({
  GTypeName: 'StockExtension.StockCard'
}, class StockCard extends St.Button {
  _init (quoteSummary) {
    super._init({
      style_class: 'card message stock-card',
      can_focus: true,
      x_expand: true,
      hover: true
    })

    this.cardItem = quoteSummary

    let vContentBox = new St.BoxLayout({
      vertical: true,
      x_expand: true
    })
    this.set_child(vContentBox)

    const cardHeaderBox = this._createCardHeader()

    vContentBox.add_child(cardHeaderBox)

    this.connect('destroy', this._onDestroy.bind(this))
    this._sync()
  }

  _createCardHeader () {
    const headerBox = new St.BoxLayout({
      style_class: 'header-box',
      x_expand: true,
      y_align: St.Align.MIDDLE
    })

    const leftBox = this._createStockInfo()
    const rightBox = this._createQuoteInfo()

    headerBox.add_child(leftBox)
    headerBox.add_child(rightBox)

    return headerBox
  }

  _createStockInfo () {
    let stockInformationBox = new St.BoxLayout({
      style_class: 'stock-information-box',
      x_expand: true,
      vertical: true
    })

    const quoteLabel = new St.Label({
      style_class: 'stock-full-name',
      text: this.cardItem.FullName
    })

    stockInformationBox.add_child(quoteLabel)

    const additionalInformationLabel = new St.Label({
      style_class: 'additional-stock-information-label small-text fwb'
    })

    if (this.cardItem.Error) {
      additionalInformationLabel.text = `${this.cardItem.Error}`
    } else {
      additionalInformationLabel.text = `${this.cardItem.Symbol}  |  ${this.cardItem.ExchangeName || 'UNKNOWN'}`
    }

    stockInformationBox.add_child(additionalInformationLabel)

    return stockInformationBox
  }

  _createQuoteInfo () {
    let quoteInformationBox = new St.BoxLayout({
      style_class: 'quote-information-box tar',
      vertical: true,
      x_align: St.Align.END,
      y_align: St.Align.END
    })

    const quoteColorStyleClass = getStockColorStyleClass(this.cardItem.Change)

    const quoteLabel = new St.Label({
      style_class: `quote-label ${quoteColorStyleClass}`,
      text: `${roundOrDefault(this.cardItem.Close)}${this.cardItem.CurrencySymbol ? ` ${this.cardItem.CurrencySymbol}` : ''}`
    })

    quoteInformationBox.add_child(quoteLabel)

    if (!this.cardItem.Error) {
      const additionalInformationBox = new St.BoxLayout({
        style_class: 'info-section-box tar',
        x_align: St.Align.END,
        y_align: St.Align.END
      })

      const quoteChangeLabel = new St.Label({
        style_class: `small-text fwb ${quoteColorStyleClass}`,
        text: `${roundOrDefault(this.cardItem.Change)}${this.cardItem.CurrencySymbol ? ` ${this.cardItem.CurrencySymbol}` : ''}`
      })

      const quoteChangePercentLabel = new St.Label({
        style_class: `small-text fwb ${quoteColorStyleClass}`,
        text: `${roundOrDefault(this.cardItem.ChangePercent)} %`
      })

      const placeHolder = new St.Label({
        style_class: 'small-text fwb',
        text: '  |  '
      })

      const additionalInformationLabel = new St.Label({
        style_class: 'additional-quote-information-label small-text fwb',
        text: `  |  ${fallbackIfNaN(Math.round(this.cardItem.Volume / 1000))} k  |  ${formatDate(new Date(this.cardItem.Timestamp), 'H:m:S D.M.Y')}`
      })

      additionalInformationBox.add_child(quoteChangeLabel)
      additionalInformationBox.add_child(placeHolder)
      additionalInformationBox.add_child(quoteChangePercentLabel)
      additionalInformationBox.add_child(additionalInformationLabel)

      quoteInformationBox.add_child(additionalInformationBox)
    }

    return quoteInformationBox
  }

  _sync () {
  }

  _onDestroy () {
  }
})
