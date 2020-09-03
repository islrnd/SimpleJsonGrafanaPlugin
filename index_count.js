/***
Sample Node js Backend for Simple Json Plugin
***/

//Import express,bodyparser,https,loadash
var express = require('express');
var bodyParser = require('body-parser');
var _ = require('lodash');
const https = require('https');
var app = express();

app.use(bodyParser.json());

//var opmanagerdata = require('./sample');


//HTTPS call to the backend needed
function fetchAlarmsOneResponse(){
	let data = '';
    var opmanagerdata = require('./sample');
	https.get('https://webhook.site/3a343795-5203-44a6-992d-2f26e48d6ac7', (res) => {
		console.log('statusCode:', res.statusCode);
		console.log('headers:', res.headers);

		res.on('data', (d) => {
			data=opmanagerdata;
	});

	}).on('error', (e) => {
		console.error(e);
	});
	return opmanagerdata;
}


var annotation = {
  name : "annotation name",
  enabled: true,
  datasource: "Rest datasource",
  showLine: true,
}

var annotations = [
  { annotation: annotation, "title": "Alarms one Test", "time": 1450754160000, text: "test", tags: "testtag" }
];

var tagKeys = [
  {"type":"string","text":"Severity"}
];

var severityTagValues = [
  {'text': 'Critical'},
  {'text': 'Trouble'}
];

var now = Date.now();


var opRowData=[];
var opRowResp=[];

opRowData=fetchAlarmsOneResponse();
if(opRowData.length>0){
  console.log(opRowData.length);
  //iterate the response and frame the table json
  for(i=0;i< opRowData.length;i++){
	  var opresponseData=[];
	  var sevStr=opRowData[i].severityString;
	  var disName=opRowData[i].displayName;
	  var msg=opRowData[i].message;
	  var devName=opRowData[i].deviceName;
	  var ModifiedTime=opRowData[i].modTime;
	  var category=opRowData[i].category;
	  if(msg !==null && msg !=='' && typeof msg !== "undefined"){
	    opresponseData=[sevStr,disName,msg.replace(/[&\/\\#,+()$~.'":*?<>{}]/g, ''),devName,ModifiedTime,category];
	  }
	  for(var j in opresponseData){
		  console.log(opresponseData[j]);
	  }
	  opRowResp.push(opresponseData);
	  
  }
  
}

//method for counting the values
const countOccurrences = (arr, val) => arr.reduce((a, v) => (v === val ? a + 1 : a), 0);

//Method to get count table
function getSeveriyCount(){
	var severityList=[];
	var countjson=[];
	for(i=0;i< opRowData.length;i++){
		var sevStr=opRowData[i].severityString;
		severityList.push(sevStr.toLowerCase());
	}
	console.log(severityList.length);
	
    //  occurrence of critical
    var criticalcount = countOccurrences(severityList,'critical'); 
    //  occurrence of trouble
    var troublecount =  countOccurrences(severityList,'trouble');
    //
	severityList=[['critical',criticalcount],['trouble',troublecount]];
	
    console.log("Crictical count::"+criticalcount);
	console.log("Trouble count::"+troublecount);
	return severityList;
}

var countResp=[];
countResp=getSeveriyCount();


//Variable for grafana table
var table =
  {
    columns: [{text: 'Severity', type: 'string'}, {text: 'Totalcount', type: 'number'}],
    rows: countResp
  };
  
//Setting CORS : Replace with origin needed
function setCORSHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "accept, content-type");  
}

//Methods needed for SimpleJson Grafana Plugin

app.all('/', function(req, res) {
  setCORSHeaders(res);
  res.send('Noc Alarms One Plugin');
  res.end();
});

app.all('/search', function(req, res){
  setCORSHeaders(res);
  var result = ["Severity","Totalcount"];
  res.json(result);
  res.end();
});

app.all('/annotations', function(req, res) {
  setCORSHeaders(res);
  console.log(req.url);
  console.log(req.body);

  res.json(annotations);
  res.end();
});

//Main method for getting the data - supports timeseries and Table
app.all('/query', function(req, res){
  setCORSHeaders(res);
  console.log(req.url);
  console.log(req.body);

  var tsResult = [];
  _.each(req.body.targets, function(target) {
    if (target.type === 'table') {
      tsResult.push(table);
    }
	else{
		console.log("Error - no time series data");
	}
  });
 
  res.json(tsResult);
  res.end();
});

app.all('/tag[\-]keys', function(req, res) {
  setCORSHeaders(res);
  console.log(req.url);
  console.log(req.body);

  res.json(tagKeys);
  res.end();
});

app.all('/tag[\-]values', function(req, res) {
  setCORSHeaders(res);
  console.log(req.url);
  console.log(req.body);

  if (req.body.key == 'Severity') {
    res.json(severityTagValues);
  } else {
    res.json(severityTagValues);
  }
  res.end();
});

app.listen(3335);

console.log("Server is listening to port 3335");
