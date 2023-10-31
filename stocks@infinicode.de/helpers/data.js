import GLib from 'gi://GLib'

let CACHE = {}
const CACHE_TIME = 10 * 1000

export const toLocalDateFormat = (date, format) => {
  const parsedDate = new Date(date)
  const glibDateTime = GLib.DateTime.new_from_iso8601(parsedDate.toISOString(), GLib.TimeZone.new_local()).to_local()
  return glibDateTime ? glibDateTime.format(format) : date.toISOString()
}

export const isNullOrUndefined = value => typeof value === 'undefined' || value === null
export const isNullOrEmpty = value => isNullOrUndefined(value) || value.length === 0
export const fallbackIfNaN = (value, fallback = '--') => typeof value === 'undefined' || value === null || isNaN(value) ? fallback : value

export const closest = (array, target) => array.reduce((prev, curr) => Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev)

export const decodeBase64JsonOrDefault = (encodedJson, defaultValue) => {
  if (!encodedJson) {
    return defaultValue
  }

  try {
    const utf8decoder = new TextDecoder()
    const value = JSON.parse(utf8decoder.decode(GLib.base64_decode(encodedJson)))

    if (!value) {
      return defaultValue
    }

    return value
  } catch (e) {
    log(`failed to decode base64 json ${e}`)
    return defaultValue
  }
}

export const clearCache = () => {
  CACHE = {}
}

export const removeCache = (keyToDelete, startsWith = true) => {
  let keys = [keyToDelete]

  if (startsWith) {
    keys = Object.keys(CACHE).filter(key => key.startsWith(keyToDelete))
  }

  keys.forEach(key => delete CACHE[key])
}

export const cacheOrDefault = async (cacheKey, evaluator, cacheDuration = CACHE_TIME) => {
  const [timestamp, data] = CACHE[cacheKey] || []

  if (timestamp && data && timestamp + cacheDuration >= Date.now()) {
    return data
  }

  const freshData = await evaluator()

  CACHE[cacheKey] = [Date.now(), freshData]

  return freshData
}

export const getStockColorStyleClass = change => {
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

export const getComplementaryColor = (hex, bw = true) => {
  const padZero = (str, len) => {
    len = len || 2
    const zeros = new Array(len).join('0')
    return (zeros + str).slice(-len)
  }

  if (hex.indexOf('#') === 0) {
    hex = hex.slice(1)
  }
  // convert 3-digit hex to 6-digits.
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  }
  if (hex.length !== 6) {
    throw new Error('Invalid HEX color.')
  }
  let r = parseInt(hex.slice(0, 2), 16),
      g = parseInt(hex.slice(2, 4), 16),
      b = parseInt(hex.slice(4, 6), 16)
  if (bw) {
    // http://stackoverflow.com/a/3943023/112731
    return (r * 0.299 + g * 0.587 + b * 0.114) > 186
        ? '#000000'
        : '#FFFFFF'
  }
  // invert color components
  r = (255 - r).toString(16)
  g = (255 - g).toString(16)
  b = (255 - b).toString(16)
  // pad each with zeros and return
  return '#' + padZero(r) + padZero(g) + padZero(b)
}

export const moveDecimal = (value, decimalPlaces) => {
  if (!value) {
    return value
  }

  return value / Math.pow(10, decimalPlaces)
}

export const roundOrDefault = (number, defaultValue = '--') => isNullOrUndefined(number) ? defaultValue : (Math.round((number + Number.EPSILON) * 100) / 100).toFixed(2)
