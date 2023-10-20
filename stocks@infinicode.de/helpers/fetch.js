import Soup from 'gi://Soup'

const DEFAULT_TIME_OUT_IN_SECONDS = 10
const DEFAULT_CHROME_USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36'

const Response = class {
  constructor (message, body) {
    this.message = message
    this.body = body

    if (message) {
      this.headers = message.response_headers
      this.url = message.get_uri().to_string()
      this.status = message.status_code
      this.statusText = Soup.Status.get_phrase(this.status)

      this.ok = (this.status === Soup.Status.OK)
    }
  }

  headers () {
    return this.headers
  }

  blob () {
    return this.body
  }

  text () {
    return this.body
  }

  json () {
    try {
      return JSON.parse(this.text())
    } catch (e) {
      return null
    }
  }
}

const appendHeaders = (message, headers) => {
  const headerNames = Object.keys(headers)
  headerNames.forEach(headerName => message.request_headers.append(headerName, headers[headerName]))
}

const appendCookies = (message, rawCookies) => {
  const cookies = rawCookies.map(rawCookie => Soup.Cookie.parse(rawCookie, null))
  Soup.cookies_to_request(cookies, message)
}

const generateQueryString = params => {
  if (!params) {
    return ''
  }

  // filter items without value & create pair list of paramName=paramValue
  const paramKeyValues = Object.keys(params).filter(paramName => params[paramName]).map(paramName => {
    let paramValue = params[paramName]

    if (typeof paramValue === 'boolean') {
      paramValue = paramValue ? 1 : 0
    }

    return `${paramName}=${paramValue}`
  })

  return `?${paramKeyValues.join('&')}`
}

export const fetch = ({ url, method = 'GET', headers, queryParameters, customHttpSession, cookies = null }) => {
  return new Promise(resolve => {
    url = url + generateQueryString(queryParameters)

    // log(`Fetching url: ${url}`)

    const request_message = Soup.Message.new(method, url)

    if (headers) {
      appendHeaders(request_message, headers)
    }

    if (cookies) {
      appendCookies(request_message, cookies)
    }

    const httpSession = customHttpSession || new Soup.Session({
      user_agent: DEFAULT_CHROME_USER_AGENT,
      timeout: DEFAULT_TIME_OUT_IN_SECONDS
    })

    httpSession.send_and_read_async(request_message, null, null, (source, response_message) => {
      let body = ''

      try {
        const bytes = httpSession.send_and_read_finish(response_message)
        const decoder = new TextDecoder()
        body = decoder.decode(bytes.get_data())
      } catch (e) {
        log(`Could not parse soup response body ${e}`)
      }

      const response = new Response(request_message, body)

      resolve(response)
    })
  })
}
