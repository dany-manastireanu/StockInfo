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
      const messages = await queueReceiver.receiveMessages(numberOfMessages, {
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

async function sendDataToElastic(data) {
  const indexName = "energy_price";
  
  const client = new Client({
        node: 'https://openelastic.es.eastus2.azure.elastic-cloud.com:9243',
        auth: {
          username: 'elastic',
          password: 'YvptJOOKMpzZS6ryly54AQpv'
        }
    });

  await client.indices.create({
    index: indexName,
    operations: {
      mappings: {
        properties: {
          price: { type: 'double' },
          date: { type: 'date' }
        }
      }
    }
  }, { ignore: [400] })
    
  const operations = data.flatMap(doc => [{ index: { _index: indexName } }, doc])

  const bulkResponse = await client.bulk({ refresh: true, operations })
  
  console.log(JSON.stringify(bulkResponse));
}

async function main() {
    // Receice message from ServiceBus

    const messages = await receiveMessages(1);
    
    // Send data to Elastic
  await sendDataToElastic(messages.flatMap(m => m.body));
}

main().catch((err) => {
  console.log("Data Sender - Error occurred: ", err);
  process.exit(1);
});

