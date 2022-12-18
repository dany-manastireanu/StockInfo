const {
    ServiceBusClient
} = require("@azure/service-bus");

const connectionString = "Endpoint=sb://stockinfo.servicebus.windows.net/;SharedAccessKeyName=all;SharedAccessKey=2ypeUYjs322rbphXb62BlWqsvscu2y3nWYK3uSCul7Y=;EntityPath=primary-queue";
const queueName = "primary-queue";


async function sendMessage(message) {
    const sbClient = new ServiceBusClient(connectionString);
    try {
        const sender = sbClient.createSender(queueName);

        console.log(`Sending all prices for the next day`);

        await sender.sendMessages(message);

        console.log(`Done sending, closing...`);
        await sender.close();
    } finally {
        sbClient.close();
    }
}

//error handler
//do whatever you want with it
async function err_handler(err_msg)
{
	console.error("Data Collector - Error occurred: " + err_msg);
    	process.exit(1);
}

//success handler
//send data to pub/sub or do whatever you want
async function success_handler(energy_values)
{
    const message = {
        contentType: "application/json",
        subject: "StockPrice",
        body: JSON.stringify(energy_values)
    };

    await sendMessage(message);
}


async function extract_data_from_req(server_response)
{
	const token1 = "var series2 =";
	const token2 = "yaxis";
	
	let pos1 = server_response.indexOf(token1);
	if(pos1 == -1) 
	{
		err_handler("token1 not present in OPCOM response");
		return;
	}
	
	const pos2 = server_response.indexOf(token2,pos1);
	if(pos2 == -1) 
	{
		err_handler("token2 not present in OPCOM response, after token1 position");
		return;
	}
	
	pos1 += token1.length;
	
	const raw_extracted_js = server_response.substring(pos1,pos2);
	let extracted_js = raw_extracted_js.replace("data","\"data\"").replace(/[ \t\n\r]/g,"").slice(0,-1);
	extracted_js += "}";
	
	let extracted_json = null;
	try
	{
		extracted_json = JSON.parse(extracted_js);
	}
	catch(e)
	{
		err_handler("OPCOM response can not be parsed as JSON");
		return;
	}
	
	if(typeof extracted_json !='object' || !extracted_json.hasOwnProperty("data") || !Array.isArray(extracted_json.data) || extracted_json.data.length != 24)
	{
		err_handler("OPCOM response does not have expected format");
		return;
	}
	
	const today = new Date();
	let tomorrow = new Date();
	tomorrow.setDate(today.getDate() + 1);
	
	let base_datetime = tomorrow.getFullYear() + "-" + (tomorrow.getMonth() + 1) + "-" +  tomorrow.getUTCDate() + "-";
	
	let result = [];
	
	for(let hour = 0; hour < 24; hour++)
	{
		let datetime_key = base_datetime + hour;
		
		if(extracted_json.data[hour].length != 2)
		{
			err_handler("OPCOM response does not have expected format");
			return;
		}
		
		result.push( {datetime: datetime_key, price: parseFloat(extracted_json.data[hour][1])} );
	}
	
	success_handler(result);
}

async function main() 
{
	let http_req = require("https");

	const req_options = 
	{
		host: "www.opcom.ro",
		path: "/acasa/ro",
		rejectUnauthorized: false,
		timeout: 20 * 1000, // 20 secs
		headers: {"User-Agent": "spider" }
	};


	req_callback = function(response) 
	{
  		var str = "";

  		response.on("data", function (chunk) {
    			str += chunk;
  		});

  		response.on("end", function () {
    			extract_data_from_req(str);
  		});
	}

	try
	{
		http_req.request(req_options, req_callback).end();
	}
	catch(e)
	{
		err_handler(e);
	}
}

main().catch((err) => {
    console.error("Data Collector - Error occurred: ", err);
    process.exit(1);
});
