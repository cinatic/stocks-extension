/* jshint esnext:true */
/*
 *  GNOME Shell Extension to display stock quotes
 *
 * Copyright (C) 2018
 *     Florijan Hamzic <florijanh@gmail.com> @ infinicode.de
 *
 * This file is part of gnome-shell-extension-stocks.
 *
 * gnome-shell-extension-stocks is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * gnome-shell-extension-stocks is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gnome-shell-extension-stocks.  If not, see <http://www.gnu.org/licenses/>.
 *
 */


const Shell = imports.gi.Shell;
const Gettext = imports.gettext;
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const EXTENSIONDIR = Me.dir.get_path();

const Convenience = Me.imports.convenience;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Soup = imports.gi.Soup;

const SortOrder = {
    DUE    : 0,
    URGENCY: 1
};

const CLOSE_VALUE_RE = /pcls:([0-9\,\.]*)/;
const FALLBACK_CLOSE_VALUE_RE = /Previous<br>close<br>([0-9,]*)/;
const PREVIOUS_CLOSE_URL = 'https://www.google.com/search?hl=en&gl=en&tbm=fin';
const LAST_QUOTE_URL = 'https://finance.google.com/finance/getprices?hl=en&gl=en';

const _httpSession = new Soup.Session();
_httpSession.user_agent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36";
_httpSession.timeout = 10;


const Quote = class Quote {
    constructor(symbol, quoteData)
    {

        this.Name = null;
        this.Symbol = symbol;
        this.Timestamp = null;
        this.PreviousClose = null;
        this.Close = null;
        this.Open = null;
        this.Low = null;
        this.High = null;
        this.Volume = null;

        if(quoteData)
        {
            [this.Timestamp, this.Close, this.Open, this.High, this.Low, this.Volume] = quoteData;
        }
    }
}

