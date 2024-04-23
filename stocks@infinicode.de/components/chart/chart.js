import Clutter from 'gi://Clutter'
import GObject from 'gi://GObject'
import St from 'gi://St'

import { closest, fallbackIfNaN, isNullOrEmpty, isNullOrUndefined, getComplementaryColor } from '../../helpers/data.js'

export const Chart = GObject.registerClass({
  GTypeName: 'StockExtension_Chart',
  Signals: {
    'chart-hover': {
      param_types: [GObject.TYPE_DOUBLE, GObject.TYPE_DOUBLE]
    }
  }
}, class Chart extends St.DrawingArea {
  _init ({ data, x1, x2, barData, onDraw, additionalYData, maxGapSize }) {
    super._init({
      style_class: 'chart',
      reactive: true
    })

    // time series data, [[x, y]]; x = timestamp , y = value
    // removeTimeGaps probably alter original x value but adds the original to end [[xModified, yOriginal, xOriginal]]
    const [cleanedData, totalTimeShiftMillis] = this.removeTimeGaps(data, maxGapSize)
    this.data = cleanedData

    const [cleanedBarData] = this.removeTimeGaps(barData, maxGapSize)
    this.barData = cleanedBarData

    this.x1 = x1
    this.x2 = x2 - totalTimeShiftMillis

    this._selectedX = null
    this._selectedY = null
    this._onDraw = onDraw
    this._additionalYData = additionalYData || []
    this._userLines = []

    this.connect('repaint', this._draw.bind(this))
    this.connect('button-press-event', this._onClick.bind(this))
    this.connect('motion-event', this._onHover.bind(this))
    this.connect('leave-event', this._onLeave.bind(this))
  }

  _draw () {
    if (isNullOrEmpty(this.data)) {
      // TODO: show empty content hint
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
    const secondaryColor = Clutter.Color.from_string(`${newColorString}ff`)[1]

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
    this._draw_user_lines(baseParams)

    if (this._onDraw) {
      this._onDraw(baseParams)
    }

    // dispose cairo stuff
    cairoContext.$dispose()
  }

  _draw_line_chart ({ width, height, cairoContext, primaryColor }) {
    // scale data to width / height of our cairo canvas
    const seriesData = this._transformSeriesData(this.data, width, height)

    cairoContext.setSourceRGBA(primaryColor.red, primaryColor.green, primaryColor.blue, 0.4);

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

    cairoContext.setSourceRGBA(secondaryColor.red, secondaryColor.green, secondaryColor.blue, 0.5);

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
      this.draw_line({
        y1: 0,
        y2: height,
        x1: this._selectedX,
        x2: this._selectedX,
        cairoContext,
        color: secondaryColor
      })
    }

    if (this._selectedY) {
      this.draw_line({
        x1: 0,
        x2: width,
        y1: this._selectedY,
        y2: this._selectedY,
        cairoContext,
        color: secondaryColor
      })
    }
  }

  _draw_user_lines ({ width, height, cairoContext, secondaryColor }) {
    this._userLines.forEach(userLine => {
      let { x1, x2, y1, y2 } = userLine

      x2 = isNullOrUndefined(x2) ? this._selectedX : x2
      y2 = isNullOrUndefined(y2) ? this._selectedY : y2

      if (!x2 || !y2) {
        return
      }

      this.draw_line({
        x1,
        x2,
        y1,
        y2,
        cairoContext,
        color: Clutter.Color.from_string('#ff0000ff')[1],
        lineWidth: 1.5
      })
    })
  }

  draw_line ({ x1, x2, y1, y2, cairoContext, color, dashed, lineWidth = 0.5 }) {
    cairoContext.setSourceRGBA(color.red, color.green, color.blue, 1);
    cairoContext.setLineWidth(lineWidth)

    if (dashed) {
      cairoContext.setDash([10, 5], 0)
    }

    cairoContext.moveTo(x1, y1)
    cairoContext.lineTo(x2, y2)
    cairoContext.stroke()
  }

  _transformSeriesData (data, width, height) {
    if (isNullOrEmpty(data)) {
      return []
    }

    const [minValueX, maxValueX] = this.getXRange(data)
    const [minValueY, maxValueY] = this.getYRange(data)

    return data.map(([x, y]) => [
      this.encodeValue(x, minValueX, maxValueX, 0, width),
      isNullOrUndefined(y) ? null : this.encodeValue(y, minValueY, maxValueY, 0, height)
    ])
  }

  _onClick (item, event) {
    if (isNullOrEmpty(this.data)) {
      return
    }

    // first get position then
    // check if there is an open userline otherwise open one

    const [coordX, coordY] = event.get_coords()
    const [positionX, positionY] = item.get_transformed_position()

    const chartX = coordX - positionX
    const chartY = coordY - positionY

    const userLine = this._userLines.find(item => isNullOrUndefined(item.x2))

    if (userLine) {
      userLine.x2 = chartX
      userLine.y2 = chartY
    } else {
      this._userLines.push({
        x1: chartX,
        y1: chartY
      })
    }

    this.queue_repaint()
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

    const [minValueX, maxValueX] = this.getXRange()

    const hoveredValueX = this.decodeValue(chartX, minValueX, maxValueX, 0, this.width)
    const originalValueX = closest(this.data.filter(data => data[1] !== null).map(data => data[0]), hoveredValueX)

    const tsItem = this.data.find(data => data[0] === originalValueX)
    this.emit('chart-hover', tsItem[2] || tsItem[0], tsItem[1])

    this._selectedX = chartX
    this._selectedY = chartY

    this.queue_repaint()
  }

  _onLeave () {
    this._selectedX = null
    this._selectedY = null

    this.emit('chart-hover', null, null)

    this.queue_repaint()
  }

  getXRange (data) {
    data = data || this.data

    if (!data) {
      return
    }

    const minValueX = this.x1 || data[0][0]
    const maxValueX = this.x2 || data[data.length - 1][0]

    return [minValueX, maxValueX]
  }

  getYRange (data) {
    data = data || this.data

    if (!data) {
      return
    }

    const yValues = [...this._additionalYData, ...data.map(item => item[1])]
        .filter(item => !isNullOrUndefined(item))
        .map(item => item)

    let minValueY = Math.min(...yValues)
    let maxValueY = Math.max(...yValues)

    // add small buffer
    const buffer = (maxValueY - minValueY) * 0.125
    minValueY -= buffer
    maxValueY += buffer

    return [minValueY, maxValueY]
  }

  removeTimeGaps (data, maxGapInMillis) {
    let totalTimeShiftMillis = 0

    if (!data || !maxGapInMillis) {
      return [data, totalTimeShiftMillis]
    }

    data = data.filter(item => !isNullOrUndefined(item[1]))

    let previousTimeSeriesItem = null

    const gapCleanedData = data.map(item => {
      if (!previousTimeSeriesItem) {
        previousTimeSeriesItem = item
        return item
      }

      const previousX = previousTimeSeriesItem[2] || previousTimeSeriesItem[0]
      const originalX = item[0]
      const originalY = item[1]

      const gapInMillis = originalX - previousX

      if (gapInMillis >= maxGapInMillis) {
        totalTimeShiftMillis += gapInMillis
      }

      const newItem = [originalX - totalTimeShiftMillis, originalY, originalX]

      previousTimeSeriesItem = newItem

      return newItem
    })

    return [gapCleanedData, totalTimeShiftMillis]
  }

  // thx: https://stackoverflow.com/a/5732390/3828502
  encodeValue (value, minValue, maxValue, encodeMin, encodeMax) {
    return encodeMin + ((encodeMax - encodeMin) / (maxValue - minValue)) * (value - minValue)
  }

  decodeValue (value, minValue, maxValue, encodeMin, encodeMax) {
    return minValue + ((maxValue - minValue) / (encodeMax - encodeMin)) * (value - encodeMin)
  }

})
