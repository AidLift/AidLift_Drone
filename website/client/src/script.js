import L from 'leaflet';
import 'leaflet/dist/leaflet.css';


document.addEventListener('DOMContentLoaded', setup)
///****** Fix the comments, kinda bad rn */


async function getBestHospitalPath(latitude, longitude){
    try {
        const res = await fetch('http://192.168.2.135:5000/detect-fire', {
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
 * Creation of the drone marker
 * - Moves the drone to the target (My location)
 * 
 * Maybe change the name to get assistance and moveDroneToTarget
 * to the functions below
 */
async function moveDroneToTarget(map, latitude, longitude, nearbyFires, range = 70000){
    let droneLatitude = latitude-0.30;
    let droneLongitude = longitude-0.50;

    let fireLat = null
    let fireLong = null


    const targetFire = nearbyFires.find(fire => {
        const fireDistance = calculateDistance(droneLatitude, droneLongitude,
            fire.latitude, fire.longitude);

        console.log(fireDistance);

        fireLat = fire.latitude;
        fireLong = fire.longitude;
        return fireDistance <= range

    });

    if (!targetFire) {
        console.log("❌ No fires are within range. Drone will not be deployed.");
        return;
    }

    console.log(`🔥 Fire is within ${range}m. Deploying drone...`);
        

    // Generate the best path for hospital//

    if(fireLat && fireLong){
        console.log('lat',fireLat)
        console.log('long',fireLong)

        const hospitalPath = await getBestHospitalPath(fireLat, fireLong);
        console.log('HOSPITALPATH',hospitalPath);
    }

    // *****
            
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

        console.log('Drone is on its way');
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
 * Updates the map with person's location, nearby hospitals, nearby fires
 * @param {*} latitude 
 * @param {*} longitude 
 */
function updateMapWithSurroundings(map, latitude, longitude, nearbyFires, hospitals){
   if(latitude != null &&
       longitude != null){

        // Set new map view
        map.setView([latitude, longitude], 13);

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
        const fireDefaultIcon = L.icon({
            iconUrl: '/images/fire.jpg',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });
        const fireIntenseIcon = L.icon({
            iconUrl: '/images/fireIntense.jpg',
            iconSize: [60, 60],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });


        for (const fire of nearbyFires){
            let fireIcon = fireDefaultIcon

            console.log(fire.intensity);

            if(fire.intensity > 4){
                fireIcon = fireIntenseIcon
            }

            const fireMarker = L.marker([fire.latitude, fire.longitude], {
                icon: fireIcon
            }).addTo(map);

        }

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
        document.getElementById('assistance').addEventListener('click', () => moveDroneToTarget(map, latitude, longitude, nearbyFires));

    }
}

async function fetchNearbyHospitals(latitude, longitude, radius = 10000){

    const query = `
        [out:json];
        node["amenity"="hospital"](around:${radius},${latitude},${longitude});
        out;
    `;

    const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
    });

    if (response.ok){
        const data = await response.json();
        return data.elements.map(hospital => ({
            name: hospital.tags?.name || "Unnamed Hospital",
            lat: hospital.lat,
            lon: hospital.lon,
        }));
    }

}

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


/**
 * Retrive the all the surroundings, location, fires, hospitals
 * @param {*} map 
 */
async function retrieveSurroundings(map){
    if (navigator.geolocation){

        navigator.geolocation.getCurrentPosition(async (position) => {

            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            document.getElementById('location').textContent = `Location: 
                Latitude: ${latitude}, Longitude: ${longitude}`;

            const nearbyFires = generateNearbyFires(latitude, longitude);

            // Fetch the nearby hospitals (Performance is kinda ehh)
            const hospitals = await fetchNearbyHospitals(latitude, longitude);
            console.log(hospitals);

            // Update the map to the person's location
            updateMapWithSurroundings(map, latitude, longitude, nearbyFires, hospitals);

            // Fetch earthquake data
            fetchEarthquakeData(latitude, longitude);



            // Now its going to use the location to find if there's a crucial disaster nearby
            // If there's nothing then rip u die
            // If the disaster is bigger then the "drones" will prioritze you
            // The ai will categorize the severity of the disaster

            // sendLocationToServer(latitude, longitude);
        }, (error)=> {

            document.getElementById('location').textContent = `You might be offline, 
                please turn on the internet!`
            console.log(error);
        })
         
    } else{
        // Add proper error handling
        console.log('Locationdead')
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

    const map = L.map('map').setView([51.505, -0.09], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Get person's location
    retrieveSurroundings(map);

    // When the button is clicked
    // document.getElementById('assistance').addEventListener('click', () => getLocationAndSendHelp(map));
    
    // AI help chat
    document.getElementById('aiInput').addEventListener('keypress', (e) => handleAIButton(e));
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
        console.log('Hello')
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


// Not sure if these are being used
const simulateResponses = [
    "Sorry but you're now dead",
    "Please cover your mouth",
    "There's a tornado, run away",
    "I will provide you with assistance"
]


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