const { Clutter, GObject, St } = imports.gi

const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { closest, isNullOrUndefined, getStockColorStyleClass } = Me.imports.helpers.data

var Chart = GObject.registerClass({
  GTypeName: 'StockExtension.Chart',
  Signals: {
    'chart-hover': {
      param_types: [GObject.TYPE_DOUBLE, GObject.TYPE_DOUBLE]
    }
  }
}, class Chart extends St.DrawingArea {
  _init ({ data }) {
    super._init({
      style_class: 'chart',
      reactive: true
    })

    this.data = data

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

    const themeNode = this.get_theme_node()

    // scale data to width / height of our cairo canvas
    const seriesData = this._transformSeriesData(this.data, width, height)

    // get primary color from themes
    const fgColor = themeNode.get_foreground_color()
    Clutter.cairo_set_source_color(cairoContext, fgColor)

    // get first data
    const [firstValueX, firstValueY] = seriesData

    // tell cairo where to start drawing
    cairoContext.moveTo(
        firstValueX,
        height - firstValueY
    )

    let lastValueX = firstValueX

    seriesData.forEach(([valueX, valueY]) => {
      if (isNullOrUndefined(valueX) || isNullOrUndefined(valueY)) {
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

    // dispose cairo stuff
    cairoContext.$dispose()
  }

  _transformSeriesData (data, width, height) {
    const [minValueX] = data[0]

    // figure out max X value and max Y value
    // TODO: we assume here x is always time and y always 0 - max
    // TODO: check if this can be done smarter
    const maxValueX = data[data.length - 1][0]
    const maxValueY = Math.max(...data.map(item => item[1]))

    return data.map(([x, y]) => [
      this.encodeValue(x, minValueX, maxValueX, 0, width),
      isNullOrUndefined(y) ? null : this.encodeValue(y, 0, maxValueY, 0, height)
    ])
  }

  _onHover (item, event) {
    // first get position
    // then convert the position data back to original x value (timestamp)
    // find by this timestamp the closest item in series data

    const [coordX] = event.get_coords()
    const [positionX] = item.get_transformed_position()

    const chartX = coordX - positionX
    const minX = this.data[0][0]
    const maxX = this.data[this.data.length - 1][0]

    const hoveredValueX = this.decodeValue(chartX, minX, maxX, 0, this.width)
    const originalValueX = closest(this.data.map(data => data[0]), hoveredValueX)

    const tsItem = this.data.find(data => data[0] === originalValueX)
    this.emit('chart-hover', tsItem[0], tsItem[1])
  }

  // thx: https://stackoverflow.com/a/5732390/3828502
  encodeValue (value, minValue, maxValue, encodeMin, encodeMax) {
    return encodeMin + ((encodeMax - encodeMin) / (maxValue - minValue)) * (value - minValue)
  }

  decodeValue (value, minValue, maxValue, encodeMin, encodeMax) {
    return minValue + ((maxValue - minValue) / (encodeMax - encodeMin)) * (value - encodeMin)
  }

})
