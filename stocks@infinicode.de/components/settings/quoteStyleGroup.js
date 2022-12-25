const { Adw, GObject, Gtk, Gdk } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const { QuoteStyleSettings } = Me.imports.helpers.quoteStyleSettings;
const { Translations } = Me.imports.helpers.translations;

var QuoteStyleGroup = class QuoteStyleGroup extends Adw.PreferencesGroup {
  static {
    GObject.registerClass({ GTypeName: 'StockExtension-QuoteStyleGroup' }, this);
  }

  constructor() {
    super({
      title: Translations.SETTINGS.QUOTE_STYLE.GROUP_TITLE
    });

    const quoteStyleSettings = new QuoteStyleSettings();

    this._addRow(new QuoteStylePostiveRow(quoteStyleSettings));
    this._addRow(new QuoteStyleNegativeRow(quoteStyleSettings));
  }

  _addRow(quoteStyleRow) {
    const actionRow = new Adw.ActionRow({
      title: quoteStyleRow.ROW_TITLE
    });

    actionRow.add_suffix(this._getFontButton(quoteStyleRow));
    actionRow.add_suffix(this._getColorButton(quoteStyleRow));

    this.add(actionRow);
  }

  _getFontButton(quoteStyleRow) {
    const fontButton = new Gtk.FontButton({
      title: quoteStyleRow.FONT_CHOOSER
    });

    fontButton.set_font(quoteStyleRow.getFont());
    fontButton.connect('font-set', (widget) => {
      quoteStyleRow.setFont(fontButton.get_font());
    });

    return fontButton;
  }

  _getColorButton(quoteStyleRow) {
    const colorButton = new Gtk.ColorButton({
      title: quoteStyleRow.COLOR_CHOOSER
    });

    colorButton.connect('color-set', (widget) => {
      quoteStyleRow.setQuoteColor(colorButton.get_rgba().to_string());
    });

    const rgba = new Gdk.RGBA();
    rgba.parse(quoteStyleRow.getQuoteColor());
    colorButton.rgba = rgba;

    return colorButton;
  }
}

class QuoteStyleRow {
  ROW_TITLE = '';
  FONT_CHOOSER = '';
  COLOR_CHOOSER = '';

  constructor(quoteStyleSettings) {
    this._quoteStyleSettings = quoteStyleSettings;
  }

  getQuoteColor() { }
  setQuoteColor(value) { }

  getFont() { }
  setFont(value) { }
}

class QuoteStylePostiveRow extends QuoteStyleRow {
  ROW_TITLE = Translations.SETTINGS.QUOTE_STYLE.ROW_POSITIVE;
  FONT_CHOOSER = Translations.SETTINGS.QUOTE_STYLE.FONT_CHOOSER_POSITIVE;
  COLOR_CHOOSER = Translations.SETTINGS.QUOTE_STYLE.COLOR_CHOOSER_POSITIVE;

  constructor(quoteStyleSettings) {
    super(quoteStyleSettings);
  }

  getQuoteColor() {
    return this._quoteStyleSettings.color_positive;
  }

  setQuoteColor(value) {
    this._quoteStyleSettings.color_positive = value;
  }

  getFont() {
    return this._quoteStyleSettings.font_positive;
  }

  setFont(value) {
    this._quoteStyleSettings.font_positive = value;
  }
}

class QuoteStyleNegativeRow extends QuoteStyleRow {
  ROW_TITLE = Translations.SETTINGS.QUOTE_STYLE.ROW_NEGATIVE;
  FONT_CHOOSER = Translations.SETTINGS.QUOTE_STYLE.FONT_CHOOSER_NEGATIVE;
  COLOR_CHOOSER = Translations.SETTINGS.QUOTE_STYLE.COLOR_CHOOSER_NEGATIVE;

  constructor(quoteStyleSettings) {
    super(quoteStyleSettings);
  }

  getQuoteColor() {
    return this._quoteStyleSettings.color_negative;
  }

  setQuoteColor(value) {
    this._quoteStyleSettings.color_negative = value;
  }

  getFont() {
    return this._quoteStyleSettings.font_negative;
  }

  setFont(value) {
    this._quoteStyleSettings.font_negative = value;
  }
}
