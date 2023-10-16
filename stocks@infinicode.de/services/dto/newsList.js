import { fromXML } from '../../helpers/xmlParser.js'

export const NewsList = class NewsList {
  constructor () {
    this.Items = []
    this.Error = null
  }
}

export const NewsPreviewItem = class NewsPreviewItem {
  constructor () {
    this.Description = null
    this.Link = null
    this.Title = null
    this.Date = null
  }
}

export const createNewsListFromYahooData = (responseData, type, error) => {
  const newObject = new NewsList()

  newObject.Error = error

  try {
    const xmlDataObj = fromXML(responseData)
    newObject.Items = xmlDataObj.rss.channel.item.map(newsItem => {
      const previewItem = new NewsPreviewItem()

      previewItem.Description = newsItem.description
      previewItem.Title = newsItem.title
      previewItem.Link = newsItem.link
      previewItem.Date = new Date(newsItem.pubDate)

      return previewItem
    })
  }catch (e) {
    log(`failed to parse news xml ${e}`)
  }

  return newObject
}
