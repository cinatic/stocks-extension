const { GLib } = imports.gi

let CACHE = {}
const CACHE_TIME = 10 * 1000

var isNullOrUndefined = value => typeof value === 'undefined' || value === null
var isNullOrEmpty = value => isNullOrUndefined(value) || value.length === 0
var fallbackIfNaN = value => typeof value === 'undefined' || value === null || isNaN(value) ? '--' : value

var closest = (array, target) => array.reduce((prev, curr) => Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev)

var decodeBase64JsonOrDefault = (encodedJson, defaultValue) => {
  try {
    const value = JSON.parse(GLib.base64_decode(encodedJson))

    if (!value) {
      return defaultValue
    }

    return value
  } catch (e) {
    log(`failed to decode base64 json ${e}`)
    return defaultValue
  }
}

var clearCache = () => {
  CACHE = {}
}

var cacheOrDefault = async (cacheKey, evaluator, cacheDuration = CACHE_TIME) => {
  const [timestamp, data] = CACHE[cacheKey] || []

  if (timestamp && data && timestamp + cacheDuration >= Date.now()) {
    return data
  }

  const freshData = await evaluator()

  CACHE[cacheKey] = [Date.now(), freshData]

  return freshData
}

var getStockColorStyleClass = change => {
  let quoteColorStyleClass = 'quote-neutral'

  if (change) {
    if (change > 0.00) {
      quoteColorStyleClass = 'quote-positive'
    } else if (change < 0.00) {
      quoteColorStyleClass = 'quote-negative'
    }
  }

  return quoteColorStyleClass
}

var roundOrDefault = (number, defaultValue = '--') => isNullOrUndefined(number) ? defaultValue : (Math.round((number + Number.EPSILON) * 100) / 100).toFixed(2)

