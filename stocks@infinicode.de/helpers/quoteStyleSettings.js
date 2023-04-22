const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

var QUOTE_STYLE_COLOR_POSITIVE = 'quote-style-color-positive';
var QUOTE_STYLE_COLOR_NEGATIVE = 'quote-style-color-negative';
var QUOTE_STYLE_FONT_POSITIVE = 'quote-style-font-positive';
var QUOTE_STYLE_FONT_NEGATIVE = 'quote-style-font-negative';

var QuoteStyleSettings = class QuoteStyleSettings {
  constructor() {
    this._settings = ExtensionUtils.getSettings();
  }

  get color_positive() {
    return this._settings.get_string(QUOTE_STYLE_COLOR_POSITIVE);
  }

  set color_positive(value) {
    return this._settings.set_string(QUOTE_STYLE_COLOR_POSITIVE, value);
  }

  get color_negative() {
    return this._settings.get_string(QUOTE_STYLE_COLOR_NEGATIVE);
  }

  set color_negative(value) {
    return this._settings.set_string(QUOTE_STYLE_COLOR_NEGATIVE, value);
  }

  get font_positive() {
    return this._settings.get_string(QUOTE_STYLE_FONT_POSITIVE);
  }

  set font_positive(value) {
    return this._settings.set_string(QUOTE_STYLE_FONT_POSITIVE, value);
  }

  get font_negative() {
    return this._settings.get_string(QUOTE_STYLE_FONT_NEGATIVE);
  }

  set font_negative(value) {
    return this._settings.set_string(QUOTE_STYLE_FONT_NEGATIVE, value);
  }
}
