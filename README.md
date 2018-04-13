# stocks-extension
A extension to display stock quotes in GNOME Shell Panel

![Screenshot](https://github.com/cinatic/taskwhisperer/raw/master/images/menu.png)

*stocks-extension* integrates stock quotes to your GNOME Shell Panel =)

The data is fetched is currently only fetched from big g's [finance service](https://finance.google.com)

----

## Installation

After the installation, restart GNOME Shell (`Alt`+`F2`, `r`, `Enter`) and enable the extension through *gnome-tweak-tool*.

It is not yet on extension.gnome.org

### Generic (Local installation)

Move files into your locale extension directory (~/.local/share/gnome-shell/extensions/stocks@infinicode.de) and enable the extension via the Tweak Tool, it is **important** to move it to **stocks@infinicode.de** otherwise the extension will not be recognized by GNOME.

## Add Stocks

To add stocks you need a google symbol-exchange pair. Search for stocks on google and look for something like ETR: XONA or FRA: BMW, NYSE: BABA, NASDAQ: EBAY

1. Open Settings
2. Click on the + icon on the bottom of the first tab
3. Enter the symbol-exchange pair (e.g. ETR: XONA) and give it a name

## ToDo
1. Keep older Quotes in case no new quoates are available
2. Add exchange information & currency data
3. Add Watchlist functionality
4. Add new alternate services for data


## Troubleshooting
### Only n/a is shown or no change / previous close value 
Maybe crawler is broken or exchange is not open, in the case exchange is closed the current quote will be overwritten with null, this will be changed in a later version

## [icons8.com](https://www.icons8.com)
I used the beatiful and dank svg icons from [icons8.com](https://www.icons8.com), i really love you guys, best icon source every!11

:heart: :heart: :heart: :heart: :heart: :heart: :heart: :heart: :heart: :heart: :heart: :heart: :heart: :heart: :point_right: [icons8.com](https://www.icons8.com) :point_left: :heart: :heart: :heart: :heart: :heart: :heart: :heart: :heart: :heart: :heart: :heart: :heart: :heart: :heart: :heart:
