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

async function elasticDemo() {
    const client = new Client({
        node: 'https://openelastic.es.eastus2.azure.elastic-cloud.com:9243',
        auth: {
          username: 'elastic',
          password: 'YvptJOOKMpzZS6ryly54AQpv'
        }
    });

    await client.indices.create({
        index: 'tweets',
        operations: {
          mappings: {
            properties: {
              id: { type: 'integer' },
              text: { type: 'text' },
              user: { type: 'keyword' },
              time: { type: 'date' }
            }
          }
        }
      }, { ignore: [400] })
    
      const dataset = [{
        id: 1,
        text: 'If I fall, don\'t bring me back.',
        user: 'jon',
        date: new Date()
      }, {
        id: 2,
        text: 'Winter is coming',
        user: 'ned',
        date: new Date()
      }, {
        id: 3,
        text: 'A Lannister always pays his debts.',
        user: 'tyrion',
        date: new Date()
      }, {
        id: 4,
        text: 'I am the blood of the dragon.',
        user: 'daenerys',
        date: new Date()
      }, {
        id: 5, // change this value to a string to see the bulk response with errors
        text: 'A girl is Arya Stark of Winterfell. And I\'m going home.',
        user: 'arya',
        date: new Date()
      }]
    
      const operations = dataset.flatMap(doc => [{ index: { _index: 'tweets' } }, doc])
    
      const bulkResponse = await client.bulk({ refresh: true, operations })
      
      console.log(JSON.stringify(bulkResponse));
}

async function main() {
    // Receice message from ServiceBus

    // const messages = await receiveMessages(1);
    
    // Send data to Elastic
    await elasticDemo();
}

main().catch((err) => {
    console.log("ReceiveMessageLoop Sample - Error occurred: ", err);
    process.exit(1);
});

