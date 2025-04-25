import L from 'leaflet';
import 'leaflet/dist/leaflet.css';


document.addEventListener('DOMContentLoaded', setup)
///****** Fix the comments, kinda bad rn */
// Organize the code
// Also fix location might be a bit wacky (might be vpn though)


// Write these coords and send them (or read them) 
// - Make the app more compatible around the world


// -- Implement caching, hospitals and all that (location is always changing so not that)

// Write some comments
const fireRequestBody = (latitude, longitude, sateliteResponse, mediaFile) => {
    if (mediaFile) {
        const formData = new FormData();
        formData.append("latitude", latitude);
        formData.append("longitude", longitude);
        formData.append("media", mediaFile);
        formData.append("hospitalData", JSON.stringify(sateliteResponse.hospitals));
        formData.append("gridData", JSON.stringify(sateliteResponse.gridData));

        return {
            method: 'POST',
            body: formData
        };
    } else {
        return {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                latitude,
                longitude,
                hospitalData: sateliteResponse.hospitals,
                gridData: sateliteResponse.gridData
            })
        };
    }
};


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
async function detectFireAndGetHospitalPath(latitude, longitude, sateliteResponse, mediaFile){
    try { 
        // Fire detection response
        const res = await fetch('http://192.168.2.135:5001/detect-fire', 
            fireRequestBody(latitude, longitude, sateliteResponse, mediaFile));

        if (!res.ok) {
            throw new Error(`Server responded with status ${res.status}`);
        }

        const data = await res.json();
        console.log('Fire detection response:', data);
        return data;
    } catch (err) {
        // console.error('Error generating path:', err);
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
async function displayFireAndHospitalPath(map, latitude, longitude, sateliteResponse, mediaFile){
    const hospitalPath = await detectFireAndGetHospitalPath(latitude, longitude, sateliteResponse, mediaFile);
    const spinner = document.getElementById('loading-until-detection');
    spinner.classList.remove('active');
    
    if(hospitalPath == null){return}

    console.log('HospitalPath', hospitalPath);

    // If there's no fire detected return back
    // -- Handle this
    document.getElementById("info-after-button").style.display = 'block';
    document.getElementById('info-file-name').textContent = mediaFile.name;

    // Change this to hospital coords bc its undefined
    // console.log(sateliteResponse.hospitals[hospitalPath.hospital_index].name)
    // if(sateliteResponse.hospitals[hospitalPath.hospital_index].name){
    //     document.getElementById('info-nearest-hospital').textContent = sateliteResponse.hospitals[hospitalPath.hospital_index].name 
    // }

    // Switch the risk class name
    const zoneRisk = document.getElementById('zone-risk');
    const riskText = document.getElementById('risk-text');

    // Define the help message and change the UI confidence
    const helpMessage = document.getElementById("help-message")
    document.getElementById('confidence-value').textContent = hospitalPath.confidence

    if(hospitalPath.fire_detected == false){
        console.log('There is no fire within the area')
        document.getElementById('alert-bar').style.display = 'none';
        document.getElementById('fire-status').textContent = '❌';
        zoneRisk.className = 'low-risk';
        riskText.textContent = 'LOW';

        helpMessage.textContent = `Cannot detect any fire within this media.
            Drone will not be dispatched.`
        return
    }

    document.getElementById('assistance').disabled = true;

    // Display the nearest hospital coords after the response gets sent
    const hospCoords = hospitalPath.nearest_hospital.coords;
    document.getElementById('info-nearest-hospital').textContent = `Lat: ${hospCoords[0].toFixed(6)}, Long: ${hospCoords[1].toFixed(6)}`;

    // Display the status pannel info
    document.getElementById('fire-status').textContent = '✅';
    zoneRisk.className = 'high-risk'
    riskText.textContent = 'HIGH';

    //Calculate the distance
    const hpCoords = hospitalPath.nearest_hospital.coords;
    const hpDistance = calculateDistance(latitude, longitude, hpCoords[0], hpCoords[1])
    document.getElementById("info-hospital-distance").textContent = `${(hpDistance / 1000).toFixed(3)} km`


    // Define the hospital icon and display icon
    const hospitalIcon = L.icon({
        iconUrl: '/images/hospital.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
    L.marker(hospitalPath.nearest_hospital.coords, {
        icon: hospitalIcon
    }).addTo(map);


    // Check to see if the person is in montreal
    let pathLatLon;
    if(hospitalPath.road_route.length < 7){
        pathLatLon = hospitalPath.escape_route.map(
            ([lat, lon]) => L.latLng(lat, lon)
        );
    } else{
        // If in Montreal use the roads
        pathLatLon = hospitalPath.road_route.map(
            ([lat, lon]) => L.latLng(lat, lon)
        );
    }   

    // Display the path for the hospital
    L.polyline(pathLatLon, { 
        color: 'red',
        weight: 5,
        opacity: 0.7,
        dashArray: '5, 10'
    }).addTo(map);


    // If the probability is extremely high then a drone will be launched
    // ... and the authorities will be alerted
    // And a fire icon will be placed

    // Drone call
    if(sateliteResponse.probablyFire.probability == true){

        // Maybe add a timer for the drone?
        // Maybe add the materials that its bringing?
        helpMessage.textContent = `Fire detected! A drone
            with the necessary supplies has been dispatched.`;

        // Alerting the authorities
        document.getElementById('alert-bar').style.display = 'block';

        // Try to fix and deploy just one drone
        document.getElementById('drone-heading').textContent = `
            ${hospCoords[0].toFixed(6)}, ${hospCoords[1].toFixed(6)}`;
        defineAndDeployDrone(map, latitude, longitude, sateliteResponse);

        // Display the detected fire on the map
        const fireDefaultIcon = L.icon({
            iconUrl: '/images/fire.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });
        L.marker([latitude, longitude], {
            icon: fireDefaultIcon
        }).addTo(map);


    } else {
        console.log(`Satilite does not detect a fire`);
        helpMessage.textContent = `No fire has been detected.`
    }


    // Check if the fire path message exists, delete it if yes
    // const firePathMessage = document.querySelector('#fire-path-message');
    // if (firePathMessage) {
    //     firePathMessage.remove();
    // }

    // Create the fire path message
    // const main = document.querySelector('main');
    // const p = document.createElement('p');
    // p.id = 'fire-path-message';
    // p.textContent = `Please follow the path to the 
    //     ${sateliteResponse.hospitals[hospitalPath.hospital_index].name}`;
    // main.appendChild(p);
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
async function assistancePopup(map, latitude, longitude, sateliteResponse, range = 70000){

    // The hospital path will always get displayed no matter what,
    // The drone and authorities will be called if its a serious fire
    
    // Remove the value and file name text in popup (refresh the info)
    document.getElementById('mediaInput').value = '';
    document.getElementById('file-name').textContent = '';

    // Display the popup-overlay
    document.getElementById('popup-overlay').classList.remove('hidden');
    console.log(document.getElementById('popup-overlay'))


    // Closes form when you click off the form
    document.getElementById('popup-overlay').addEventListener('click', function(event) {
        // Check if the click happened outside the form content
        if (event.target === document.getElementById('popup-overlay')) {
            document.getElementById('popup-overlay').classList.add('hidden');
        }
    });

    // Change the file name text content
    document.getElementById('mediaInput').addEventListener('change', function (e) {
        const fileName = e.target.files[0] ? e.target.files[0].name : 'No file selected';
        document.getElementById('file-name').textContent = `SELECTED FILE: ${fileName}`;
    });

    let mediaFile = null

    // Display helpful message
    document.getElementById("help-message").textContent = `Please
        upload an image or a video of your current location`;


    // Open up a popup
    const form = document.getElementById('uploadForm');
    const uploadBtn = document.getElementById('uploadMediaButton');
    const chooseFileLabel = document.querySelector('.custom-file-label');
    const mediaInput = document.getElementById('mediaInput');
    const uploadStatus = document.getElementById('upload-status');

    // Whenever the form is submitted
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const mediaInput = document.getElementById('mediaInput');
        const file = mediaInput.files[0];

        if (!file) {
            console.log('No file uploaded');
            return;
        }

        // Display the spinner waiting for the response
        const spinner = document.getElementById('loading-until-detection');
        spinner.classList.add('active');


        // if (spinner.classList.contains('active')) {
        //     startButton.textContent = 'Cancel Processing';
        //   } else {
        //     startButton.textContent = 'Start Processing';
        // }

        document.getElementById('popup-overlay').classList.add('hidden');
        uploadBtn.disabled = true;
        chooseFileLabel.style.pointerEvents = 'none';
        chooseFileLabel.style.opacity = '0.6';
        uploadStatus.style.display = 'block';
        try {
            // Set media file to file
            mediaFile = file

            console.log('File uploaded:', file.name);
            await displayFireAndHospitalPath(map, latitude, longitude, sateliteResponse, mediaFile);            
        } catch (error){
            console.error('Error during upload:', error);
            // alert('Something went wrong while uploading.');
        } finally {
            uploadBtn.disabled = false;
            chooseFileLabel.style.pointerEvents = 'auto';
            chooseFileLabel.style.opacity = '1';
            uploadStatus.style.display = 'none';
        }
    });

}


function defineAndDeployDrone(map, latitude, longitude, sateliteResponse){

    // Update the status of drone in the UI
    const droneStatus = document.getElementById('drone-status')
    droneStatus.textContent = 'En Route';
    
    // Reveal more drone information
    document.getElementById('drone-hidden-info').style.display = 'block';

    // Drone lat and long is retrieved from the connected drone
    let droneLatitude = sateliteResponse.droneLocation[0];
    let droneLongitude = sateliteResponse.droneLocation[1];

    // Try to move this
    // const droneHelperIcon = L.icon({
    //     iconUrl: '/images/drone.png',
    //     iconSize: [40, 40],
    //     iconAnchor: [20, 40],
    //     popupAnchor: [0, -40]
    // });
    // const droneHelper = L.marker([droneLatitude, droneLongitude], {
    //     icon: droneHelperIcon,
    //     zIndexOffset: 1000
    // }).addTo(map);

    const droneHelper = sateliteResponse.droneHelper;
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

        if (distance <= tolerance) {
            console.log("Drone has reached your location and stopped.");
            droneHelper.setLatLng([targetLatitude, targetLongitude]);

            droneStatus.textContent = 'Arrived';
            
        } else{
            const moveDistance = speed * deltaTime
            const moveTowardsTarget = (current, target, moveDistance) => {
                const delta = target - current;
            
                if (Math.abs(delta) <= moveDistance) {
                    return target;
                }
            
                return current + Math.sign(delta) * moveDistance;
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


function connectToDrone(map, latitude, longitude, sateliteResponse){

    // Drone is chosen and then sent to the satelite response
    const drones = [
        {
            id: "DR-001",
            battery: 87,
            supplies: ["Medkit", "Water", "Bandages"],
            signal: "📶📶📶📶",
            location : [latitude-0.30, longitude-0.50]
        },
        {
            id: "DR-002",
            battery: 65,
            supplies: ["Water", "Insulin"],
            signal: "📶📶📶",
            location : [latitude - 0.25, longitude + 0.15]

        },
        {
            id: "DR-003",
            battery: 92,
            supplies: ["Defibrillator", "Medkit"],
            signal: "📶📶📶📶📶",
            location : [latitude + 0.24, longitude - 0.23]

        },
        {
            id: "DR-004",
            battery: 43,
            supplies: ["Blankets", "IV Fluids", "Glucose"],
            signal: "📶📶",
            location : [latitude + 0.25, longitude + 0.15]

        }
    ];

    const randomIndex = Math.floor(Math.random() * drones.length);
    const drone = drones[randomIndex];
    
    document.getElementById("drone-connection").textContent = drone.id;
    document.getElementById("drone-supplies").textContent = drone.supplies.join(", ");
    document.getElementById("drone-battery").textContent = drone.battery + "%";
    document.getElementById("battery-bar").style.width = drone.battery + "%";

    
    const droneHelperIcon = L.icon({
        iconUrl: '/images/drone.png',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
    });
    const droneHelper = L.marker([drone.location[0], drone.location[1]], {
        icon: droneHelperIcon,
        zIndexOffset: 1000
    }).addTo(map);

    // Pass the drone location;
    sateliteResponse.droneLocation = drone.location;
    sateliteResponse.droneHelper = droneHelper;
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

        // Remove loading screen
        const loading = document.querySelector('.loading-container');
        if (loading && loading.parentNode) {
          loading.parentNode.removeChild(loading);
        }

        // Define and set new map view
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Change the status of the latitude and longitude
        document.getElementById('info-lat-long').textContent = `Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}`;

        // Connect to the drone and display the drone status and more information
        connectToDrone(map, latitude, longitude, sateliteResponse);
        document.getElementById('info-additional-container').style.display = 'block';
        
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

        // Based on the satelite response, identifies probable fire
        // Elaborate and reflect more on this

        // Feature to flag on the map
        defineFlagFeature(map, sateliteResponse);

        // Open up the assistancePopup    
        document.getElementById('assistance')
            .addEventListener('click', () => {
                assistancePopup(map, latitude, longitude, sateliteResponse);
            });
    }
}

function defineFlagFeature(map, sateliteResponse){

    if(sateliteResponse.probablyFire.probability == true){
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
    
        const flagIcon = L.icon({
            iconUrl: '/images/flag.png',
            iconSize: [32, 32],    
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });
        // L.marker([lat, lon], { icon: fireFlagIcon }).addTo(map).bindPopup("🔥 Fire reported");
        const fireMarker = L.marker([lat, lon], { icon: flagIcon })
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
    
}

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

    const hospitals = await fetchNearbyHospitals(latitude, longitude);
    if(hospitals.length == 0){
        // -- Make this a paragraph
        console.log('There are no hospitals within your location');
    }
    
    // Sends the hospitals over the backend
    // Write it over to a json
    // --- Add validation this needs to work ---
    
    // --- Make it that it doesn't reload everytime page reloads
    
    const gridData = generateGridData(latitude, longitude);

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
async function fetchAndSimulateSateliteView(){
    if (navigator.geolocation){

        navigator.geolocation.getCurrentPosition(async (position) => {
            try{
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                // Optional: For testing Rome
                // const latitude = 41.9028
                // const longitude = 12.4964

                const sateliteResponse = await simualteSatelite(latitude, longitude)

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
    // When user clicks the arrow, scroll to main site
    document.getElementById('scroll-down').addEventListener('click', () => {
        document.getElementById('main-site').scrollIntoView({ behavior: 'smooth' });
    });
    // Detect first scroll and auto-jump to next section
    // let hasScrolled = false;
    // window.addEventListener('wheel', (e) => {
    // if (!hasScrolled) {
    //     hasScrolled = true;
    //     document.getElementById('main-site').scrollIntoView({ behavior: 'smooth' });
    //     }
    // }, { once: true });

    // accessCamera()

    // Get person's location and simulate the view of a satelite
    fetchAndSimulateSateliteView();
    displayCredits();
    // AI help chat
    document.getElementById('aiInput').addEventListener('keypress', (e) => handleAIButton(e));
}

function displayCredits(){
    const modal = document.getElementById("credits-modal");
    const openModalText = document.getElementById("openModalText");
    const closeModal = document.getElementsByClassName("closeModal");

    openModalText.onclick = function() {
        modal.style.display = "block";
    }

    closeModal.onclick = function() {
        modal.style.display = "none";
    }

    window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
    }
}

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