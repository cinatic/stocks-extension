# [stocks-extension](https://extensions.gnome.org/extension/1422/stocks-extension/)
An extension to display stock quotes in the GNOME Shell Panel.

![Screenshot](https://github.com/Qarj/stocks-extension/raw/master/images/extension.png)

*stocks-extension* integrates stock quotes to your GNOME Shell Panel =)

Fork of https://github.com/cinatic/stocks-extension

----

## About this fork

Layout re-arranged - instead of using tiny fonts in a vertical layout, it is now displayed
horizontally with much larger fonts.

Duration between stocks increased from 10 seconds to 99 seconds.

Note that currently the first price won't be shown until 99 seconds after start.

## Installation

This fork needs to be installed manually. The official extension can be
installed at https://extensions.gnome.org/extension/1422/stocks-extension/

```
mkdir ~/git
cd ~/git
git clone https://github.com/Qarj/stocks-extension.git
cd stocks-extension
./install.sh
```

Restart GNOME Shell (`Alt`+`F2`, `r`, `Enter`).

Now enable the extension through *gnome-tweak-tool*.

## Add Stocks

To add stocks you need a yahoo symbol-exchange pair. Search for stocks on yahoo finance and get your symbol.

1. Open Settings
2. Click on the + icon on the bottom of the first tab
3. Enter the symbol-exchange pair (e.g. AHLA.DE) and give it a name

![Screenshot](https://github.com/Qarj/stocks-extension/raw/master/images/settings.png)
