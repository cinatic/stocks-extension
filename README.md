# [stocks-extension](https://extensions.gnome.org/extension/1422/stocks-extension/)
A extension to display stock quotes in GNOME Shell Panel

<p align="middle">
    <img alt="projects" src="https://github.com/cinatic/stocks-extension/raw/master/images/overview.png" width="350">
    <img alt="commits" src="https://github.com/cinatic/stocks-extension/raw/master/images/details.png" width="350">
</p>


*stocks-extension* integrates stock quotes to your GNOME Shell Panel =)

----

## Installation

### Over extensions.gnome.org (EGO)

Install via install button -> https://extensions.gnome.org/extension/1422/stocks-extension/

### Generic (Local installation)

Move files into your locale extension directory (~/.local/share/gnome-shell/extensions/stocks@infinicode.de) and enable the extension via the Tweak Tool, it is **important** to move it to **stocks@infinicode.de** otherwise the extension will not be recognized by GNOME.
Restart GNOME Shell (`Alt`+`F2`, `r`, `Enter`) and enable the extension through *gnome-tweak-tool*.

### Data Source

Yahoo is currently the only provider, if you have some ideas for more let me know and i will gladly integrate it.
It's worth to mention that the data is cached for 10 seconds, click refresh to force a real fresh pull

## Add Stocks

To add stocks you need a yahoo symbol-exchange pair. Search for stocks on yahoo finance and get your symbol

1. Open Settings
2. Click on the + icon on the bottom of the first tab
3. Enter Symbol (yahoo ticker e.g. AHLA.DE) and give it a name

![Screenshot](https://github.com/cinatic/stocks-extension/raw/master/images/settings.png)
