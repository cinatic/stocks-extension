const { Clutter, GObject, St } = imports.gi

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { closest, fallbackIfNaN, isNullOrEmpty, isNullOrUndefined, getComplementaryColor } = Me.imports.helpers.data

var Chart = GObject.registerClass({
  GTypeName: 'StockExtension_Chart',
  Signals: {
    'chart-hover': {
      param_types: [GObject.TYPE_DOUBLE, GObject.TYPE_DOUBLE]
    }
  }
}, class Chart extends St.DrawingArea {
  _init ({ data, x1, x2, barData }) {
    super._init({
      style_class: 'chart',
      reactive: true
    })

    this.data = data
    this.barData = barData

    this.x1 = x1
    this.x2 = x2

    this._selectedX = null
    this._selectedY = null

    this.connect('repaint', this._draw.bind(this))
    this.connect('motion-event', (item, event) => this._onHover(item, event))
  }

  _draw () {
    if (!this.data || !this.data.length) {
      // TODO: show error
      return
    }

    const cairoContext = this.get_context()
    const [width, height] = this.get_surface_size()

    this.width = width
    this.height = height

    // get primary color from themes
    const themeNode = this.get_theme_node()

    // FIXME: it would be nice to have some basic color sets in gnome-shell
    const fgColor = themeNode.get_foreground_color()
    const newColorString = getComplementaryColor(fgColor.to_string().slice(1, 7), false)
    const secondaryColor = Clutter.color_from_string(`${newColorString}ff`)[1]

    const baseParams = {
      cairoContext,
      width,
      height,
      primaryColor: fgColor,
      secondaryColor: secondaryColor
    }

    this._draw_line_chart(baseParams)
    this._draw_volume_bars(baseParams)
    this._draw_crosshair(baseParams)

    // dispose cairo stuff
    cairoContext.$dispose()
  }

  _draw_line_chart ({ width, height, cairoContext, primaryColor }) {
    // scale data to width / height of our cairo canvas
    const seriesData = this._transformSeriesData(this.data, width, height)

    Clutter.cairo_set_source_color(cairoContext, primaryColor)

    // get first data
    const [firstValueX, firstValueY] = [0, 0]

    // tell cairo where to start drawing
    cairoContext.moveTo(firstValueX, height - firstValueY)

    let lastValueX = firstValueX

    seriesData.forEach(([valueX, valueY]) => {
      if (isNullOrUndefined(valueX) || isNullOrUndefined(fallbackIfNaN(valueY, null))) {
        return
      }

      // draw next line
      cairoContext.lineTo(valueX, height - valueY)

      lastValueX = valueX
    })

    // draw line from last point to bottom
    cairoContext.lineTo(lastValueX, height)
    cairoContext.lineTo(firstValueX, height)

    // render
    cairoContext.fill()
  }

  _draw_volume_bars ({ width, height, cairoContext, secondaryColor }) {
    if (isNullOrEmpty(this.barData)) {
      return
    }

    const volumeBarsHeight = height * 0.20 // use the 20% space at bottom
    const seriesData = this._transformSeriesData(this.barData, width, volumeBarsHeight)

    const barWidth = 3
    const barWidthPerSide = barWidth / 3 // left, middle, right

    Clutter.cairo_set_source_color(cairoContext, secondaryColor)

    cairoContext.moveTo(0, height)

    seriesData.forEach(([valueX, valueY]) => {
      if (isNullOrUndefined(valueX) || isNullOrUndefined(fallbackIfNaN(valueY, null))) {
        return
      }

      const x_start = valueX - barWidthPerSide
      const x_end = valueX + barWidthPerSide

      cairoContext.lineTo(x_start, height)
      cairoContext.lineTo(x_start, height - valueY)
      cairoContext.lineTo(x_end, height - valueY)
      cairoContext.lineTo(x_end, height)
    })

    cairoContext.lineTo(0, height)
    cairoContext.fill()
  }

  _draw_crosshair ({ width, height, cairoContext, secondaryColor }) {
    if (this._selectedX) {
      Clutter.cairo_set_source_color(cairoContext, secondaryColor)
      cairoContext.moveTo(this._selectedX - 1, 0)
      cairoContext.lineTo(this._selectedX - 1, height)
      cairoContext.lineTo(this._selectedX, height)
      cairoContext.lineTo(this._selectedX, 0)
      cairoContext.fill()
    }

    if (this._selectedY) {
      Clutter.cairo_set_source_color(cairoContext, secondaryColor)
      cairoContext.moveTo(0, this._selectedY - 1)
      cairoContext.lineTo(width, this._selectedY - 1)
      cairoContext.lineTo(width, this._selectedY)
      cairoContext.lineTo(0, this._selectedY)
      cairoContext.fill()
    }
  }

  _transformSeriesData (data, width, height) {
    if (isNullOrEmpty(data)) {
      return []
    }

    const minValueX = this.x1 || data[0][0]
    const maxValueX = this.x2 || data[data.length - 1][0]

    const yValues = [...data.filter(item => item[1] !== null).map(item => item[1])]

    let minValueY = Math.min(...yValues)
    const maxValueY = Math.max(...yValues)

    // add small buffer to bottom
    minValueY -= (maxValueY - minValueY) * 0.25

    return data.map(([x, y]) => [
      this.encodeValue(x, minValueX, maxValueX, 0, width),
      isNullOrUndefined(y) ? null : this.encodeValue(y, minValueY, maxValueY, 0, height)
    ])
  }

  _onHover (item, event) {
    if (isNullOrEmpty(this.data)) {
      return
    }

    // first get position
    // then convert the position data back to original x value (timestamp)
    // find by this timestamp the closest item in series data

    const [coordX, coordY] = event.get_coords()
    const [positionX, positionY] = item.get_transformed_position()

    const chartX = coordX - positionX
    const chartY = coordY - positionY
    const minX = this.x1 || this.data[0][0]
    const maxX = this.x2 || this.data[this.data.length - 1][0]

    const hoveredValueX = this.decodeValue(chartX, minX, maxX, 0, this.width)
    const originalValueX = closest(this.data.filter(data => data[1] !== null).map(data => data[0]), hoveredValueX)

    const tsItem = this.data.find(data => data[0] === originalValueX)
    this.emit('chart-hover', tsItem[0], tsItem[1])

    this._selectedX = chartX
    this._selectedY = chartY

    this.queue_repaint()
  }

  // thx: https://stackoverflow.com/a/5732390/3828502
  encodeValue (value, minValue, maxValue, encodeMin, encodeMax) {
    return encodeMin + ((encodeMax - encodeMin) / (maxValue - minValue)) * (value - minValue)
  }

  decodeValue (value, minValue, maxValue, encodeMin, encodeMax) {
    return minValue + ((maxValue - minValue) / (encodeMax - encodeMin)) * (value - encodeMin)
  }

})
