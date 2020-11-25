const { GLib } = imports.gi

let CACHE = {}
const CACHE_TIME = 10 * 1000

const _MS_PER_SECONDS = 1000
const _MS_PER_MINUTE = 1000 * 60
const _MS_PER_HOUR = 1000 * 60 * 60
const _MS_PER_DAY = 1000 * 60 * 60 * 24

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

var formatDate = (date, format) => {
  if (!format) {
    return date.toISOString()
  }

  let formattedDateString = ''

  for (let i = 0; i < format.length; i++) {
    let char = format[i]

    switch (char) {
      case 'H':
        const hours = date.getHours()
        formattedDateString += hours > 9 ? hours : '0' + hours
        break
      case 'm':
        const minutes = date.getMinutes()
        formattedDateString += minutes > 9 ? minutes : '0' + minutes
        break
      case 'S':
        const seconds = date.getSeconds()
        formattedDateString += seconds > 9 ? seconds : '0' + seconds
        break
      case 'D':
        const day = date.getDate()
        formattedDateString += day > 9 ? day : '0' + day
        break
      case 'M':
        const month = date.getMonth() + 1
        formattedDateString += month > 9 ? month : '0' + month
        break
      case 'Y':
        formattedDateString += date.getFullYear()
        break
      default:
        formattedDateString += char
        break
    }
  }

  return formattedDateString
}

var getHumanReadableData = (relevantDate, compareToDate) => {
  if (!compareToDate) {
    compareToDate = new Date()
  }

  relevantDate = new Date(relevantDate)

  if (!compareToDate || !relevantDate) {
    return
  }

  const diffTime = compareToDate - relevantDate
  let result = ''

  const seconds = Math.floor(diffTime / _MS_PER_SECONDS)
  const minutes = Math.floor(diffTime / _MS_PER_MINUTE)
  const hours = Math.floor(diffTime / _MS_PER_HOUR)

  if (!hours && !minutes) {
    result = seconds + 's'
  } else if (!hours) {
    result = minutes + 'm'
  } else if (hours <= 24) {
    result = hours + 'h'
  } else {
    const compareDateUtc = Date.UTC(compareToDate.getFullYear(), compareToDate.getMonth(), compareToDate.getDate())
    const relevantDateUtc = Date.UTC(relevantDate.getFullYear(), relevantDate.getMonth(), relevantDate.getDate())
    result = Math.floor((compareDateUtc - relevantDateUtc) / _MS_PER_DAY) + 'd'
  }

  return result
}

var roundOrDefault = (number, defaultValue = '--') => isNullOrUndefined(number) ? defaultValue : (Math.round((number + Number.EPSILON) * 100) / 100).toFixed(2)

