import React from 'react'

const TickerTape = () => {
  return (
    <div className="tradingview-widget-container" style={{ width: '100%', height: '78px' }}>
      <iframe
        scrolling="no"
        allowtransparency="true"
        frameBorder="0"
        src="https://www.tradingview-widget.com/embed-widget/ticker-tape/?locale=en#%7B%22symbols%22%3A%5B%7B%22description%22%3A%22ADANIPORT%22%2C%22proName%22%3A%22BSE%3AADANIPORTS%22%7D%2C%7B%22description%22%3A%22APOLLOHOSP%22%2C%22proName%22%3A%22BSE%3AAPOLLOHOSP%22%7D%2C%7B%22description%22%3A%22ASIANPAINT%22%2C%22proName%22%3A%22BSE%3AASIANPAINT%22%7D%2C%7B%22description%22%3A%22AXISBANK%22%2C%22proName%22%3A%22BSE%3AAXISBANK%22%7D%2C%7B%22description%22%3A%22BAJAJ_AUTO%22%2C%22proName%22%3A%22BSE%3ABAJAJ_AUTO%22%7D%2C%7B%22description%22%3A%22BAJAJFINSV%22%2C%22proName%22%3A%22BSE%3ABAJAJFINSV%22%7D%2C%7B%22description%22%3A%22BAJFINANCE%22%2C%22proName%22%3A%22BSE%3ABAJFINANCE%22%7D%2C%7B%22description%22%3A%22BHARTIARTL%22%2C%22proName%22%3A%22BSE%3ABHARTIARTL%22%7D%2C%7B%22description%22%3A%22BPCL%22%2C%22proName%22%3A%22BSE%3ABPCL%22%7D%2C%7B%22description%22%3A%22BRITANNIA%22%2C%22proName%22%3A%22BSE%3ABRITANNIA%22%7D%2C%7B%22description%22%3A%22CIPLA%22%2C%22proName%22%3A%22BSE%3ACIPLA%22%7D%2C%7B%22description%22%3A%22COALINDIA%22%2C%22proName%22%3A%22BSE%3ACOALINDIA%22%7D%2C%7B%22description%22%3A%22DIVISLAB%22%2C%22proName%22%3A%22BSE%3ADIVISLAB%22%7D%2C%7B%22description%22%3A%22DRREDDY%22%2C%22proName%22%3A%22BSE%3ADRREDDY%22%7D%2C%7B%22description%22%3A%22EICHERMOT%22%2C%22proName%22%3A%22BSE%3AEICHERMOT%22%7D%2C%7B%22description%22%3A%22GRASIM%22%2C%22proName%22%3A%22BSE%3AGRASIM%22%7D%2C%7B%22description%22%3A%22HCLTECH%22%2C%22proName%22%3A%22BSE%3AHCLTECH%22%7D%2C%7B%22description%22%3A%22HDFC%22%2C%22proName%22%3A%22BSE%3AHDFC%22%7D%2C%7B%22description%22%3A%22HDFCBANK%22%2C%22proName%22%3A%22BSE%3AHDFCBANK%22%7D%2C%7B%22description%22%3A%22HDFCLIFE%22%2C%22proName%22%3A%22BSE%3AHDFCLIFE%22%7D%2C%7B%22description%22%3A%22HEROMOTOCO%22%2C%22proName%22%3A%22BSE%3AHEROMOTOCO%22%7D%2C%7B%22description%22%3A%22HINDALCO%22%2C%22proName%22%3A%22BSE%3AHINDALCO%22%7D%2C%7B%22description%22%3A%22HINDUNILVR%22%2C%22proName%22%3A%22BSE%3AHINDUNILVR%22%7D%2C%7B%22description%22%3A%22ICICIBANK%22%2C%22proName%22%3A%22BSE%3AICICIBANK%22%7D%2C%7B%22description%22%3A%22INDUSINDBK%22%2C%22proName%22%3A%22BSE%3AINDUSINDBK%22%7D%2C%7B%22description%22%3A%22INFY%22%2C%22proName%22%3A%22BSE%3AINFY%22%7D%2C%7B%22description%22%3A%22ITC%22%2C%22proName%22%3A%22BSE%3AITC%22%7D%2C%7B%22description%22%3A%22JSWSTEEL%22%2C%22proName%22%3A%22BSE%3AJSWSTEEL%22%7D%2C%7B%22description%22%3A%22KOTAKBANK%22%2C%22proName%22%3A%22BSE%3AKOTAKBANK%22%7D%2C%7B%22description%22%3A%22LT%22%2C%22proName%22%3A%22BSE%3ALT%22%7D%2C%7B%22description%22%3A%22M%26M%22%2C%22proName%22%3A%22BSE%3AM_M%22%7D%2C%7B%22description%22%3A%22MARUTI%22%2C%22proName%22%3A%22BSE%3AMARUTI%22%7D%2C%7B%22description%22%3A%22NESTLEIND%22%2C%22proName%22%3A%22BSE%3ANESTLEIND%22%7D%2C%7B%22description%22%3A%22NTPC%22%2C%22proName%22%3A%22BSE%3ANTPC%22%7D%2C%7B%22description%22%3A%22ONGC%22%2C%22proName%22%3A%22BSE%3AONGC%22%7D%2C%7B%22description%22%3A%22POWERGRID%22%2C%22proName%22%3A%22BSE%3APOWERGRID%22%7D%2C%7B%22description%22%3A%22RELIANCE%22%2C%22proName%22%3A%22BSE%3ARELIANCE%22%7D%2C%7B%22description%22%3A%22SBILIFE%22%2C%22proName%22%3A%22BSE%3ASBILIFE%22%7D%2C%7B%22description%22%3A%22SBIN%22%2C%22proName%22%3A%22BSE%3ASBIN%22%7D%2C%7B%22description%22%3A%22SHREECEM%22%2C%22proName%22%3A%22BSE%3ASHREECEM%22%7D%2C%7B%22description%22%3A%22SUNPHARMA%22%2C%22proName%22%3A%22BSE%3ASUNPHARMA%22%7D%2C%7B%22description%22%3A%22TATACONSUM%22%2C%22proName%22%3A%22BSE%3ATATACONSUM%22%7D%2C%7B%22description%22%3A%22TATAMOTORS%22%2C%22proName%22%3A%22BSE%3ATATAMOTORS%22%7D%2C%7B%22description%22%3A%22TATASTEEL%22%2C%22proName%22%3A%22BSE%3ATATASTEEL%22%7D%2C%7B%22description%22%3A%22TCS%22%2C%22proName%22%3A%22BSE%3ATCS%22%7D%2C%7B%22description%22%3A%22TECHM%22%2C%22proName%22%3A%22BSE%3ATECHM%22%7D%2C%7B%22description%22%3A%22TITAN%22%2C%22proName%22%3A%22BSE%3ATITAN%22%7D%2C%7B%22description%22%3A%22ULTRACEMCO%22%2C%22proName%22%3A%22BSE%3AULTRACEMCO%22%7D%2C%7B%22description%22%3A%22UPL%22%2C%22proName%22%3A%22BSE%3AUPL%22%7D%2C%7B%22description%22%3A%22WIPRO%22%2C%22proName%22%3A%22BSE%3AWIPRO%22%7D%5D%2C%22showSymbolLogo%22%3Atrue%2C%22colorTheme%22%3A%22dark%22%2C%22isTransparent%22%3Afalse%2C%22displayMode%22%3A%22adaptive%22%2C%22width%22%3A%22100%25%22%2C%22height%22%3A78%2C%22utm_source%22%3A%22www.indiainvestkaro.com%22%2C%22utm_medium%22%3A%22widget_new%22%2C%22utm_campaign%22%3A%22ticker-tape%22%2C%22page-uri%22%3A%22www.indiainvestkaro.com%2F%22%7D"
        title="ticker tape TradingView widget"
        lang="en"
        style={{ userSelect: 'none', boxSizing: 'border-box', display: 'block', height: '46px', width: '100%' }}
      ></iframe>
      <div className="tradingview-widget-copyright">
        <a href="https://www.tradingview.com/?utm_source=www.indiainvestkaro.com&amp;utm_medium=widget_new&amp;utm_campaign=ticker-tape" rel="noopener" target="_blank">
          <span className="blue-text"></span>
        </a>
      </div>

      <style>{`
        .tradingview-widget-copyright {
          font-size: 13px !important;
          line-height: 32px !important;
          text-align: center !important;
          vertical-align: middle !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif !important;
          color: #B2B5BE !important;
        }

        .tradingview-widget-copyright .blue-text {
          color: #2962FF !important;
        }

        .tradingview-widget-copyright a {
          text-decoration: none !important;
          color: #B2B5BE !important;
        }

        .tradingview-widget-copyright a:visited {
          color: #B2B5BE !important;
        }

        .tradingview-widget-copyright a:hover .blue-text {
          color: #1E53E5 !important;
        }

        .tradingview-widget-copyright a:active .blue-text {
          color: #1848CC !important;
        }

        .tradingview-widget-copyright a:visited .blue-text {
          color: #2962FF !important;
        }
      `}</style>
    </div>
  )
}

export default TickerTape
