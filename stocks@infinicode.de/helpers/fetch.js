const Soup = imports.gi.Soup

const _httpSession = new Soup.SessionAsync({
  user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36',
  timeout: 10
})

const Response = class {
  constructor (message) {
    this.message = message

    if (message) {
      this.headers = message.response_headers
      this.url = message.get_uri().to_string(false)
      this.status = message.status_code
      this.statusText = Soup.Status.get_phrase(this.status)

      this.ok = (this.status === Soup.Status.OK)
    }
  }

  blob () {
    return this.message.response_body.data
  }

  text () {
    return this.message.response_body.data.toString()
  }

  json () {
    return JSON.parse(this.text())
  }
}

const appendHeaders = (message, headers) => {
  const headerNames = Object.keys(headers)
  headerNames.forEach(headerName => message.request_headers.append(headerName, headers[headerName]))
}

const generateQueryString = params => {
  if (!params) {
    return ''
  }

  // filter items without value & create pair list of paramName=paramValue
  const paramKeyValues = Object.keys(params).filter(paramName => params[paramName]).map(paramName => {
    let paramValue = params[paramName]

    if(typeof paramValue === 'boolean'){
      paramValue = paramValue ? 1 : 0
    }

    return `${paramName}=${paramValue}`
  })

  return `?${paramKeyValues.join('&')}`
}

var fetch = ({ url, method = 'GET', headers, queryParameters }) => {
  return new Promise(resolve => {
    url = url + generateQueryString(queryParameters)

    const request_message = Soup.Message.new(method, url)

    if (headers) {
      appendHeaders(request_message, headers)
    }

    _httpSession.queue_message(request_message, (source, response_message) => {
      const response = new Response(response_message)

      resolve(response)
    })
  })
}
