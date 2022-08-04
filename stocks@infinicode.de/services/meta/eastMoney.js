const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const { CHART_RANGES } = Me.imports.services.meta.generic

// "optimal" roll up for volume bars ~200 items
var INTERVAL_MAPPINGS = {
  [CHART_RANGES.INTRADAY]: '1', // 4m roll up volume data
  [CHART_RANGES.WEEK]: '5', // 5m roll up volume data
  [CHART_RANGES.MONTH]: '5', // 4h roll up volume data
  [CHART_RANGES.HALF_YEAR]: '60', // 24h roll up volume data
  [CHART_RANGES.YEAR_TO_DATE]: '60', // 24h roll up volume data
  [CHART_RANGES.YEAR]: '101', // 48h roll up volume data
  [CHART_RANGES.FIVE_YEARS]: '101', // 240h roll up volume data
  [CHART_RANGES.MAX]: '101' // 480h roll up volume data
}

var MARKETS = {
  0: 'ShenZhen',
  1: 'ShangHai',
  100: 'HangSeng',
  156: 'HongKong'
}
