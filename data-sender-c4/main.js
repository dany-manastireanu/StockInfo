const { ServiceBusClient } = require("@azure/service-bus");
const { Client } = require('@elastic/elasticsearch');
const connectionString = "Endpoint=sb://stockinfo.servicebus.windows.net/;SharedAccessKeyName=all;SharedAccessKey=2ypeUYjs322rbphXb62BlWqsvscu2y3nWYK3uSCul7Y=;EntityPath=primary-queue";
const queueName = "primary-queue";


async function receiveMessages(numberOfMessages) {
    const sbClient = new ServiceBusClient(connectionString);
    const queueReceiver = sbClient.createReceiver(queueName);
  
    let allMessages = [];

    try {
  
      console.log(`Receiving ${numberOfMessages} messages...`);
  
      while (allMessages.length < 1) {
        // NOTE: asking for 10 messages does not guarantee that we will return
        // all 10 at once so we must loop until we get all the messages we expected.
        const messages = await queueReceiver.receiveMessages(10, {
          maxWaitTimeInMs: 6 * 1000,
        });
  
        if (!messages.length) {
          console.log("No more messages to receive");
          break;
        }
  
        console.log(`Received ${messages.length} messages`);
        allMessages.push(...messages);
  
        for (let message of messages) {
          console.log(`  Message: '${JSON.stringify(message.body)}'`);
  
          // completing the message will remove it from the remote queue or subscription.
          await queueReceiver.completeMessage(message);
        }
      }
  
      await queueReceiver.close();
    } finally {
      await sbClient.close();
    }

    return allMessages;
}

async function main() {
    // Receice message from ServiceBus

    const messages = await receiveMessages(1);
    
    // Send data to Elastic

}

main().catch((err) => {
    console.log("ReceiveMessageLoop Sample - Error occurred: ", err);
    process.exit(1);
});

