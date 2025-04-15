import L from 'leaflet';
import 'leaflet/dist/leaflet.css';


document.addEventListener('DOMContentLoaded', setup)
///****** Fix the comments, kinda bad rn */
// Organize the code
// Also fix location might be a bit wacky (might be vpn though)
// -- Make assistance button non clickable when loading
// - Also add loading screen


// Write these coords and send them (or read them) 
// - Make the app more compatible around the world
// const myObj ={
//     "bounds": {
//       "min_lat": 45.3,
//       "max_lat": 45.7,
//       "min_lon": -73.9,
//       "max_lon": -73.4
//     },
//     "dimensions": {
//       "width": 500,
//       "height": 500
//     }
//   }

  

function gridToLatLon(coords, gridData) {
    const { min_lat, max_lat, min_lon, max_lon } = gridData.bounds;
    const { width, height } = gridData.dimensions;
  
    const lat = max_lat - (coords[1] / height) * (max_lat - min_lat);
    const lon = min_lon + (coords[0] / width) * (max_lon - min_lon);
  
    return [lat, lon];
}


/**
 * Detects a fire at the specified location and retrieves the fastest path to the nearest hospital.
 * 
 * This function sends the user's current location (latitude and longitude) to a backend service
 * that detects nearby fires. It then returns the best path to the nearest hospital based on the fire's
 * location and the user's current position.
 *
 * @async
 * @param {number} latitude - The latitude of the current location.
 * @param {number} longitude - The longitude of the current location.
 * @returns {Promise<Object|null>} A promise that resolves to the response data containing the path to the nearest hospital or `null` if an error occurred.
 */
async function detectFireAndGetHospitalPath(latitude, longitude){
    try {
        const res = await fetch('http://192.168.2.135:5000/detect-fire', {
        // const res = await fetch('http://10.230.123.44:5000/detect-fire', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                latitude: latitude,
                longitude: longitude
            })
        });

        if (!res.ok) {
            throw new Error(`Server responded with status ${res.status}`);
        }

        const data = await res.json();
        console.log('Fire detection response:', data);
        return data;
    } catch (err) {
        console.error('Error generating path:', err);
        return null;
    }
}

/**
 * Fetches the nearest hospital path based on the current location of the fire
 * and displays the fire marker on the map, as well as the path to the hospital.
 *
 * This function detects the fire using the `detectFireAndGetHospitalPath` method,
 * then draws a path to the nearest hospital and places a marker at the fire's location.
 * It also appends a message to the page to inform the user of the nearest hospital.
 *
 * @async
 * @function displayFireAndHospitalPath
 * @param {number} latitude - The latitude of the current fire location.
 * @param {number} longitude - The longitude of the current fire location.
 */
async function displayFireAndHospitalPath(map, latitude, longitude, hospitals, gridData){
    const hospitalPath = await detectFireAndGetHospitalPath(latitude, longitude);

    // console.log('GRID DATA', gridData);
    const pathLatLon = hospitalPath.path.map(([x, y]) =>
        L.latLng(...gridToLatLon([x, y], gridData))
    );

    // L.polyline(pathLatLon, { color: 'red' }).addTo(map);

    L.polyline(pathLatLon, { 
        color: 'red',
        weight: 5,
        opacity: 0.7,
        dashArray: '5, 10'
    }).addTo(map);

    // Display the fire on the map
    const fireDefaultIcon = L.icon({
        iconUrl: '/images/fire.jpg',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });

    const fireMarker = L.marker([latitude, longitude], {
        icon: fireDefaultIcon
    }).addTo(map);


    // Check if the fire path message exists, delete it if yes
    const firePathMessage = document.querySelector('#fire-path-message');
    if (firePathMessage) {
        firePathMessage.remove();
    }

    // Create the fire path message
    const main = document.querySelector('main');
    const p = document.createElement('p');
    p.id = 'fire-path-message';
    p.textContent = `Please follow the path to the 
        ${hospitals[hospitalPath.hospital_index].name}`;
    main.appendChild(p);
}


