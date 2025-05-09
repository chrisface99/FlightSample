const FILE_URL = 'https://celebrated-tarsier-547bd3.netlify.app/flightsnetlify/flights.json'
const OPENWEATHER_API_KEY = 'd34469173c876dc3e734f40f63a5aa5c'
const OPENWEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather?units=metric&lang=pl&q='
const ARRIVAL_FILE_URL = 'https://celebrated-tarsier-547bd3.netlify.app/flightsnetlify/flights.json'; 

const departureTableBody = document.querySelector('#departure-table tbody')
const arrivalTableBody = document.querySelector('#arrival-table tbody')

// Weather for current location (WAW)
const AIRPORT_LOCATION = 'WARSAW'

let userTicker = "Welcome to the Airport Flight Information System!";
let userTickerDirection = "left"; // "left" or "right"
let userTickerSpeed = 60; // Speed from 1 (slow) to 100 (fast)
let userTickerFrequency = 20; // Frequency in seconds to show the default message
let flightStatusUpdates = []; // Array to store flight status updates
let showDefaultTicker = false; // Flag to control when to show the default ticker

let rowsCount = 12; // Default number of rows visible

function createTicker() {
  const ticker = document.createElement("div");
  ticker.id = "ticker";
  ticker.innerHTML = `<span id="ticker-text">${userTicker}</span>`;
  document.body.appendChild(ticker);

  const tickerText = document.getElementById("ticker-text");
  let position = userTickerDirection === "left" ? window.innerWidth : -tickerText.offsetWidth;

  function moveTicker() {
    if (userTickerDirection === "left") {
      position -= userTickerSpeed / 10;
      if (position < -tickerText.offsetWidth) {
        position = window.innerWidth;
        updateTickerText(); // Update ticker text when it loops
      }
    } else {
      position += userTickerSpeed / 10;
      if (position > window.innerWidth) {
        position = -tickerText.offsetWidth;
        updateTickerText(); // Update ticker text when it loops
      }
    }
    tickerText.style.transform = `translateX(${position}px)`;
    requestAnimationFrame(moveTicker);
  }

  moveTicker();
}

function updateTickerText() {
  if (showDefaultTicker) {
    document.getElementById("ticker-text").textContent = userTicker;
  } else if (flightStatusUpdates.length > 0) {
    const update = flightStatusUpdates.shift(); // Get the next update
    document.getElementById("ticker-text").textContent = update;
    flightStatusUpdates.push(update); // Re-add it to the end of the array
  }
}

function addFlightStatusUpdate(flight, type) {
  const time = new Date(flight[type].scheduled).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const city = getCityNameFromIATA(flight[type === "departure" ? "arrival" : "departure"].iata || "Unknown");
  const update = `Flight ${flight.flight.iata} ${type === "departure" ? "to" : "from"} ${city} is scheduled at ${time}.`;
  flightStatusUpdates.push(update);
}

function startTickerDefaultMessageTimer() {
  setInterval(() => {
    showDefaultTicker = true;
    setTimeout(() => {
      showDefaultTicker = false;
    }, 5000); // Show the default message for 5 seconds
  }, userTickerFrequency * 1000);
}

// Example: Update iataCodeCity dynamically
iataCodeCity = "JFK"; // Change to a different airport code if needed
document.getElementById("airport-code").textContent = iataCodeCity;

function adjustVisibleRows() {
  const rowHeight = 50;
  const headerHeight = 150;
  const tickerHeight = 50; // Reserve space for the ticker
  const availableHeight = window.innerHeight - headerHeight - tickerHeight;
  return Math.min(rowsCount, Math.max(5, Math.floor(availableHeight / rowHeight)));
}

// Update visibleRows calculation
const visibleRows = adjustVisibleRows();

// Update clock and date
function updateClock() {
  const now = new Date();
  const options = { weekday: 'long' };
  document.getElementById("current-day").textContent = now.toLocaleDateString("en-US", options);
  document.getElementById("current-date").textContent = now.toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' });
  document.getElementById("current-time").textContent = now.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: false });
}

