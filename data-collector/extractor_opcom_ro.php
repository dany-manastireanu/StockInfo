<?php

//get energy stats in MWH/EUR
function get_MWH_stats()
{
	$curl_options = array(
	CURLOPT_RETURNTRANSFER => true,
	CURLOPT_FOLLOWLOCATION => true,
	CURLOPT_USERAGENT      => "spider",
	CURLOPT_AUTOREFERER    => true,
	CURLOPT_SSL_VERIFYPEER => false,
	CURLOPT_SSL_VERIFYHOST => false,
	CURLOPT_CONNECTTIMEOUT => 30,
	CURLOPT_TIMEOUT        => 30
	);

	$ch = curl_init("https://www.opcom.ro/opcom/rapoarte/pzu/RaportMarketResults.php?lang=ro");
	curl_setopt_array($ch, $curl_options);
	$content = curl_exec($ch);
	if($content == false)
		return -1;

	$pos1 = strpos($content,"var series1 =");
	if($pos1 === false)
		return -2;

	$pos2 = strpos($content,"yaxis",$pos1);
	if($pos2 === false)
		return -3;
	
	$pos1 += strlen("var series1 =");
	
	//removing white spaces, tabs, empty lines
	//converting data => "data", for json parsing
	$chart_json_raw = str_replace(array("data","\r","\n","\t"," "),array("\"data\""),substr($content,$pos1,$pos2 - $pos1));
	
	//ending the json array
	$chart_json_raw[strlen($chart_json_raw) - 1] = "}";
		
	$chart_json = json_decode($chart_json_raw);
	if($chart_json == NULL)
		return -4;

	if(!property_exists($chart_json,"data") or !is_array($chart_json->data))
		return -5;

	$chart_data = $chart_json->data;
	if(count($chart_data) != 24)
		return -6;

	$result = array();
	
	for($i=0; $i<24; $i++)
	{
		if(count($chart_data[$i]) != 2)
			return -7;
			
		$result[$i] = floatval($chart_data[$i][1]);
	}

	return $result;
}

var_dump(get_MWH_stats());


?>