/**
 * Deploys an assistance drone to the user's location and generates a path to the nearest hospital.
 * 
 * This function:
 * - Fetches the optimal path from the user's location to the nearest hospital.
 * - Animates a drone marker moving toward the user's location.
 * - Displays the fire location and route to the selected hospital on the map.
 * - Appends a message with hospital details to the main interface.
 * 
 * @async
 * @param {L.Map} map - The Leaflet map instance to display markers and paths on.
 * @param {number} latitude - The latitude of the user's (or fire) location.
 * @param {number} longitude - The longitude of the user's (or fire) location.
 * @param {Array<Object>} nearbyFires - An array of nearby fire objects with latitude and longitude.
 * @param {Array<Object>} hospitals - An array of hospital objects with `lat`, `lon`, and `name` properties.
 * @param {number} [range=70000] - Optional. The maximum distance (in meters) to consider when searching for the nearest fire (currently unused).
 */
async function requestAssistance(map, latitude, longitude, nearbyFires, hospitals, gridData, range = 70000){
    let droneLatitude = latitude-0.30;
    let droneLongitude = longitude-0.50;

    let closestDistance = Infinity
    let closestFire = null
    console.log('LONG',)
    // Organzie this function and add validation in the case that
        // they are to prank us.


    // Finds the closest fires with the range
    // for(const fire of nearbyFires){
    //     const fireDistance = calculateDistance(latitude, longitude,
    //         fire.latitude, fire.longitude);

    //     if (fireDistance <= range && fireDistance < closestDistance) {
    //         closestDistance = fireDistance;
    //         closestFire = fire;
    //     }
    // }


    // if (!closestFire) {
    //     console.log("❌ No fires are within range. Drone will not be deployed.");
    //     return;
    // }

    // console.log(`🔥 Fire is within ${range}m. Deploying drone...`);
    // console.log('Closest fire is ',closestFire)

    // Generate the best path for hospital//

    // if(closestFire.latitude && closestFire.longitude){
    //     console.log('lat',closestFire.latitude)
    //     console.log('long',closestFire.longitude)
    // }


    // const hospitalPath = await getBestHospitalPath(latitude+0.002, longitude+0.02);


    // If there is confirmation of a fire then the steps below will occur
    // ===========If Fire is Confirmed==============

    await displayFireAndHospitalPath(map, latitude, longitude, hospitals, gridData);
    // ***** Drone stuff -- try to send just one drone
            
    const droneHelperIcon = L.icon({
        iconUrl: '/images/drone.png',

        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });

    const droneHelper = L.marker([droneLatitude, droneLongitude], {
        icon: droneHelperIcon
    }).addTo(map);

    
    droneHelper.on('click', ()=>{
        console.log(`Drone is currently traveling to ${latitude}, ${longitude}`)
    })

    const targetLatitude = latitude;
    const targetLongitude = longitude;

    // Test out speed and make sure it doesn't skip the tolerance
    // const speed = 0.005;
    const speed = 0.025;
    const tolerance = 0.001;

    // Number of ms that passed on the page
    // Tracks time between two events
    let previousTime = performance.now();

    function moveDrone(){
        const currentTime = performance.now();
        const deltaTime = (currentTime - previousTime) / 1000

        const distance = calculateDistance(droneLatitude, droneLongitude, targetLatitude, targetLongitude);

        // console.log(distance)
        // console.log(tolerance)

        if (distance <= tolerance) {
            console.log("Drone has reached your location and stopped.");
            droneHelper.setLatLng([targetLatitude, targetLongitude]);
            
        } else{
            const moveDistance = speed * deltaTime
            
            // Return the new frame
            const moveTowardsTarget = (current, target, moveDistance) => {
                if (current < target) {
                    return current + moveDistance; 
                } else if (current > target) {
                    return current - moveDistance; 
                }
                return current; 
            };

            droneLatitude = moveTowardsTarget(droneLatitude, targetLatitude, moveDistance);
            droneLongitude = moveTowardsTarget(droneLongitude, targetLongitude, moveDistance);
            droneHelper.setLatLng([droneLatitude, droneLongitude])
            // droneCircle.setLatLng([droneLatitude, droneLongitude])

            previousTime = currentTime;
            requestAnimationFrame(moveDrone);
        }
    }
        
    moveDrone();


    // Calcuates distance of two points on the surface of a sphere
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; 
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; 
        return distance * 1000; 
    }

}


