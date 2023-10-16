import Gio from 'gi://Gio'

import { SettingsHandler } from '../helpers/settings.js'
import { TRANSACTION_TYPES } from './meta/generic.js'

export const loadCalculatedTransactionsForSymbol = ({ portfolioId, quoteSummary }) => {
  const settings = new SettingsHandler()
  const transactionsBySymbol = ((settings.transactions[portfolioId] || {})[quoteSummary.Symbol] || []).sort((a, b) => a.date.localeCompare(b.date))
  const sellTransactions = transactionsBySymbol.filter(item => item.type === TRANSACTION_TYPES.SELL)
  const buyTransactions = transactionsBySymbol.filter(item => item.type === TRANSACTION_TYPES.BUY)

  sellTransactions.every(sell => {
    let totalSellAmount = sell.amount

    buyTransactions.filter(item => item.date <= sell.date).every(buy => {
      const soldNow = Math.min(buy.amount - (buy.soldAmount || 0), totalSellAmount)

      buy.soldAmount = (buy.soldAmount || 0) + soldNow
      buy.realized = (buy.realized || 0) + (soldNow * (sell.price - buy.price))
      buy.realizedPercent = (buy.realized / (buy.soldAmount * buy.price)) * 100

      totalSellAmount -= soldNow

      return totalSellAmount // if nothing to sell left go to next sell transaction
    })

    sell.sold = sell.amount - totalSellAmount

    return true
  })

  let realized = null
  let allToday = null
  let allTotal = null
  let totalValue = null
  let totalCost = null
  let unrealizedCost = null

  buyTransactions.forEach(buy => {
    const restAmount = buy.amount - (buy.soldAmount || 0)

    buy.cost = buy.amount * buy.price

    if (!restAmount) {
      buy.today = null
      buy.todayPercent = null
      buy.total = null
      buy.totalPercent = null
    } else {
      buy.unrealizedCost = restAmount * buy.price
      buy.value = restAmount * quoteSummary.Close

      buy.total = restAmount * (quoteSummary.Close - buy.price)
      buy.totalPercent = (buy.total / buy.cost) * 100

      // TODO: check if timestamp is right or if this should be market start or sth
      if ((new Date(buy.date).toDateString()) === (new Date(quoteSummary.Timestamp).toDateString())) {
        buy.today = buy.total
        buy.todayPercent = buy.totalPercent
      } else {
        buy.today = buy.value - (restAmount * quoteSummary.PreviousClose)  // restAmount * quoteSummary.Change
        buy.todayPercent = quoteSummary.ChangePercent
      }

      allToday += buy.today
      allTotal += buy.total
      totalValue += buy.value
      unrealizedCost += buy.unrealizedCost
    }

    totalCost += buy.cost

    if (buy.realized != null) {
      realized += buy.realized
    }
  })

  return {
    transactions: transactionsBySymbol.reverse(),
    today: allToday,
    todayPercent: allToday != null ? (allToday / (totalValue + Math.abs(allToday)) * 100) : null,
    total: allTotal,
    totalPercent: allTotal != null ? (allTotal / unrealizedCost) * 100 : null,
    value: totalValue,
    cost: totalCost,
    unrealizedCost,
    realized,
    realizedPercent: realized != null ? (realized / (totalCost - unrealizedCost)) * 100 : null,
    alltime: allTotal != null ? realized + allTotal : null,
    alltimePercent: allTotal != null ? ((realized + allTotal) / totalCost) * 100 : null
  }
}

export const save = ({ portfolioId, symbol, transaction }) => {
  const settings = new SettingsHandler()
  const transactions = settings.transactions
  const transactionsByPortfolio = transactions[portfolioId] || {}
  const transactionsBySymbol = transactionsByPortfolio[symbol] || []

  const updatedItem = {
    ...transaction,
    price: parseFloat(transaction.price),
    amount: parseInt(transaction.amount),
  }

  if (transaction.id) {
    const index = transactionsBySymbol.findIndex(item => item.id == transaction.id)
    if (index >= 0) {
      transactionsBySymbol[index] = updatedItem
    }
  } else {
    updatedItem.id = Gio.dbus_generate_guid()
    transactionsBySymbol.push(updatedItem)
  }

  transactionsByPortfolio[symbol] = transactionsBySymbol
  transactions[portfolioId] = transactionsByPortfolio

  settings.transactions = transactions
}

export const remove = ({ portfolioId, symbol, transaction }) => {
  const settings = new SettingsHandler()
  const transactions = settings.transactions
  const transactionsByPortfolio = transactions[portfolioId] || {}
  const transactionsBySymbol = transactionsByPortfolio[symbol] || []

  transactionsByPortfolio[symbol] = transactionsBySymbol.filter(item => item.id != transaction.id)
  transactions[portfolioId] = transactionsByPortfolio

  settings.transactions = transactions
}

export const validate = (transaction) => {
  if (isNaN(parseInt(transaction.amount))) {
    return Translations.TRANSACTIONS.INVALID_AMOUNT
  }

  if (isNaN(parseFloat(transaction.price))) {
    return Translations.TRANSACTIONS.INVALID_PRICE
  }

  const timestamp = Date.parse(transaction.date)

  if (isNaN(timestamp)) {
    return Translations.TRANSACTIONS.INVALID_DATE
  }
}
