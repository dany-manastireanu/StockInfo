# High-level architecture
</br>

![StockInfoArch](./images/high-level-arch.png?raw=true "StockInfoArch")

</br></br>

StockInfo application is composend by six components, that are independent between them to achive a higher scalability, performance and fault tolerance.
## Components overview
1. API Component (C1)
2. App - Data Collector Component (C2)
3. PubSub Component (C3)
4. App - Data Sender Component (C4)
5. Elastic Database Component (C5)
6. Kibana Component (C6)
</br>

## Components description
**1. API Component (C1)**
The purpose of this component is to provide information about the price for the stocks/materials/energy.
This component is not developed by us but is necessary in order to obtain the data. C1 should be able to provide the data through a REST call or by providing an easy parsing HTML.
Example of usage of API Component: 

* Yahoo Finance API

    url: `https://query1.finance.yahoo.com/v7/finance/options/{company_symbol}`

    In order to get the information about the stock price from Microsoft we will need to replace the **{company_symbol}** with **MSFT** in the yahoo finance api url.
    The response will be a json, which is easy to parse and get the useful information.

    ```json
    {
                .........................
                "hasMiniOptions": false,
                    "quote": {
                        "region": "US",
                        "currency": "USD",
                        "shortName": "Microsoft Corporation",
                        "longName": "Microsoft Corporation",
                        "exchangeTimezoneName": "America/New_York",
                        "regularMarketPrice": 241.22,
                        "regularMarketDayHigh": 243.74,
                        "regularMarketDayRange": "239.03 - 243.74",
                        "regularMarketDayLow": 239.03,
                        "regularMarketVolume": 27613523,
                .....................
    }
    ```

* Opcom HTML page

    For this data resource, we will rely on creating a parser for the HTML page. The data obtained from this website are in a table and a chart.

    url: `https://www.opcom.ro/opcom/rapoarte/pzu/RaportMarketResults.php?lang=ro`

    ![Opcom](./images/opcom.png?raw=true "Opcom")


**2. App - Data Collector Component (C2)**
**3. PubSub Component (C3)**
**4. App - Data Sender Component (C4)**
**5. Elastic Database Component (C5)**
**6. Kibana Component (C6)**

