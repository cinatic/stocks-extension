const { Clutter, GObject, Pango, St } = imports.gi

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { fallbackIfNaN, roundOrDefault, getStockColorStyleClass } = Me.imports.helpers.data
const { Translations } = Me.imports.helpers.translations
const { MARKET_STATES } = Me.imports.services.meta.generic

var StockCard = GObject.registerClass({
  GTypeName: 'StockExtension_StockCard'
}, class StockCard extends St.Button {
  _init (quoteSummary) {
    super._init({
      style_class: 'card message stock-card',
      can_focus: true,
      x_expand: true
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
      additionalInformationLabel.text = `${this.cardItem.Symbol}  |  ${this.cardItem.ExchangeName || Translations.UNKNOWN}`
    }

    stockInformationBox.add_child(additionalInformationLabel)

    return stockInformationBox
  }

  _createQuoteInfo () {
    const quoteInformationBox = new St.BoxLayout({
      style_class: 'quote-information-box',
      vertical: true
    })

    const quoteInformationPriceBox = new St.BoxLayout({
      style_class: 'quote-information-price-box tar',
      x_align: Clutter.ActorAlign.END
    })

    const quoteColorStyleClass = getStockColorStyleClass(this.cardItem.Change)

    const regularQuoteLabel = new St.Label({
      style_class: `quote-label ${quoteColorStyleClass}`,
      text: `${roundOrDefault(this.cardItem.Close)}${this.cardItem.CurrencySymbol ? ` ${this.cardItem.CurrencySymbol}` : ''}`
    })

    quoteInformationPriceBox.add_child(regularQuoteLabel)

    if (this.cardItem.MarketState === MARKET_STATES.PRE) {
      const preMarketQuoteColorStyleClass = getStockColorStyleClass(this.cardItem.PreMarketChange)

      const preMarketQuoteLabel = new St.Label({
        style_class: `quote-label pre-market ${preMarketQuoteColorStyleClass}`,
        text: `${roundOrDefault(this.cardItem.PreMarketPrice)}${this.cardItem.CurrencySymbol ? ` ${this.cardItem.CurrencySymbol}` : ''}*`
      })

      quoteInformationPriceBox.add_child(new St.Label({ style_class: 'quote-separation tar', text: ' / ' }))
      quoteInformationPriceBox.add_child(preMarketQuoteLabel)
    }

    if (this.cardItem.MarketState === MARKET_STATES.POST) {
      const postMarketQuoteColorStyleClass = getStockColorStyleClass(this.cardItem.PostMarketChange)

      const postMarketQuoteLabel = new St.Label({
        style_class: `quote-label post-market ${postMarketQuoteColorStyleClass}`,
        text: `${roundOrDefault(this.cardItem.PostMarketPrice)}${this.cardItem.CurrencySymbol ? ` ${this.cardItem.CurrencySymbol}` : ''}*`
      })

      quoteInformationPriceBox.add_child(new St.Label({ style_class: 'quote-separation tar', text: ' / ' }))
      quoteInformationPriceBox.add_child(postMarketQuoteLabel)
    }

    if (!this.cardItem.Error) {
      quoteInformationBox.add_child(quoteInformationPriceBox)
      quoteInformationBox.add_child(this._createRegularAdditionalInformationBox())

      if (this.cardItem.MarketState === MARKET_STATES.PRE) {
        quoteInformationBox.add_child(this._createPreMarketAdditionalInformationBox())
      }

      if (this.cardItem.MarketState === MARKET_STATES.POST) {
        quoteInformationBox.add_child(this._createPostMarketAdditionalInformationBox())
      }
    }

    return quoteInformationBox
  }

  _createRegularAdditionalInformationBox () {
    const quoteColorStyleClass = getStockColorStyleClass(this.cardItem.Change)

    const additionalInformationBox = new St.BoxLayout({
      style_class: 'info-section-box tar',
      x_align: Clutter.ActorAlign.END
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
      text: `  |  ${fallbackIfNaN(Math.round(this.cardItem.Volume / 1000))} k  |  ${(new Date(this.cardItem.Timestamp)).toLocaleFormat(Translations.FORMATS.DEFAULT_DATE_TIME)}`
    })

    additionalInformationLabel.get_clutter_text().set_ellipsize(Pango.EllipsizeMode.NONE)

    additionalInformationBox.add_child(quoteChangeLabel)
    additionalInformationBox.add_child(placeHolder)
    additionalInformationBox.add_child(quoteChangePercentLabel)
    additionalInformationBox.add_child(additionalInformationLabel)

    return additionalInformationBox
  }

  _createPreMarketAdditionalInformationBox () {
    const quoteColorStyleClass = getStockColorStyleClass(this.cardItem.PreMarketChange)

    const additionalInformationBox = new St.BoxLayout({
      style_class: 'info-section-box tar',
      x_align: Clutter.ActorAlign.END
    })

    const quoteChangeLabel = new St.Label({
      style_class: `small-text fwb ${quoteColorStyleClass}`,
      text: `${roundOrDefault(this.cardItem.PreMarketChange)}${this.cardItem.CurrencySymbol ? ` ${this.cardItem.CurrencySymbol}` : ''}`
    })

    const quoteChangePercentLabel = new St.Label({
      style_class: `small-text fwb ${quoteColorStyleClass}`,
      text: `${roundOrDefault(this.cardItem.PreMarketChangePercent)} %`
    })

    const placeHolder = new St.Label({
      style_class: 'small-text fwb',
      text: '  |  '
    })

    const additionalInformationLabel = new St.Label({
      style_class: 'additional-quote-information-label small-text fwb',
      text: ` |  ${Translations.STOCKS.PRE_MARKET}  |  ${(new Date(this.cardItem.PreMarketTimestamp)).toLocaleFormat(Translations.FORMATS.DEFAULT_DATE_TIME)}`
    })

    additionalInformationLabel.get_clutter_text().set_ellipsize(Pango.EllipsizeMode.NONE)

    additionalInformationBox.add_child(quoteChangeLabel)
    additionalInformationBox.add_child(placeHolder)
    additionalInformationBox.add_child(quoteChangePercentLabel)
    additionalInformationBox.add_child(additionalInformationLabel)

    return additionalInformationBox
  }

  _createPostMarketAdditionalInformationBox () {
    const quoteColorStyleClass = getStockColorStyleClass(this.cardItem.PostMarketChange)

    const additionalInformationBox = new St.BoxLayout({
      style_class: 'info-section-box tar',
      x_align: Clutter.ActorAlign.END
    })

    const quoteChangeLabel = new St.Label({
      style_class: `small-text fwb ${quoteColorStyleClass}`,
      text: `${roundOrDefault(this.cardItem.PostMarketChange)}${this.cardItem.CurrencySymbol ? ` ${this.cardItem.CurrencySymbol}` : ''}`
    })

    const quoteChangePercentLabel = new St.Label({
      style_class: `small-text fwb ${quoteColorStyleClass}`,
      text: `${roundOrDefault(this.cardItem.PostMarketChangePercent)} %`
    })

    const placeHolder = new St.Label({
      style_class: 'small-text fwb',
      text: '  |  '
    })

    const additionalInformationLabel = new St.Label({
      style_class: 'additional-quote-information-label small-text fwb',
      text: `  |  ${Translations.STOCKS.POST_MARKET}  |  ${(new Date(this.cardItem.PostMarketTimestamp)).toLocaleFormat(Translations.FORMATS.DEFAULT_DATE_TIME)}`
    })

    additionalInformationLabel.get_clutter_text().set_ellipsize(Pango.EllipsizeMode.NONE)

    additionalInformationBox.add_child(quoteChangeLabel)
    additionalInformationBox.add_child(placeHolder)
    additionalInformationBox.add_child(quoteChangePercentLabel)
    additionalInformationBox.add_child(additionalInformationLabel)

    return additionalInformationBox
  }

  _sync () {
  }

  _onDestroy () {
  }
})
