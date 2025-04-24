import L from 'leaflet';
import 'leaflet/dist/leaflet.css';


document.addEventListener('DOMContentLoaded', setup)
///****** Fix the comments, kinda bad rn */
// Organize the code
// Also fix location might be a bit wacky (might be vpn though)


// Write these coords and send them (or read them) 
// - Make the app more compatible around the world


// -- Implement caching, hospitals and all that (location is always changing so not that)

  

// First function
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
        // const res = await fetch('http://192.168.2.135:5000/detect-fire', {
        const res = await fetch('http://10.0.0.56:5000/detect-fire', {
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
async function displayFireAndHospitalPath(map, latitude, longitude, sateliteResponse){
    const hospitalPath = await detectFireAndGetHospitalPath(latitude, longitude);

    // console.log('GRID DATA', gridData);
    console.log('HosI',hospitalPath.escape_route);
    const pathLatLon = hospitalPath.escape_route.map(([x, y]) =>

    // const pathLatLon = hospitalPath.path.map(([x, y]) =>
        L.latLng(...gridToLatLon([x, y], sateliteResponse.gridData))
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
        ${sateliteResponse.hospitals[hospitalPath.hospital_index].name}`;
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
 * @param {Array<Object>} hospitals - An array of hospital objects with `lat`, `lon`, and `name` properties.
 * @param {number} [range=70000] - Optional. The maximum distance (in meters) to consider when searching for the nearest fire (currently unused).
 */
async function requestAssistance(map, latitude, longitude, sateliteResponse, range = 70000){


    if(sateliteResponse.isTrafficHigh){
        console.log('SHES BURNING')
    }
    // let closestDistance = Infinity
    // let closestFire = null
    console.log('LONG',)
    // Organzie this function and add validation in the case that
        // they are to prank us.

    // If there is confirmation of a fire then the steps below will occur
    // ===========If Fire is Confirmed==============

    await displayFireAndHospitalPath(map, latitude, longitude, sateliteResponse);
    
    // ***** Drone stuff -- try to send just one drone        
    // Deploy the drone
    // -- Gotta add more prompts

    if(sateliteResponse.probablyFire.probability == true){
        console.log('SATRESP', sateliteResponse);


        // Disabled the assistance button
        // const assistanceButton = document.getElementById('assistance');
        // assistanceButton.disabled = true;
        // assistanceButton.textContent = 'Assistance is on the way'

        // Deploying the drone
        defineAndDeployDrone(map, latitude, longitude);
    } else {
        console.log(`Satilite does not detect a fire`);
    }

}

function defineAndDeployDrone(map, latitude, longitude){

    // Drone is defined
    let droneLatitude = latitude-0.30;
    let droneLongitude = longitude-0.50;

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


    // Function to move the drone
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

            previousTime = currentTime;
            requestAnimationFrame(moveDrone);
        }
    }

    // Drone is moving towards person
    moveDrone();

}

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
 * @param {Array<Object>} hospitals - Array of nearby hospital data with lat/lon fields
 */
function initializeMapWithData(latitude, longitude, sateliteResponse){
    // -- I could await all this so that it loads b4 spamming button
    if(latitude != null &&
        longitude != null){

        // Create the map
        // -- Can add it to satelitle.map for less params (maybe)
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


        // Define the hospital markers
        const hospitalIcon = L.icon({
            iconUrl: '/images/hospital.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });
        for (const hospital of sateliteResponse.hospitals){
            const hospitalMarker = L.marker([hospital.lat, hospital.lon], {
                icon: hospitalIcon
            }).addTo(map);
        }
        
        // Based on the satelite response, identifies probable fire
        if(sateliteResponse.probablyFire.probability == true){
            // Define the probable fire marker
            const probablyFireIcon = L.icon({
                iconUrl: '/images/probableFire.jpg',
                iconSize: [32, 32],    
                iconAnchor: [16, 32],
                popupAnchor: [0, -32]
            });
            L.marker(sateliteResponse.probablyFire.probablyFireLocation, 
                {icon: probablyFireIcon}).addTo(map)
        } else {
            console.log('No fires being detected around your area')
        }

        // Flag attempt
        let fireFlags = [];
        let fireMarkers = [];

        map.on('contextmenu', (e) => {
            const lat = e.latlng.lat;
            const lon = e.latlng.lng;
        
            fireFlags.push({ lat, lon, time: Date.now() });
        
            // L.marker([lat, lon], { icon: fireFlagIcon }).addTo(map).bindPopup("🔥 Fire reported");
            const fireMarker = L.marker([lat, lon], { icon: personIcon })
                .addTo(map).bindPopup("🔥 Fire reported");

            fireMarkers.push(fireMarker);

            // Can call this afterwards maybe
            const isTrafficHigh = checkForHighFireTraffic(map, fireFlags, fireMarkers, lat, lon);
            // console.log(isTrafficHigh);

            // Change the satelite traffic
            sateliteResponse.isTrafficHigh = isTrafficHigh
            console.log('Satelite', sateliteResponse.isTrafficHigh);

            // Pass the report object ig in sateliteResponse with all the fireFlags
        });
        
        
        // Drone is created and moved to the lat and long given
        document.getElementById('assistance')
            .addEventListener('click', () => {
                requestAssistance(map, latitude, longitude, sateliteResponse)
            });
    }
}

// function removeOldFlags(fireFlags, fireMarkers, maxAge = 1000 * 60 * 10) {
//     const now = Date.now();
//     fireFlags = fireFlags.filter(f => {
//         if (now - f.time >= maxAge) {
//             const markerIndex = fireMarkers.findIndex(marker => 
//                 marker.getLatLng().lat === f.lat && marker.getLatLng().lng === f.lon
//             );
//             if (markerIndex !== -1) {
//                 fireMarkers[markerIndex].remove();
//                 fireMarkers.splice(markerIndex, 1); 
//             }
//             return false; 
//         }
//         return true; 
//     });
// }

// function checkForHighFireTraffic(fireFlags, fireMarkers, centerLat, centerLon, radius = 500) {

//     let isTrafficHigh = false;
//     // removeOldFlags(fireFlags, fireMarkers)
//     let count = 0;
//     console.log(count);

//     fireFlags.forEach(flag => {
//         const distance = calculateDistance(centerLat, centerLon, flag.lat, flag.lon);
//         if (distance <= radius) {
//             count++;
//         }
//     });

//     if (count >= 5) {
//         console.log("🔥🔥🔥 High traffic fire area detected!");
//         isTrafficHigh = true;
//         // Now you can call defineAndDeployDrone() or flag probablyFire as true
//     } else {
//         console.log(`🔥 ${count} fire reports in the area`);
//     }

//     return isTrafficHigh;
// }

const warningMarkers = [];

function checkForHighFireTraffic(map, fireFlags, fireMarkers, centerLat, centerLon, radius = 500) {

    const probableFireIcon = L.icon({
        iconUrl: '/images/probableFire.jpg',
        iconSize: [60, 32],    
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });

    let nearbyFlags = fireFlags.filter(flag => {
        const d = calculateDistance(centerLat, centerLon, flag.lat, flag.lon);
        return d <= radius;
    });

    if (nearbyFlags.length >= 5) {
        console.log("🔥🔥🔥 High traffic fire area detected!");

        const avgLat = nearbyFlags.reduce((sum, f) => sum + f.lat, 0) / nearbyFlags.length;
        const avgLon = nearbyFlags.reduce((sum, f) => sum + f.lon, 0) / nearbyFlags.length;

        const isAlreadyMarked = warningMarkers.some(m =>
            calculateDistance(m.getLatLng().lat, m.getLatLng().lng, avgLat, avgLon) < 100
        );


        if (!isAlreadyMarked) {
            const marker = L.marker([avgLat, avgLon], { 
                icon: probableFireIcon, zIndexOffset: 1000
            }).addTo(map)
                .bindPopup("🚨 Fire warning!");
            warningMarkers.push(marker);
        }
    } else {
        console.log(`🔥 ${nearbyFlags.length} fire reports in the area`);
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


async function writeDataToJson(hospitals, bounds, dimensions) {
    // Retrieve the stored data from localStorage
    const previousHospitals = JSON.parse(localStorage.getItem('hospitals'));
    const previousBounds = JSON.parse(localStorage.getItem('bounds'));
    const previousDimensions = JSON.parse(localStorage.getItem('dimensions'));

    // Check if the data has changed by comparing the objects directly
    const hospitalsChanged = JSON.stringify(hospitals) !== JSON.stringify(previousHospitals);
    const boundsChanged = JSON.stringify(bounds) !== JSON.stringify(previousBounds);
    const dimensionsChanged = JSON.stringify(dimensions) !== JSON.stringify(previousDimensions);
    

    // Handle hospital changes
    if (hospitalsChanged) {
        try {
            
            await fetch('http://10.0.0.56:5000/save-hospitals', {
            // await fetch('http://192.168.2.135:5000/save-hospitals', {

                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hospitals: hospitals
                })
            });
        } catch (err) {
            console.error('❌ Failed to save hospitals:', err);
        }
    }

    // Handle bounds and dimensions changes
    if (boundsChanged || dimensionsChanged) {
        try {
            await fetch('http://10.0.0.56:5000/save-grid-info', {
            // await fetch('http://192.168.2.135:5000/save-grid-info', {

                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bounds, dimensions })
            }).then(res => res.json());
        } catch (err) {
            console.error('❌ Failed to save grid info:', err);
        }
    }

    // Update localStorage if any data has changed
    if (hospitalsChanged) {
        localStorage.setItem('hospitals', JSON.stringify(hospitals));
    }
    if (boundsChanged) {
        localStorage.setItem('bounds', JSON.stringify(bounds));
    }
    if (dimensionsChanged) {
        localStorage.setItem('dimensions', JSON.stringify(dimensions));
    }

    // Return success after all operations are completed
    return { success: true };
}


async function getCityFromCoords(lat, lon) {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`, {
    //   headers: {
    //     'User-Agent': 'MyApp/1.0 (you@example.com)'
    //   }
    });
  
    if (!response.ok) {
      throw new Error("Failed to fetch location data");
    }
  
    const data = await response.json();
    console.log(data);
    const city = data.address.city || data.address.town || data.address.village || "Unknown location";
  
    return city;
}


// ------------- Regarding fire authentication
// -- Geo Fencing, use the user's location to determine whether they're
// -- .. near a high risk area for fires

// Cross referencing: So if there's alot of ppl reporting a fire
// Option to report a fire

// Does all the fetches
async function simualteSatelite(latitude, longitude){
    // There's a satelite watching around the location
    // Maybe frequency of fire or how huge it look
    // Validates the videos
    // insensity determines the amount of support
    // -- Can be changed through the traffic and videos
    // -- Thinking of fetching the bounds through the ai api here

    const probablyFireLocation = [latitude + 0.0005, longitude + 0.0005];

    // I need the city to get the city bounds (using AI)
    // -- Might be able to use the lat and long though (asking the ai)
    const city = await getCityFromCoords(latitude, longitude);


    // Satelite fetches the hospitals

    // Fetch the nearby hospitals (Performance is kinda ehh)
    // Doesn't fetch all the hospitals -- fix this
    // Cache this on load up or maybe make it global

    // Maybe this can be refactored in the satetile?
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

    // Gotta get the location from geolocation
    // Maybe I can also send the bounds from the satetline object
    // -- Montreal bounds
    // -- Test out when python is fixed
    const gridData = generateGridData(latitude, longitude);
    // console.log('MA BOUNDS', bounds);
    
    // const gridData = {
    //     "bounds": {
    //         "min_lat": 45.4,
    //         "max_lat": 45.7,
    //         "min_lon": -73.7,
    //         "max_lon": -73.4
    //     },
    //     "dimensions": {
    //         "width": 500,
    //         "height": 500
    //     }

    // }



    // const gridData = await writeDataToJson(hospitals, bounds, dimensions);

    // Hospital and Grid bounds are written to json file, (might move to satelite)
    await writeDataToJson(hospitals, gridData.bounds, gridData.dimensions);

    console.log('Files saved to json')
    console.log('✅ Hospitals saved');
    console.log('📦 Grid bounds:', gridData.bounds);
    console.log('📏 Grid dimensions:', gridData.dimensions);

    return {
        "location" : "",
        "isFire" : false,
        "isTrafficHigh": false,
        "intensity" : 2,
        "probablyFire" : {
            "probability" : true,
            "probablyFireLocation" : probablyFireLocation
        },
        "hospitals" : hospitals,
        "gridData" : gridData,
        "city" : city
        
    }
}

// Grid Generation
function generateGridData(centerLat, centerLon, distanceKm = 20) {
    const latDelta = distanceKm / 111; 
    const lonDelta = distanceKm / (111 * Math.cos(centerLat * Math.PI / 180));

    const bounds = {
        min_lat: centerLat - latDelta / 2,
        max_lat: centerLat + latDelta / 2,
        min_lon: centerLon - lonDelta / 2,
        max_lon: centerLon + lonDelta / 2
    };
    const dimensions = {
        width: 500,
        height: 500
    }
    return {
        "bounds" : bounds,
        "dimensions" : dimensions
    }
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
            try{
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                // Optional: For testing Rome
                // const latitude = 41.9028
                // const longitude = 12.4964

                // document.getElementById('location').textContent = `Location: 
                //     Latitude: ${latitude}, Longitude: ${longitude}`;
                const sateliteResponse = await simualteSatelite(latitude, longitude)

                console.log('HOSPITAL', sateliteResponse.hospitals)
                document.getElementById('location').textContent = `You are in 
                    ${sateliteResponse.city}: Latitude: ${latitude}, Longitude: ${longitude}`;

                // Uoad the map with the markers
                initializeMapWithData(latitude, longitude, sateliteResponse);

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
    // When user clicks the arrow, scroll to main site
    document.getElementById('scroll-down').addEventListener('click', () => {
        document.getElementById('main-site').scrollIntoView({ behavior: 'smooth' });
    });
    // Detect first scroll and auto-jump to next section
    let hasScrolled = false;
    window.addEventListener('wheel', (e) => {
    if (!hasScrolled) {
        hasScrolled = true;
        document.getElementById('main-site').scrollIntoView({ behavior: 'smooth' });
        }
    }, { once: true });


    const form = document.getElementById('uploadForm');
    form.addEventListener('submit', (event) => getImageOrVideo(event));

    // accessCamera()

    // Get person's location
    fetchAndProcessUserSurroundings();

    // When the button is clicked
    // document.getElementById('assistance').addEventListener('click', () => getLocationAndSendHelp(map));
    
    // AI help chat
    document.getElementById('aiInput').addEventListener('keypress', (e) => handleAIButton(e));
}


function getImageOrVideo(event){
    event.preventDefault();
    console.log('SENT')

    const mediaInput = document.getElementById('mediaInput');
    const file = mediaInput.files[0];

    if (file) {
        console.log("Selected file:", file);
        console.log("File type:", file.type);
  
        const formData = new FormData();
        formData.append("media", file);
  
        fetch('/api/upload-media', {
          method: 'POST',
          body: formData
        })
        .then(response => response.text())
        .then(result => {
          console.log("Upload success:", result);
        })
        .catch(error => {
          console.error("Upload error:", error);
        });
      }
}



// Maybe use WebSockets or recording to upload the image and get the data
// -- This needs to be done after the video and image processing is done
// -- Data Streaming would actually be sick if that can work


// -- Can capture these frames at regular intervals (every 100ms or every second)
// -- Each frame can then be sent to AI model, can process these indiviual frames
function accessCamera(){
    const videoElement = document.getElementById('videoElement');

    // Button to start the camera
    const startCameraButton = document.getElementById('startCameraButton');
    startCameraButton.addEventListener('click', startCamera);

    // Button to stop the camera
    const stopCameraButton = document.getElementById('stopCameraButton');
    stopCameraButton.addEventListener('click', stopCamera);

    let stream;

    // Start the camera feed
    async function startCamera() {
        try {
            // Request access to the camera
            stream = await navigator.mediaDevices.getUserMedia({ video: true });

            // Display the camera feed in the video element
            videoElement.srcObject = stream;
        } catch (error) {
            console.error('Error accessing the camera:', error);
        }
    }

    // Stop the camera feed
    function stopCamera() {
        if (stream) {
            // Stop all tracks (video and audio) from the stream
            stream.getTracks().forEach(track => track.stop());
        }
    }
}




document.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.slides-wrapper .slide');
  const nextBtn = document.getElementById('next-slide');
  const prevBtn = document.getElementById('prev-slide');
  const emergencyBtn = document.getElementById('emergency-button');
  const mainSite = document.getElementById('main-site');

  let currentSlide = 0;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.remove('active');
      if (i === index) slide.classList.add('active');
    });
  }

  nextBtn.addEventListener('click', () => {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
  });

  prevBtn.addEventListener('click', () => {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(currentSlide);
  });

  emergencyBtn.addEventListener('click', () => {
    mainSite.scrollIntoView({ behavior: 'smooth' });
  });

  let startX = 0;
  let endX = 0;

  const swipeArea = document.getElementById('slides-wrapper');
  swipeArea.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
  });

  swipeArea.addEventListener('touchend', (e) => {
    endX = e.changedTouches[0].clientX;
    handleSwipe();
  });

  function handleSwipe() {
    if (startX - endX > 50) {
      nextBtn.click();
    } else if (endX - startX > 50) {
      prevBtn.click();
    }
  }

  // Initialize first slide
  showSlide(currentSlide);
});