/**
 * Initializes and displays the map using the user's location and nearby data.
 * 
 * - Removes the loading screen
 * - Centers the map on the user's coordinates
 * - Adds a marker for the user's location
 * - Displays markers for nearby hospitals
 * 
 * @param {number} latitude - The user's latitude
 * @param {number} longitude - The user's longitude
 * @param {Array<Object>} nearbyFires - Array of nearby fire data (currently unused)
 * @param {Array<Object>} hospitals - Array of nearby hospital data with lat/lon fields
 */
function initializeMapWithData(latitude, longitude, nearbyFires, hospitals, gridData){
   if(latitude != null &&
       longitude != null){

        // Create the map
        const map = L.map('map').setView([latitude, longitude], 13);
        console.log(map)

        // Remove loading screen
        const loading = document.querySelector('.loading-container');
        if (loading && loading.parentNode) {
          loading.parentNode.removeChild(loading);
        }

        // Define and set new map view
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Enable the help button as soon as possible
        const button = document.getElementById('assistance');
        button.disabled = false;

        // Define the person's marker
        const personIcon = L.icon({
            iconUrl: '/images/marker.png',
            iconSize: [32, 32],    
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });


        L.marker([latitude, longitude], {icon: personIcon}).addTo(map)
        .bindPopup('This is me')
        .openPopup();


        // Define the fire markers
        // const fireDefaultIcon = L.icon({
        //     iconUrl: '/images/fire.jpg',
        //     iconSize: [32, 32],
        //     iconAnchor: [16, 32],
        //     popupAnchor: [0, -32]
        // });
        // const fireIntenseIcon = L.icon({
        //     iconUrl: '/images/fireIntense.jpg',
        //     iconSize: [60, 60],
        //     iconAnchor: [16, 32],
        //     popupAnchor: [0, -32]
        // });


        // for (const fire of nearbyFires){
        //     let fireIcon = fireDefaultIcon

        //     console.log(fire.intensity);

        //     if(fire.intensity > 4){
        //         fireIcon = fireIntenseIcon
        //     }

        //     const fireMarker = L.marker([fire.latitude, fire.longitude], {
        //         icon: fireIcon
        //     }).addTo(map);

        // }

        // Define the hospital markers
        const hospitalIcon = L.icon({
            iconUrl: '/images/hospital.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });
        for (const hospital of hospitals){
            const hospitalMarker = L.marker([hospital.lat, hospital.lon], {
                icon: hospitalIcon
            }).addTo(map);
        }
        
        // Drone is created and moved to the lat and long given
        document.getElementById('assistance').addEventListener('click', () => requestAssistance(map, latitude, longitude, nearbyFires, hospitals, gridData));

    }
}


// Fetch the nearby hospitals
async function fetchNearbyHospitals(latitude, longitude, radius = 10000) {
    const query = `
        [out:json];
        (
            node["amenity"="hospital"](around:${radius},${latitude},${longitude});
            way["amenity"="hospital"](around:${radius},${latitude},${longitude});
            relation["amenity"="hospital"](around:${radius},${latitude},${longitude});
        );
        out center;
    `;

    const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
    });

    if (response.ok) {
        const data = await response.json();

        const hospitals = data.elements
            .map(hospital => {
                const lat = hospital.lat ?? hospital.center?.lat;
                const lon = hospital.lon ?? hospital.center?.lon;

                if (lat !== undefined && lon !== undefined) {
                    return {
                        name: hospital.tags?.name || "Unnamed Hospital",
                        lat,
                        lon,
                    };
                }

                return null;
            })
            .filter(hospital => hospital !== null);

        return hospitals;
    } else {
        console.error("Failed to fetch hospitals:", response.statusText);
        return [];
    }
}



// Spawn in random fires
function generateNearbyFires(lat, lon, count = 10) {
    const fires = [];

    for (let i = 0; i < count; i++) {
        const latOffset = (Math.random() - 0.5) * 0.02;
        const lonOffset = (Math.random() - 0.5) * 0.02;

        const intensity = Math.floor(Math.random() * 5) + 1
        fires.push({
            latitude: lat + latOffset,
            longitude: lon + lonOffset,
            intensity: intensity
        });
    }

    return fires;
}

function writeDataToJson(hospitals, bounds, dimensions){
    fetch('http://192.168.2.135:5000/save-hospitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitals: hospitals
        })
    }).catch(err => console.error('❌ Failed to save hospitals:', err));;


    return fetch('http://192.168.2.135:5000/save-grid-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bounds, dimensions })
    }).then(res => res.json());
}

