const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const { QuoteStyleSettings } = Me.imports.helpers.quoteStyleSettings;

var getQuoteStyle = change => {
  const quoteStyle = [];

  if (change) {
    try {
      const quoteStyleSettings = new QuoteStyleSettings();

      if (change > 0) {
        if (quoteStyleSettings.color_positive !== '') {
          quoteStyle.push(`color: ${quoteStyleSettings.color_positive};`);
        }
        if (quoteStyleSettings.font_positive !== '') {
          const font = quoteStyleSettings.font_positive.split(' ');
          const fontFamily = font.slice(0, -1).join(' ');
          const fontSize = font[font.length - 1];
          quoteStyle.push(`font-family: "${fontFamily}";`);
          quoteStyle.push(`font-size: ${fontSize}px;`);
        }
      } else if (change < 0) {
        if (quoteStyleSettings.color_negative !== '') {
          quoteStyle.push(`color: ${quoteStyleSettings.color_negative};`);
        }
        if (quoteStyleSettings.font_negative !== '') {
          const font = quoteStyleSettings.font_negative.split(' ');
          const fontFamily = font.slice(0, -1).join(' ');
          const fontSize = font[font.length - 1];
          quoteStyle.push(`font-family: "${fontFamily}";`);
          quoteStyle.push(`font-size: ${fontSize}px;`);
        }
      }
    } catch (e) {
      log('colors.js: getQuoteStyle: failed', e);
    }
  }

  return quoteStyle.join('');
}