// Update local weather
async function updateLocalWeather() {
  try {
    const response = await fetch(`${OPENWEATHER_URL}${AIRPORT_LOCATION}&appid=${OPENWEATHER_API_KEY}`);
    const data = await response.json();
    
    if (data.main && data.weather) {
      document.getElementById("current-temp").textContent = `${Math.round(data.main.temp)}°`;
      document.getElementById("weather-condition").textContent = data.weather[0].main;
      
      // Update weather icon based on condition
      const weatherIcon = document.querySelector(".weather-icon");
      const weatherCondition = data.weather[0].main.toLowerCase();
      
      if (weatherCondition.includes('clear')) {
        weatherIcon.textContent = '☀️';
      } else if (weatherCondition.includes('cloud')) {
        weatherIcon.textContent = '☁️';
      } else if (weatherCondition.includes('rain') || weatherCondition.includes('drizzle')) {
        weatherIcon.textContent = '🌧️';
      } else if (weatherCondition.includes('snow')) {
        weatherIcon.textContent = '❄️';
      } else if (weatherCondition.includes('thunderstorm')) {
        weatherIcon.textContent = '⛈️';
      } else {
        weatherIcon.textContent = '🌤️';
      }
    }
  } catch (error) {
    console.error("Error fetching local weather:", error);
  }
}

// Fetch flight data from JSON
async function fetchFlights() {
  try {
    const response = await fetch(FILE_URL);
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching flight data:", error);
    return [];
  }
}

// Fetch arrival data from JSON
async function fetchArrivals() {
  try {
    const response = await fetch(ARRIVAL_FILE_URL);
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching arrival data:", error);
    return [];
  }
}

// Weather cache
const weatherCache = {};