/**
 * Retrieves the user's geolocation and fetches surrounding data.
 *
 * - Gets current latitude and longitude using the browser's Geolocation API.
 * - Finds nearby fire locations (simulated).
 * - Fetches nearby hospitals via an external API or service.
 * - Sends hospital data to the backend server to be saved in JSON format.
 * - Loads a map centered on the user's location with fire and hospital markers.
 *
 * Displays location info to the user and logs any relevant debugging info.
 *
 * @async
 * @function fetchAndProcessUserSurroundings
 * @returns {Promise<void>} Resolves when all data is fetched and processed.
 */
async function fetchAndProcessUserSurroundings(){
    if (navigator.geolocation){

        navigator.geolocation.getCurrentPosition(async (position) => {

            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;


            // In rome
            // const latitude = -15.72;
            // const longitude = 45.09;

            document.getElementById('location').textContent = `Location: 
                Latitude: ${latitude}, Longitude: ${longitude}`;

            try{
                const nearbyFires = generateNearbyFires(latitude, longitude);

                // Fetch the nearby hospitals (Performance is kinda ehh)
                // Doesn't fetch all the hospitals -- fix this
                // Cache this on load up or maybe make it global
                const hospitals = await fetchNearbyHospitals(latitude, longitude);
                if(hospitals.length == 0){
                    // -- Make this a paragraph
                    console.log('There are no hospitals within your location');
                }

                console.log('HOSPITALS',hospitals);
    
                // Sends the hospitals over the backend
                // Write it over to a json
                // --- Add validation this needs to work ---
                
                // --- Make it that it doesn't reload everytime page reloads
                

                // -- Random bounds
                // const bounds = {
                //     min_lat: -61.83,
                //     max_lat: 61.17,
                //     min_lon: -126.32,
                //     max_lon: 170.41
                // };
                
                // const dimensions = {
                //     width: 580,
                //     height: 270
                // };

                // -- Rome bounds
                // const bounds = {
                //     min_lat: 41.8,
                //     max_lat: 42.1,
                //     min_lon: 12.4,
                //     max_lon: 12.6
                // };

                // const dimensions = {
                //     width: 500,
                //     height: 500
                // };

                // -- Montreal bounds
                const bounds = {
                    'min_lat': 45.4,
                    'max_lat': 45.7, 
                    'min_lon': -73.7, 
                    'max_lon': -73.4
                }

                const dimensions = {
                    'width': 500,
                    'height': 500  
                }
             
    
                const gridData = await writeDataToJson(hospitals, bounds, dimensions);
    
                console.log('Files saved to json')
                console.log('✅ Hospitals saved');
                console.log('📦 Grid bounds:', gridData.bounds);
                console.log('📏 Grid dimensions:', gridData.dimensions);
    
                // Uoad the map with the markers
                initializeMapWithData(latitude, longitude, nearbyFires, hospitals, gridData);
    
                // Fetch earthquake data
                // fetchEarthquakeData(latitude, longitude);
    
    
    
                // Now its going to use the location to find if there's a crucial disaster nearby
                // If there's nothing then rip u die
                // If the disaster is bigger then the "drones" will prioritze you
                // The ai will categorize the severity of the disaster
    
                // sendLocationToServer(latitude, longitude);

            } catch (error){
                console.error('❌ Error during processing:', error);
                document.getElementById('location').textContent = '⚠️ An error occurred while processing your data.';
            }

        }, (error)=> {
            console.log('📍 Geolocation error:', error);

            document.getElementById('location').textContent = `You might be offline, 
                please turn on the internet!`
        })
         
    } else{
        console.error('❌ Geolocation is not supported by this browser.');
        document.getElementById('location').textContent = `⚠️ Geolocation is not supported in your browser.`;
    }
}





