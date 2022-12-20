
function make_http_request(path,method,timeout,err_callback,success_callback,post_fields,http_user,http_pass)
{
	let http_req = new XMLHttpRequest();
	http_req.open(method,path,true);

	http_req.timeout = timeout * 1000;

	http_req.onload = function()
	{
		if(http_req.status == 200)
			success_callback(http_req);
		else
			err_callback("bad_http_response",http_req);
	};
	
	http_req.setRequestHeader("Authorization", "Basic " + btoa(http_user + ":" + http_pass));
	http_req.ontimeout = function(){err_callback("timeout_expired",http_req);}
	http_req.onerror = function(){err_callback("internal_error",http_req);}

	if(method == "POST")
	{
		http_req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

		let post_data = "";

		for (var key in post_fields)
		{
    			if (post_fields.hasOwnProperty(key))
    				post_data += (encodeURIComponent(key) + "=" + encodeURIComponent(post_fields[key]) + "&");
		}

		post_data = post_data.substring(0, post_data.length - 1);
		http_req.send(post_data);
	}
	else
		http_req.send();

	return http_req;
}

function search_elastic(category,fragment,limit,err_callback,success_callback)
{
	const elastic_host = "localhost";
	const elastic_port = 9200;
	const elastic_username = "elastic";
	const elastic_password = "cpEBH6xO+eulfsms+eoa";
	
	const elastic_url = "https://" + elastic_host + ":" + elastic_port + "/" + category + "/_search?q=" + encodeURIComponent(fragment) + "&size=" + limit;
	let http_request = make_http_request(elastic_url,"GET",20,
	function(req,reason)
	{
		err_callback("request_error: " + reason);
	},
	function(req)
	{
		let server_response = req.responseText;
		
		let json_response = null;
		
		try
		{
			json_response = JSON.parse(server_response);
		}
		catch(e)
		{
			err_callback("elastic_response_inv_json");
			return;
		}
		
		//sanity check // to be completed
		if(!json_response.hasOwnProperty("hits") || !json_response.hits.hasOwnProperty("hits") || !Array.isArray(json_response.hits.hits)) 
		{
			err_callback("bad_elastic_response");
			return;
		}
		
		const elastic_hits = json_response.hits.hits;
		let result = [];
		
		for(let i=0; i<elastic_hits.length; i++)
		{
			if(!elastic_hits[i].hasOwnProperty("_source") || !elastic_hits[i]._source.hasOwnProperty("date") || !elastic_hits[i]._source.hasOwnProperty("price"))
			{
				err_callback("bad_elastic_response_hits_array");
				return;
			}
			
			result.push(elastic_hits[i]._source);
		}
		
		success_callback(result);
		
	},null,elastic_username, elastic_password);
	
	return http_request;
}

function format_chart_pair(date_time, value_open, value_max, value_min, value_close)
{
	let result = {};
	
	result["x"] = new Date(date_time);
	result["y"] = [value_open, value_max, value_min, value_close];
	
	return result;
}

function get_energy_values_day()
{
	const today = new Date();
	let yesterday = new Date();
	
	yesterday.setDate(today.getDate() - 1);
	
	let yesterday_datetime = yesterday.getFullYear() + "-" + (yesterday.getMonth() + 1) + "-" + yesterday.getUTCDate() + "-23";
	
	let energy_data = [];
	search_elastic("energy_price",yesterday_datetime,1,function(reason)
	{
		console.error(reason);
		setTimeout(get_energy_values_day,10000);
	},function(elastic_data)
	{
		if(elastic_data.length > 0) {
			energy_data.push(elastic_data[0].price);
		}
		else {
			energy_data.push(0);
		}
		
		let today_datetime = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getUTCDate();
		search_elastic("energy_price",today_datetime,24,function(reason)
		{
			console.error(reason);
			setTimeout(get_energy_values_day,10000);
		},function(elastic_data2)
		{
			//search for price by hour
			let fast_indexed_energy_data = {};
			for(let i=0; i<elastic_data2.length; i++)
			{
				fast_indexed_energy_data[elastic_data2[i].date] = elastic_data2[i].price;
			}
			
			for(let i=0; i<24; i++)
			{
				let target_datetime = today_datetime + "-" + i;
			
				if(fast_indexed_energy_data.hasOwnProperty(target_datetime))
				{
					energy_data.push(fast_indexed_energy_data[target_datetime]);
				}
				else
				{
					energy_data.push(0);
				}
			}
			
			//compute chart values
			let chart_data_values = [];
			let base_timestamp = new Date(today_datetime).getTime();
			
			for(let i=0; i<24; i++)
			{
				let price_min = Math.min(energy_data[i],energy_data[i + 1]);
				let price_max = Math.max(energy_data[i],energy_data[i + 1]);
				let chart_pair = format_chart_pair(base_timestamp + (3600 * 1000 * i),energy_data[i],price_max,price_min,energy_data[i + 1]);
				chart_data_values.push(chart_pair);
			}
			
			chart.updateSeries([{data: chart_data_values}]);
			
			//compute simple moving averages
			const price_sma = energy_data.reduce((a, b) => a + b, 0) / 25;
			const price_diff = Math.abs(price_sma - energy_data[24]);
			const percentage_diff = (price_diff / price_sma) * 100;
			
			if(percentage_diff > 5)
			{
				if(price_sma > energy_data[24]) {
					set_indicator_needle_high();
				}
				else
				{
					set_indicator_needle_low();
				}
			}
			else
			{
				set_indicator_needle_middle();
			}
		});
	});
}

