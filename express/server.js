'use strict';
const express = require('express');
const path = require('path');
const serverless = require('serverless-http');
const app = express();
const bodyParser = require('body-parser');

const axios = require('axios');

const baseUrl = process.env.DARK_SKY_URL || 'https://api.darksky.net'
const apiKey = process.env.API_KEY || '[[..FILL..IN..API_KEY..]]'

async function forecast(lat, lon) {
  let weatherReport = `${baseUrl}/forecast/${apiKey}/${lat},${lon}`;
  console.log(`---> GET WEATHER at ${lat}, $${lon}`)
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
  res.write('<p>API is just <code>/weather/forecast?[lat],[lon]</code></p>');
  res.end();
});
router.get('/weather/forecast', async (req, res) => { 
  let elements = req.query.geo.split(',')
  let [lat, lon] = elements
  res.json({
    ...(await lookOutside(Number(lat), Number(lon))),
    params: { latitude: Number(lat), longitude: Number(lon) }
  })
  return { statusCode: 200, body: {} }
});
router.post('/', (req, res) => res.json({ postBody: req.body }));

app.use(bodyParser.json());
app.use('/.netlify/functions/server', router);  // path must route to lambda
app.use('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));


// const express = require('express');
// const serverless = require('serverless-http');
// const app = express();
// const bodyParser = require('body-parser');

// async function lookOutside(lat, lon) {
//   return { summary: `hello from qotd-server (you are at ${lat}, ${lon})` };
// }

// app.use(bodyParser);
// app.post('/forecast', (req, res) => {
//     let latitude = req.params['lat']
//     let longitude = req.params['lon']
//     const newValue = await lookOutside(latitude, longitude);
//     res.json(newValue);
// });

module.exports.handler = serverless(app);
