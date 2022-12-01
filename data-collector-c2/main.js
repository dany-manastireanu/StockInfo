const {
    ServiceBusClient
} = require("@azure/service-bus");

const connectionString = "Endpoint=sb://stockinfo.servicebus.windows.net/;SharedAccessKeyName=all;SharedAccessKey=2ypeUYjs322rbphXb62BlWqsvscu2y3nWYK3uSCul7Y=;EntityPath=primary-queue";
const queueName = "primary-queue";


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

async function main() {
    // Parse and get the prices + date + h

    const prices = Array.from({
        length: 12
    }, (_, __) => ({
        "date": "2022-01-01-22",
        "price": Math.random() * 100
    }));

    const message = {
        contentType: "application/json",
        subject: "StockPrice",
        body: prices
    };

    await sendMessage(message);
}

main().catch((err) => {
    console.log("Data Collector - Error occurred: ", err);
    process.exit(1);
});