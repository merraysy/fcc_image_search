'use strict';

var dotenv = require('dotenv');
var express = require('express');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var BingSearch = require('bing.search');

dotenv.config();
var port = process.env.PORT || 8080;
var dbUrl = process.env.MONGO_URI;
var appUrl = process.env.APP_URL;

var app = express();
var bingSearch = new BingSearch(process.env.BING_KEY);

mongoose.connect(dbUrl);

var keyword = new Schema({

	keywords: String,
	time: String
	
});

var Keyword = mongoose.model('keyword', keyword);

app.get('/', function(req, res) {
   
   res.end('Perform an images search like this "' + appUrl + '/search/images/{keyword}?offset={Number}"\nCheck the latest search keywords here "' + appUrl + '/latest/keywords"');
    
});

app.param('keyword', function(req, res, next, keyword) {

	req.keyword = keyword;
	
	next();
	
});

app.get('/search/images/:keyword', function(req, res) {
	
	if (req.query.offset) {
		var offset = Number.isInteger(parseInt(req.query.offset)) ? req.query.offset : NaN;
		
		if (isNaN(offset)) {
			res.send({
				offset: NaN,
				errorMsg: 'offset option needs to be a Number'
			});
			return;
		}
	}
	
	var newKeyword = new Keyword();
	
	newKeyword.keywords = req.keyword;
	newKeyword.time = new Date();
	
	newKeyword.save(function(err, keyword) {
	
		if (err) return console.log(err.message);
		
	});
	
	bingSearch.images(req.keyword, 
	{
		skip: offset
	},
	function(err, results) {
		
		if (err) return console.log(err);
		
		var arr = [];
		
		results.forEach(function(result) {
			
			var obj = {};
			
			obj.title = result.title;
			obj.image = result.url;
			obj.thumbnail = result.thumbnail.url;
			obj.sourceUrl = result.sourceUrl;
			
			arr.push(obj);
			
		});
		
		res.json(arr);
		
	});
	
});

app.get('/latest/keywords', function(req, res) {
	
	Keyword.find(null, null, { limit: 10, sort: { time: -1 } }, function(err, keywords) {
		
		if (err) return console.log(err.message);
		
		var result = [];
		
		keywords.forEach(function(keyword) {
		
			var obj = {};
			
			obj.keywords = keyword.keywords;
			obj.time = keyword.time;
			
			result.push(obj);
			
		});
		
		res.json(result);
		
	});
	
});

app.listen(port,  function () {
	console.log('Node.js listening on port ' + port + '...');
});