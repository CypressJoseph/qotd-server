'use strict';
const express = require('express');
const path = require('path');
const serverless = require('serverless-http');
const app = express();
const bodyParser = require('body-parser');

const axios = require('axios');
const cors = require('cors');
const apicache = require('apicache')
let cache = apicache.middleware
 
app.use(cache('5 minutes'))


const baseUrl = process.env.DARK_SKY_URL || 'https://api.darksky.net'
const apiKey = process.env.API_KEY || '[[..FILL..IN..API_KEY..]]'

async function forecast(lat, lon) {
  let weatherReport = `${baseUrl}/forecast/${apiKey}/${lat},${lon}`;
  console.log(`---> GET WEATHER at (lat: ${lat}, long: ${lon})`)
  console.log(`...wait for report from ${weatherReport}`)
  let report = await axios.get(weatherReport);
  return report;
}

async function lookOutside(lat, lon) {
  const response = await forecast(lat, lon)
  const data = response.data;
  let { summary } = data['currently'];
  return { summary };
}

const router = express.Router();
router.get('/', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<h1>Hello from qotd-server!</h1>');
  res.write('<p>API is just <code>/weather/forecast?geo=[lat],[lon]</code></p>');
  res.end();
});
router.get('/weather/forecast', async (req, res) => { 
  req.apicacheGroup = req.query.geo
  console.log("WEATHER PREDICTOR: " + req.query.geo)
  let elements = req.query.geo.split(',')
  console.log(" ----> elements of geo: " + elements)
  let [lat, lon] = elements
  let latitude = Number(lat)
  let longitude = Number(lon)
  let report = await lookOutside(latitude, longitude)
  console.log(" ----> got report: " + JSON.stringify(report))
  res.json({ ...report, params: { latitude, longitude }})
  // return { statusCode: 200, body: report }
});
router.post('/', (req, res) => res.json({ postBody: req.body }));

app.use(cors());
app.use(bodyParser.json());
app.use('/.netlify/functions/server', router);  // path must route to lambda
app.use('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));

module.exports.handler = serverless(app);