async function fetchWeather(city) {
  const now = Date.now();

  // Check if weather data for this city exists and is less than 1 hour old
  if (weatherCache[city] && now - weatherCache[city].timestamp < 3600000) {
    return weatherCache[city].data;
  }

  try {
    const response = await fetch(`${OPENWEATHER_URL}${city}&appid=${OPENWEATHER_API_KEY}`);
    const data = await response.json();

    if (data.main && data.weather) {
      const weatherData = {
        temp: `${Math.round(data.main.temp)}°C`,
        icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`
      };

      // Store in cache with a timestamp
      weatherCache[city] = { data: weatherData, timestamp: now };

      return weatherData;
    }
  } catch (error) {
    console.error(`Error fetching weather for ${city}:`, error);
  }

  return { temp: "N/A", icon: "" };
}

// Gate cache
const gateCache = {};

// Status options
const statusOptions = ["On Time", "Boarding", "Delayed", "Cancelled"];
const statusClasses = ["on-time", "boarding", "delayed", "cancelled"];

// Fetch airline icon with fallback
async function fetchAirlineIcon(airlineCode) {
  const primaryUrl = `https://airlinecodes.info/airlinelogos/${airlineCode}.svg`;
  const fallbackUrl = `./icons/${airlineCode}.svg`; // Updated to use the local icons folder

  try {
    const response = await fetch(primaryUrl);
    if (response.ok) {
      return primaryUrl;
    } else {
      const fallbackResponse = await fetch(fallbackUrl);
      if (fallbackResponse.ok) {
        return fallbackUrl;
      }
    }
  } catch (error) {
    console.error(`Error fetching airline icon for ${airlineCode}:`, error);
  }
  return ''; // Return an empty string if both URLs fail
}

// Update departure table
async function updateDepartureTable(flights) {
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();

  // Filter only future flights
  let upcomingFlights = flights.filter(flight => {
    const flightTime = new Date(flight.departure.scheduled);
    const flightHour = flightTime.getHours();
    const flightMinutes = flightTime.getMinutes();
    return (flightHour > currentHour) || (flightHour === currentHour && flightMinutes >= currentMinutes);
  });

  // If no future flights, use the earliest available flights
  if (upcomingFlights.length === 0) {
    upcomingFlights = [...flights];
  }

  // Sort flights by time
  upcomingFlights.sort((a, b) => {
    const timeA = new Date(a.departure.scheduled);
    const timeB = new Date(b.departure.scheduled);
    return timeA - timeB;
  });

  // Remove duplicate flights
  const uniqueFlights = [];
  const seenFlightNo = new Set();

  for (const flight of upcomingFlights) {
    if (!seenFlightNo.has(flight.flight.iata)) {
      seenFlightNo.add(flight.flight.iata);
      uniqueFlights.push(flight);
    }
    if (uniqueFlights.length >= visibleRows) break;
  }

  departureTableBody.innerHTML = "";

  for (const flight of uniqueFlights) {
    const flightTime = new Date(flight.departure.scheduled).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });

    const iataCode = flight.arrival.iata || "Unknown";
    const destinationCity = getCityNameFromIATA(iataCode);

    // Airline icon logic
    const airlineCode = flight.flight.iata.slice(0, 2); // Extract airline code
    const airlineIcon = await fetchAirlineIcon(airlineCode);

    // Check if gate is available, otherwise assign cached gate or new random gate
    if (flight.departure.gate) {
      gateCache[flight.flight.iata] = flight.departure.gate;
    } else if (!gateCache[flight.flight.iata]) {
      const letter = String.fromCharCode(65 + Math.floor(Math.random() * 7)); // A to G
      const number = Math.floor(Math.random() * 20) + 1; // 1 to 20
      gateCache[flight.flight.iata] = `${letter}${number}`;
    }

    const gate = gateCache[flight.flight.iata];

    // Determine random status for demonstration
    const randomStatusIndex = Math.floor(Math.random() * statusOptions.length);
    const status = statusOptions[randomStatusIndex];
    const statusClass = statusClasses[randomStatusIndex];

    addFlightStatusUpdate(flight, "departure"); // Add status update for departures

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${flightTime}</td>
      <td>${destinationCity} (${iataCode})</td>
      <td>
        <img src="${airlineIcon}" alt="${airlineCode}" class="airline-icon">
        ${flight.flight.iata || "N/A"}
      </td>
      <td>${gate}</td>
      <td class="${statusClass}">${status}</td>
    `;

    departureTableBody.appendChild(row);
  }
}

const iataCityMapping = [
    { iata: "WAW", city: "Warsaw" },
    { iata: "JFK", city: "New York" },
    { iata: "LHR", city: "London" },
    { iata: "CDG", city: "Paris" },
    { iata: "FRA", city: "Frankfurt" },
    { iata: "DXB", city: "Dubai" },
    { iata: "HND", city: "Tokyo" },
    { iata: "SIN", city: "Singapore" },
    { iata: "SYD", city: "Sydney" },
    { iata: "PEK", city: "Beijing" },
    { iata: "DOH", city: "Doha" },
    { iata: "BEG", city: "Belgrade" },
    { iata: "BUD", city: "Budapest" },
    { iata: "ALC", city: "Alicante" },
    { iata: "ATH", city: "Athens" },
    { iata: "BRU", city: "Brussels" },
    { iata: "AMS", city: "Amsterdam" },
    { iata: "ZRH", city: "Zurich" },
    { iata: "CPH", city: "Copenhagen" },
    { iata: "CTA", city: "Catania" },
    { iata: "AYT", city: "Antalya" },
    { iata: "BER", city: "Berlin" },
    { iata: "CXR", city: "Nha Trang" },
    { iata: "BCN", city: "Barcelona" },
    { iata: "BOM", city: "Mumbai" },
    { iata: "ARN", city: "Stockholm" }, // Stockholm Arlanda Airport
    { iata: "BLL", city: "Billund" }, // Billund Airport
    { iata: "CAI", city: "Cairo" }, // Cairo International Airport
    { iata: "DWC", city: "Dubai" }, // Al Maktoum International Airport
    { iata: "CGN", city: "Cologne" } // Cologne Bonn Airport
];


function getCityNameFromIATA(iata) {
  const mapping = iataCityMapping.find(entry => entry.iata === iata);
  return mapping ? mapping.city : "Unknown City";
}

// Update arrivals table
async function updateArrivalTable(flights) {
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();

  // Filter only future flights
  let upcomingFlights = flights.filter(flight => {
    const flightTime = new Date(flight.arrival.scheduled);
    const flightHour = flightTime.getHours();
    const flightMinutes = flightTime.getMinutes();
    return (flightHour > currentHour) || (flightHour === currentHour && flightMinutes >= currentMinutes);
  });

  // If no future flights, use the earliest available flights
  if (upcomingFlights.length === 0) {
    upcomingFlights = [...flights];
  }

  // Sort flights by time
  upcomingFlights.sort((a, b) => {
    const timeA = new Date(a.arrival.scheduled);
    const timeB = new Date(b.arrival.scheduled);
    return timeA - timeB;
  });

  // Remove duplicate flights
  const uniqueFlights = [];
  const seenFlightNo = new Set();

  for (const flight of upcomingFlights) {
    if (!seenFlightNo.has(flight.flight.iata)) {
      seenFlightNo.add(flight.flight.iata);
      uniqueFlights.push(flight);
    }
    if (uniqueFlights.length >= visibleRows) break;
  }

  arrivalTableBody.innerHTML = "";

  for (const flight of uniqueFlights) {
    const flightTime = new Date(flight.arrival.scheduled).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });

    const iataCode = flight.arrival.iata || "Unknown";
    const departureCity = getCityNameFromIATA(iataCode);

    // Airline icon logic
    const airlineCode = flight.flight.iata ? flight.flight.iata.slice(0, 2) : "XX";
    const airlineIcon = await fetchAirlineIcon(airlineCode);

    // Check if gate is available, otherwise assign cached gate or new random gate
    if (flight.arrival.gate) {
      gateCache[flight.flight.iata] = flight.arrival.gate;
    } else if (!gateCache[flight.flight.iata]) {
      const letter = String.fromCharCode(65 + Math.floor(Math.random() * 7)); // A to G
      const number = Math.floor(Math.random() * 20) + 1; // 1 to 20
      gateCache[flight.flight.iata] = `${letter}${number}`;
    }

    const gate = gateCache[flight.flight.iata];

    // Determine random status for demonstration
    const randomStatusIndex = Math.floor(Math.random() * statusOptions.length);
    const status = statusOptions[randomStatusIndex];
    const statusClass = statusClasses[randomStatusIndex];

    addFlightStatusUpdate(flight, "arrival"); // Add status update for arrivals

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${flightTime}</td>
      <td>${departureCity} (${iataCode})</td>
      <td>
        <img src="${airlineIcon}" alt="${airlineCode}" class="airline-icon">
        ${flight.flight.iata || "N/A"}
      </td>
      <td>${gate}</td>
      <td class="${statusClass}">${status}</td>
    `;

    arrivalTableBody.appendChild(row);
  }
}

// Initialize
async function init() {
  createTicker(); // Add ticker to the page
  startTickerDefaultMessageTimer(); // Start the timer for the default ticker message
  updateClock();
  setInterval(updateClock, 1000);
  
  await updateLocalWeather();
  setInterval(updateLocalWeather, 600000); // Update weather every 10 minutes
  
  const flights = await fetchFlights();
  const arrivals = await fetchArrivals();
  updateDepartureTable(flights);
  updateArrivalTable(arrivals);
  
  setInterval(async () => {
    const updatedFlights = await fetchFlights();
    const updatedArrivals = await fetchArrivals();
    updateDepartureTable(updatedFlights);
    updateArrivalTable(updatedArrivals);
  }, 60000); // Refresh flights every minute
}

// Handle window resize
window.addEventListener('resize', () => {
  location.reload(); // Simple refresh to recalculate visible rows
});

init();