// Api call to the AI maybe implement caching too
const callTheAI = async (message) => {
    try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message }),
        });
    
        const data = await response.json();
    
        console.log('DATA', data);

        const reply = data.choices?.[0]?.message?.content;
        console.log('AI says:', reply);

        const newAIMessage = document.createElement('p');
        newAIMessage.textContent = reply;
        newAIMessage.classList.add('ai-message');
        document.getElementById('conversation').appendChild(newAIMessage);


        // document.getElementById('response').textContent = reply || 'No response from AI';
      } catch (error) {
        console.error('Error talking to AI:', error);
        document.getElementById('response').textContent = 'Something went wrong';
    }
}
// Fix the styling and possible add an array or pagination to ...
// ... not make the chat go on forever
const handleAIButton =  async (e) => {

    if(e.key === "Enter" && e.target.value){
        e.target.disabled = true;
        // Display the input field
        // Display the new user message
        const newMessage = document.createElement('p');
        newMessage.textContent = e.target.value
        newMessage.classList.add('user-message');

        document.getElementById('conversation').appendChild(newMessage);

        await callTheAI(e.target.value);

        e.target.value = '';
        e.target.disabled = false;

    }
}


/**
 * Returns the help in response to the magnitude
 * @param {*} magnitude 
 * @returns 
 */
function getEarthquakeResponse(magnitude){
    switch(true){
        case(magnitude < 3):
            return "No actions needed";
        case(magnitude >=3 && magnitude < 4):
            return "Stay calm, take note of it, and check for updates.";
        case(magnitude >= 4 && magnitude < 5):
            return `Stay inside and be alert for aftershocks.
                No major action is required unless you’re in a structurally weak building.`
        case(magnitude >= 5 && magnitude < 6):
            return `•    Indoors: Drop, Cover, and Hold On. Stay away from windows and heavy furniture.
    •    Outdoors: Move away from buildings, trees, and power lines.
    •    Aftermath: Check for injuries and damages, and prepare for aftershocks.`
        case(magnitude >= 6 && magnitude < 7):
            return `   •    What to do:
    •    During: Drop, Cover, and Hold On. Stay inside until shaking stops.
    •    After: Evacuate if necessary, check for injuries, avoid damaged structures, and follow emergency broadcasts`
        case(magnitude >= 7 && magnitude < 8):
            return `    •    Protect yourself during shaking (Drop, Cover, Hold On).
    •    After shaking stops, evacuate if the building is unsafe.
    •    Be prepared for strong aftershocks.
    •    Avoid damaged roads and bridges.`
        case(magnitude >= 8 ):
            return `•    Get to an open area away from buildings and power lines.
    •    If near the coast, immediately move to higher ground in case of a tsunami.`
        
    }
}

/**
 * Main setup (Comment in the future*)
 * Gonna have to restructure everything
 */
function setup(){
    // Could maybe display a game or a loading screen in the wait time
    // Instead of boring map

    // Display the original map
    // -- Add a random spawn everytime

    // Disable the help button until all the information is retrieved
    // -- Maybe it should always be enabled
    // const button = document.getElementById('assistance');
    // button.disabled = true;

    // Get person's location
    fetchAndProcessUserSurroundings();

    // When the button is clicked
    // document.getElementById('assistance').addEventListener('click', () => getLocationAndSendHelp(map));
    
    // AI help chat
    document.getElementById('aiInput').addEventListener('keypress', (e) => handleAIButton(e));
}










// ==================== UNUSED CODE BELOW ====================
// These functions are not currently used but might be helpful later



// Not sure if these are being used
const simulateResponses = [
    "Sorry but you're now dead",
    "Please cover your mouth",
    "There's a tornado, run away",
    "I will provide you with assistance"
]


/**
 * Fetch the earthquake data close to the given lat and long
 * @param {*} latitude 
 * @param {*} longitude 
 * @param {*} maxradius 
 */
async function fetchEarthquakeData(latitude, longitude, maxradius=100){
    const earthquakeResponse = await fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${latitude}&longitude=${longitude}&maxradius=${maxradius}`)
    if (earthquakeResponse.ok){
        const earthquakeData = await earthquakeResponse.json()

        // Have different instructions for different levels

        earthquakeData.features[0].properties.mag = 2

        const eqHelp = getEarthquakeResponse(earthquakeData.features[0].properties.mag);

        console.log(eqHelp);

        // Simulate giving supplies
        // We'd need closest police stations and hospitals

        // console.log(earthquakeData.features[0].properties.mag)
        // if (earthquakeData.features[0].properties.mag < 4){
        //     console.log(helpAtDifferentLevels[0])
        // } else if (earthquakeData.features[0].properties.mag >= 4){
        //     console.log('Help is on the way')
        // }
    }
}