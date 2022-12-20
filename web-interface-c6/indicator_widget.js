
function deg2rad(deg)
{
	return (Math.PI / 180) * deg;
}

var current_indicator_widget_angle;
var target_indicator_widget_angle;

function init_indicator_widget(parent_id)
{
	let parent_dom  = document.getElementById(parent_id);
	let parent_geometry = parent_dom.getBoundingClientRect();
	
	let indicator_canvas = document.createElement('canvas');
	indicator_canvas.id = "indicator_canvas";
	indicator_canvas.height = parent_geometry.height;
	indicator_canvas.width = parent_geometry.width;
	
	let ctx = indicator_canvas.getContext("2d");
	
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, indicator_canvas.width, indicator_canvas.height);

	let x1 = indicator_canvas.width/2;
	let y1 = indicator_canvas.height/2 * 1.5;
	
	ctx.beginPath();
	ctx.arc(x1,y1,indicator_canvas.height * 0.6,deg2rad(180), deg2rad(230));
	ctx.lineWidth=indicator_canvas.height * 0.06;
	ctx.strokeStyle="red";
	ctx.stroke();
	
	ctx.beginPath();
	ctx.strokeStyle="gray";
	ctx.arc(x1,y1,indicator_canvas.height * 0.6,deg2rad(240), deg2rad(300));
	ctx.stroke();
	
	ctx.beginPath();
	ctx.strokeStyle="green";
	ctx.arc(x1,y1,indicator_canvas.height * 0.6,deg2rad(310), deg2rad(360));
	ctx.stroke();
	 
        ctx.beginPath();
        ctx.fillStyle = "black";
        ctx.arc(x1,y1,indicator_canvas.height * 0.04, 0, 2 * Math.PI);
        ctx.fill();
	
	let r =  indicator_canvas.height * 0.45;
	
	let angle = deg2rad(-90);
	
	ctx.beginPath();
	ctx.strokeStyle = "black";
	ctx.lineWidth=indicator_canvas.height * 0.01;
	ctx.moveTo(x1, y1);
	ctx.lineTo(x1 + r * Math.cos(angle), y1 + r * Math.sin(angle));
	ctx.stroke();
	
	parent_dom.appendChild(indicator_canvas);
	
	current_indicator_widget_angle = angle;
	target_indicator_widget_angle = angle;
	
	let level_text = document.createElement("span");
	level_text.id = "widget_indicator_text";
	level_text.innerHTML = "Neutral";
	
	parent_dom.appendChild(level_text);
}


function adjust_indicator_needle_angle()
{	
	let indicator_canvas = document.getElementById("indicator_canvas");
	
	if(Math.abs(current_indicator_widget_angle - target_indicator_widget_angle) < 0.02)
	{
		let level_text = document.getElementById("widget_indicator_text");
		
		if(current_indicator_widget_angle > deg2rad(-26))
			level_text.innerHTML = "Rising";
			
		else if(current_indicator_widget_angle > deg2rad(-91))
			level_text.innerHTML = "Neutral";
			
		else
			level_text.innerHTML = "Decreasing";
		
		return;
	}	
	
	if(target_indicator_widget_angle > current_indicator_widget_angle)
		current_indicator_widget_angle += 0.02;
	else
		current_indicator_widget_angle -= 0.02;

	let ctx = indicator_canvas.getContext("2d");
	
	let x1 = indicator_canvas.width/2;
	let y1 = indicator_canvas.height/2 * 1.5;
	
	ctx.beginPath();
	ctx.arc(x1,y1,indicator_canvas.height * 0.5, 0, Math.PI * 2);
	ctx.fillStyle="white";
	ctx.fill();
	
	ctx.beginPath();
        ctx.fillStyle = "black";
        ctx.arc(x1,y1,indicator_canvas.height * 0.04, 0, 2 * Math.PI);
        ctx.fill();
	
	let r = indicator_canvas.height * 0.45;
	ctx.beginPath();
	ctx.strokeStyle = "black";
	ctx.lineWidth=indicator_canvas.height * 0.01;
	ctx.moveTo(x1, y1);
	ctx.lineTo(x1 + r * Math.cos(current_indicator_widget_angle), y1 + r * Math.sin(current_indicator_widget_angle));
	ctx.stroke();
	
	setTimeout(adjust_indicator_needle_angle,25);
}

function set_indicator_needle_low()
{
	let indicator_canvas = document.getElementById("indicator_canvas");
	
	target_indicator_widget_angle = deg2rad(-155);
	
	adjust_indicator_needle_angle();
}

function set_indicator_needle_middle()
{
	let indicator_canvas = document.getElementById("indicator_canvas");
	
	target_indicator_widget_angle = deg2rad(-90);
	
	adjust_indicator_needle_angle();
}

function set_indicator_needle_high()
{
	let indicator_canvas = document.getElementById("indicator_canvas");
	
	target_indicator_widget_angle = deg2rad(-25);
	
	adjust_indicator_needle_angle();
}


