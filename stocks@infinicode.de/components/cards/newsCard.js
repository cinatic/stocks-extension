import GObject from 'gi://GObject'
import St from 'gi://St'
import Pango from 'gi://Pango'

import { toLocalDateFormat } from '../../helpers/data.js'
import { Translations } from '../../helpers/translations.js'

export const NewsCard = GObject.registerClass({
  GTypeName: 'StockExtension_NewsCard'
}, class NewsCard extends St.Button {
  _init (newsItem, fgColor) {
    super._init({
      style_class: 'card message news-card',
      can_focus: true,
      x_expand: true
    })

    this.cardItem = newsItem
    this._fgColor = fgColor

    const vContentBox = new St.BoxLayout({
      vertical: true,
      x_expand: true
    })
    this.set_child(vContentBox)

    const newsContent = this._createNewsContent()

    vContentBox.add_child(newsContent)

    this.connect('destroy', this._onDestroy.bind(this))
    this._sync()
  }

  _createNewsContent () {
    const newsContentBox = new St.BoxLayout({
      style_class: 'news-content-box',
      x_expand: true,
      vertical: true
    })

    const newsTitleLabel = new St.Label({
      style_class: 'news-title fwb',
      x_expand: true,
      y_expand: true,
      text: this.cardItem.Title
    })

    newsTitleLabel.get_clutter_text().set({
      line_wrap: true,
      line_wrap_mode: Pango.WrapMode.WORD_CHAR,
      ellipsize: Pango.EllipsizeMode.NONE
    })

    newsContentBox.add_child(newsTitleLabel)

    const newsDetailsLabel = new St.Label({
      style_class: 'news-details small-text fwb',
      x_expand: true,
      text: toLocalDateFormat(this.cardItem.Date, Translations.FORMATS.DEFAULT_DATE_TIME)
    })

    newsDetailsLabel.set_style(`border-color: ${this._fgColor};`)

    newsContentBox.add_child(newsDetailsLabel)

    const descriptionLabel = new St.Label({
      style_class: 'news-description',
      x_expand: true,
      text: this.cardItem.Description + '...'
    })

    descriptionLabel.get_clutter_text().set({
      line_wrap: true,
      line_wrap_mode: Pango.WrapMode.WORD_CHAR,
      ellipsize: Pango.EllipsizeMode.NONE
    })

    newsContentBox.add_child(descriptionLabel)

    return newsContentBox
  }

  _sync () {
  }

  _onDestroy () {
  }
})
