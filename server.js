const express = require('express');
const mongoose = require('mongoose');
const fetch = require('node-fetch');
const MongoClient = require('mongodb').MongoClient;
const app = express();
const port = 3000;
require('dotenv').config()
const MONGO_URL=process.env.MONGO_URL
// Set up MongoDB connection
//const uri = 'mongodb+srv://Tejaswi:test1234@cluster0.dkkurey.mongodb.net/OpenWeatherApp?retryWrites=true&w=majority';
const client = new MongoClient(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set("strictQuery", false);
mongoose.connect(MONGO_URL).then(()=>{
    console.log("connected")
}).catch((err)=>[
    console.log(err)
])

// Handle requests to fetch weather data
app.get('/weather', async (req, res) => {
  const location = req.query.location;
  if (!location) {
    res.status(400).send('Location parameter is required');
    return;
  }

  const apiKey = 'b443046e4c442f88958662ec2a4c954e';
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`;

  try {
    // Fetch weather data from API
    const response = await fetch(apiUrl);
    const data = await response.json();

    // Store weather data in MongoDB
    const collection = client.db('OpenWeatherApp').collection('Weather');
    const result = await collection.insertOne(data);
    console.log(`Stored weather data for ${location} in MongoDB`);

    // Determine weather image based on temperature
    let image;
    if (data.main.temp < 0) {
      image = 'https://merriam-webster.com/assets/mw/images/article/art-wap-landing-mp-lg/snowflake-3317-423a9ae38f3342e0c130c5473fee6d3c@1x.jpg'; // snowflake
    } else if (data.main.temp < 10) {
      image = 'https://media.cnn.com/api/v1/images/stellar/prod/221220154109-01-cold-weather-safety.jpg?c=original'; // cold
    } else if (data.main.temp < 20) {
      image = 'https://thumbs.dreamstime.com/b/young-man-tightening-body-outdoors-cold-weather-black-clouds-36567607.jpg'; // cool
    } else if (data.main.temp < 30) {
      image = 'https://www.familynursingcare.com/wp-content/uploads/2021/06/1-min-1024x576.png'; // warm
    } else {
      image = 'https://health.clevelandclinic.org/wp-content/uploads/sites/3/2015/05/hotSummerDiabetes-1243760572-770x533-1.jpg'; // hot
    }

    // Display weather data on web page
    const html = `
    <center >
    <div style="
    
    background: #000000d0;
    color: white;
    padding: 2em;
    border-radius: 30px;
    width: 100%;
    max-width: 420px;
    margin: 1em;
  ">

   
      <h2 style="
        font-weight:bold;
        align-items:center;
        text-shadow:1px 0.5px gray;

      
      ">Current weather for ${location}</h2>
     
      <img src="${image}" alt="Weather image"
      style="
      border-radius:10px;
      border:1px 1px solid black;
      width:250px;
      height:250px;
      ">
      <p style={
        color:
      }>Temperature: ${data.main.temp} °C</p>
      <p>Feels like: ${data.main.feels_like} °C</p>
      <p>Humidity: ${data.main.humidity}%</p>
      <p>Wind speed: ${data.wind.speed} m/s</p>
     
      </div>
      </center>
    `;
    res.send(html);
  } catch (err) {
    console.log(err);
    res.status(500).send('An error occurred');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
