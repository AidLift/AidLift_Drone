document.addEventListener('DOMContentLoaded', setup)
///****** Fix the comments, kinda bad rn */



/**
 * Creation of the drone marker
 * - Moves the drone to the target (My location)
 */
function moveDroneToTarget(map, latitude, longitude){
    
    // Help center or a drone constantly circling
    let droneLatitude = latitude-0.30;
    let droneLongitude = longitude-0.50;

    const droneHelperIcon = L.icon({
        iconUrl: 'images/drone.png',
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


    // Calcuates disatnce of two points on the surface of a sphere
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

        console.log(distance)
        console.log(tolerance)

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
}



/**
 * Display the updated map that corresponds to my location
 * @param {*} latitude 
 * @param {*} longitude 
 */
function updateMapToLocation(map, latitude, longitude){
   if(latitude != null &&
       longitude != null){

        map.setView([latitude, longitude], 13);

        // Add a user marker
        L.marker([latitude, longitude]).addTo(map)
        .bindPopup('This is me')
        .openPopup();

        // Drone is created and moved to the lat and long given
        moveDroneToTarget(map, latitude, longitude);
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

/**
 * Retrive the requester's location
 * @param {*} map 
 */
function getLocationAndSendHelp(map){
    if (navigator.geolocation){

        navigator.geolocation.getCurrentPosition((position) => {

            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            document.getElementById('location').textContent = `Location: 
                Latitude: ${latitude}, Longitude: ${longitude}`;

                
            // Fetch earthquake data
            fetchEarthquakeData(latitude, longitude);
        
            // Update the map to the person's location
            updateMapToLocation(map, latitude, longitude);

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
 */
function setup(){

    // Display the original map
    // -- Add a random spawn everytime

    const map = L.map('map').setView([51.505, -0.09], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // When the button is clicked
    // -- Clean up into helper method
    document.getElementById('assistance').addEventListener('click', () => getLocationAndSendHelp(map));
    
    document.getElementById('ai').addEventListener('click', handleAIButton)
}


const handleAIButton = () => {
    console.log('click')
    fetch('/test')
        .then(res => res.json())
        .then(data => {
            console.log('Response from server:', data.message);
            document.getElementById('response').textContent = data.message;
        })
        .catch(err => console.error('Error:', err));

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