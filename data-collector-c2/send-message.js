const { ServiceBusClient } = require("@azure/service-bus");

const connectionString = "Endpoint=sb://stockinfo.servicebus.windows.net/;SharedAccessKeyName=all;SharedAccessKey=2ypeUYjs322rbphXb62BlWqsvscu2y3nWYK3uSCul7Y=;EntityPath=primary-queue";
const queueName = "primary-queue";
const message = {
    contentType: "application/json",
    subject: "StockPrice",
    body: [
        {
            "date": "2022-01-01-22",
            "price": 22.2
        },
        {
            "date": "2022-01-01-21",
            "price": 33.3
        }
    ]
};

async function sendMessage(message) {
    const sbClient = new ServiceBusClient(connectionString);
    try {
        const sender = sbClient.createSender(queueName);
    
        console.log(`Sending all prices for next day`);

        await sender.sendMessages(message);
    
        console.log(`Done sending, closing...`);
        await sender.close();
    } finally {
        sbClient.close();
    }
}


sendMessage(message);