/// --- TODO
/**
 * 
 * If traffic is high (isTrafficHigh) then there is most probably a fire
 * Put a probable fire icon.
 * 
 * This is one form of validating whether their videos are real
 * If variable is one, or you send a video (which api returns fire status)
 * Then you will be assisted.
 * 
 * Will be prompted for supplies(Do you need supplies) -> Drone
 * How big is the fire -> Send more authorities
 * Refer to the AI for assisted help
 * By default, if nothing is checked it will mark as fire as notify
 *  the authorities
 * 
 * Unless the video is seen to be huge, then it will automatically deploy the
 *  drone
 * 
 * In the case where they can get a video, they can get assistnace (figure this out),
 *  based on the probably fire level, (based on how much traffic i.e, how
 *  many people are reporting a fire)
 * 
 * Option to report a fire in a certain location
 *  Drag and drop marker or right click to flag a location that you believe
 *  has a fire, if there's a lot of flag and that matches the satelitle view
 *  (There's always a satelite watching to see if there's a fire), so which satelite
 *  confirmation + flag traffic + video evidence, then we can resort to
 *  a general conclusion (for now)
 * 
 *  [This system becomes more complex and easy to abuse:]
 *      - Camp area where there's high traffic and send troll video
 *      - Ideally the file dropper would recognize the location (no resources for that)
 *             or just the allow the video streaming option for real time streaming
 */