const FinanceService = class FinanceService {
    loadPreviousCloseFromPriceData(symbol, onComplete)
    {
        if(!symbol)
        {
            return;
        }

        const symbolData = symbol.split(":");
        if(!symbolData || symbolData.length < 2)
        {
            return;
        }

        const message = Soup.Message.new('GET', LAST_QUOTE_URL + "&i=25&p=3d" + "&q=" + symbolData[1].toUpperCase() + "&x=" + symbolData[0].toUpperCase());

        _httpSession.queue_message(message, function(_httpSession, message){
            if(!message.response_body.data)
            {
                onComplete.call(this, symbol, null);
                return;
            }

            let quoteData;
            try
            {
                quoteData = this._getPreviousCloseQuote(message.response_body.data, new Date());
            }catch(e)
            {
            }

            const quote = new Quote(symbol, quoteData);

            if(quote && quote.Close)
            {
                onComplete.call(this, symbol, quote.Close);
            }
        });
    }

    /**
     * Loads the data from big g with interval 30s and period 3600s
     * @param symbol googles exchange/symbol pair (e.g. ETR:AHLA, NYSE:DIS, TYO:7974)
     * @param onComplete what to do when request has been completed
     */
    loadLastQuoteAsync(symbol, onComplete)
    {
        if(!symbol)
        {
            return;
        }

        const symbolData = symbol.split(":");

        if(!symbolData || symbolData.length < 2)
        {
            return;
        }

        const message = Soup.Message.new('GET', LAST_QUOTE_URL + "&i=30&p=1h" + "&q=" + symbolData[1].toUpperCase() + "&x=" + symbolData[0].toUpperCase());

        _httpSession.queue_message(message, function(_httpSession, message){
            if(!message.response_body.data)
            {
                onComplete.call(this, symbol, null);
                return;
            }

            let quoteData;
            try
            {
                quoteData = this._getLastQuoteData(message.response_body.data);
            }catch(e)
            {
            }

            const quote = new Quote(symbol, quoteData);
            onComplete.call(this, quote);
        });
    }

    /**
     * Loads the previous close value from big g
     * @param symbol googles exchange/symbol pair (e.g. ETR:AHLA, NYSE:DIS, TYO:7974)
     * @param onComplete what to do when request has been completed
     */
    loadPreviousCloseAsync(symbol, onComplete)
    {
        const message = Soup.Message.new('GET', PREVIOUS_CLOSE_URL + "&q=" + symbol);

        _httpSession.queue_message(message, function(_httpSession, message){
            if(!message.response_body.data)
            {
                onComplete.call(this, symbol, null);
                return;
            }

            try
            {
                const closeValue = this._crawlForPreviousClose(message.response_body.data);

                onComplete.call(this, symbol, closeValue);
            }catch(e)
            {
                onComplete.call(this, symbol, null);
            }
        });
    }

    /**
     * Crawls for previous close price
     * @param html content
     * @returns {*} price as float ... hopefully
     * @private
     */
    _crawlForPreviousClose(html)
    {
        let closeValue = null;

        try
        {
            let matches = CLOSE_VALUE_RE.exec(html);
            closeValue = parseFloat(matches[1].replace(",", ""));

            if(!closeValue)
            {
                matches = FALLBACK_CLOSE_VALUE_RE.ex.exec(html);
                closeValue = parseFloat(matches[1].replace(",", "."));
            }
        }catch(e)
        {
        }

        return closeValue
    }

    /**
     * Load most recent quote
     * @param content big g's finance data
     * @returns {*[]} most recent quote as object
     * @private
     */
    _getLastQuoteData(content)
    {
        if(!content)
        {
            return;
        }

        let close, high, low, open, volume = null;

        let interval = null;
        let intervalCount = null;
        let referenceTimestamp = null;
        const dataRows = content.split('\n');

        for(let i = 0; i < dataRows.length; i++)
        {
            const row = dataRows[i];
            if(!row)
            {
                continue;
            }

            if(row.startsWith("INTERVAL"))
            {
                interval = parseInt(row.replace("INTERVAL=", ""));
                continue;
            }

            if(row.startsWith("a"))
            {
                [referenceTimestamp, close, high, low, open, volume] = row.split(",");
                referenceTimestamp = parseInt(referenceTimestamp.replace("a", ""));
                continue;
            }

            if(!referenceTimestamp)
            {
                continue;
            }

            [intervalCount, close, high, low, open, volume] = row.split(",");
        }

        if(intervalCount && interval)
        {
            referenceTimestamp += (parseInt(intervalCount) * interval);
        }

        return [referenceTimestamp, parseFloat(close.replace(",", "")), parseFloat(open.replace(",", "")), parseFloat(high.replace(",", "")), parseFloat(low.replace(",", "")), parseInt(volume.replace(",", ""))];
    }


    /**
     * Load most recent quote from previous bank day
     * @param content content big g's finance data
     * @param currentDate current bank day
     * @returns undefined|{*[]} most recent quote as object
     * @private
     */
    _getPreviousCloseQuote(content, currentDate)
    {
        if(!content || !currentDate)
        {
            return;
        }

        let timestamp, close, high, low, open, volume = null;

        let interval = null;
        let intervalCount = null;
        let previousData = null;

        const dataRows = content.split('\n');
        const currentDay = [currentDate.getDate(), currentDate.getMonth() + 1, currentDate.getFullYear()].join('');

        for(let i = 0; i < dataRows.length; i++)
        {
            const row = dataRows[i];

            if(!row)
            {
                continue;
            }

            if(row.startsWith("INTERVAL"))
            {
                interval = parseInt(row.replace("INTERVAL=", ""));
                continue;
            }

            if(row.startsWith("a"))
            {
                [timestamp, close, high, low, open, volume] = row.split(",");
                timestamp = parseInt(timestamp.replace("a", ""));
            }
            else
            {
                [intervalCount, close, high, low, open, volume] = row.split(",");
                intervalCount = parseInt(intervalCount);
            }

            if(!timestamp)
            {
                continue;
            }

            if(intervalCount)
            {
                timestamp = timestamp + (intervalCount * interval);
            }

            const rowDate = new Date(timestamp * 1000);

            if([rowDate.getDate(), rowDate.getMonth() + 1, rowDate.getFullYear()].join('') === currentDay)
            {
                break;
            }

            previousData = [timestamp, close, high, low, open, volume];
        }

        [timestamp, close, high, low, open, volume] = previousData;

        return [timestamp, parseFloat(close.replace(",", "")), parseFloat(open.replace(",", "")), parseFloat(high.replace(",", "")), parseFloat(low.replace(",", "")), parseInt(volume.replace(",", ""))];
    }
}