function get_energy_values_month()
{
	const today = new Date();
	let last_month = new Date();
	
	last_month.setDate(today.getDate() - 30);
	
	let last_month_datetime = last_month.getFullYear() + "-" + (last_month.getMonth() + 1);
	
	let energy_data = [];
	search_elastic("energy_price",last_month_datetime,24 * 40,function(reason)
	{
		console.error(reason);
		setTimeout(get_energy_values_month,10000);
	},function(elastic_data)
	{
		
		let today_datetime = today.getFullYear() + "-" + (today.getMonth() + 1);
		search_elastic("energy_price",today_datetime,24 * 30,function(reason)
		{
			console.error(reason);
			setTimeout(get_energy_values_month,10000);
		},function(elastic_data2)
		{
			//search for price by hour
			let fast_indexed_energy_data = {};
			for(let i=0; i<elastic_data.length; i++)
			{
				fast_indexed_energy_data[elastic_data[i].date] = elastic_data[i].price;
			}
			
			for(let i=0; i<elastic_data2.length; i++)
			{
				fast_indexed_energy_data[elastic_data2[i].date] = elastic_data2[i].price;
			}
			
			//compute chart values
			let chart_data_values = [];
			let base_timestamp = last_month.getTime();
			
			for(let i=0; i<30; i++)
			{
				let target_date = new Date();
				target_date.setDate(today.getDate() - (30 - (i + 1)));	
				let target_datetime = target_date.getFullYear() + "-" + (target_date.getMonth() + 1) +"-" + target_date.getUTCDate();
				
				let day_open = -1;
				let price_min = -1;
				let price_max = -1; 
				let day_close = -1;
				
				for(let j = 0; j<24; j++)
				{
					if(fast_indexed_energy_data.hasOwnProperty(target_datetime + "-" + j))
					{
						energy_data.push(fast_indexed_energy_data[target_datetime + "-" + j]);
						
						if(day_open == -1)
						{
							day_open = fast_indexed_energy_data[target_datetime + "-" + j];
							price_min = day_open;
							price_max = day_open;
							day_close = day_open; 
						}
						else
						{
							day_close = fast_indexed_energy_data[target_datetime + "-" + j];
							if(day_close > price_max) {
								price_max = day_close;
							}
							else if(day_close < price_min) {
								price_min = day_close;
							}
						}
					}	
				}
				
				let chart_pair = format_chart_pair(base_timestamp + (3600 * 24 * 1000 * i),day_open,price_max,price_min,day_close);
				chart_data_values.push(chart_pair);
			}
			
			chart.updateSeries([{data: chart_data_values}]);
			
			//compute simple moving averages
			const price_sma = energy_data.reduce((a, b) => a + b, 0) / 25;
			const price_diff = Math.abs(price_sma - energy_data[energy_data.length - 1]);
			const percentage_diff = (price_diff / price_sma) * 100;
			
			if(percentage_diff > 5)
			{
				if(price_sma > energy_data[energy_data.length - 1]) {
					set_indicator_needle_high();
				}
				else
				{
					set_indicator_needle_low();
				}
			}
			else
			{
				set_indicator_needle_middle();
			}
		});
	});
}

function adjust_elements_position()
{
	let chart_rect = document.getElementById("chart").getBoundingClientRect();
	
	let chart_selector = document.getElementById("chart_selector_container");
	chart_selector.style.top = (chart_rect.top - 30) + "px";
	chart_selector.style.left = chart_rect.left + "px";
	
	let evolution_indicator = document.getElementById("evolution_indicator");
	evolution_indicator.style.top = chart_rect.top + "px";
	evolution_indicator.style.width = chart_rect.width + "px";
	evolution_indicator.style.height = chart_rect.height + "px";
}

var chart = null;
var old_chart_selector_value = "day";


function update_chart_scale(timescale)
{
	if(timescale == "day")
	{
		get_energy_values_day();
	}
	else if(timescale == "month")
	{
		get_energy_values_month();
	}
}

function chart_scale_change_handler()
{
	let chart_selector = document.getElementById("chart_scale_selector");
	let current_value = chart_selector.value;

	if(current_value == old_chart_selector_value)
	{
		return;
	}
		
	old_chart_selector_value = current_value;
	
	update_chart_scale(current_value);
}

function load_page()
{	
	let options = { series: [{ data: []}], chart: { type: 'candlestick', height: 'auto' }, title: { text: 'Energy price (MWh / RON)', align: 'left'}, xaxis: {type: 'datetime', tooltip: {enabled: false}}};
		
	options.tooltip = 
	{
		custom: function (opts) 
		{
  			const current_point = opts.ctx.w.config.series[0].data[opts.dataPointIndex];
 
 			const open = current_point.y[0];
			const high = current_point.y[1];
  			const low = current_point.y[2];
 			const close = current_point.y[3];

  			let change_percent = ((close - open) / open) * 100;

  			let text = "<div class='arrow_box'><span>Open: <b>" + open + "</b></span><br/>";
  			text += "<span>High: <b>" + high + "</b></span><br/>";
  			text += "<span>Low: <b>" + low + "</b></span><br/>";
  			text += "<span>Close: <b>" + close + "</b></span><br/>";
  			text += "<span>Change: <b>" + change_percent.toFixed(2) + "%</b></span></div>";
  						
  			return text;
		}
	};
			      
	chart = new ApexCharts(document.querySelector("#chart"), options);
       	chart.render();
    
    	adjust_elements_position();
    	init_indicator_widget("evolution_indicator");
    		
    	get_energy_values_day();
    	
    	document.getElementById("chart_scale_selector").value = "day";
}

window.onload = load_page;
window.onresize = adjust_elements_position;

