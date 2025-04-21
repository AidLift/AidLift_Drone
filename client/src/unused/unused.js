// ==================== FUTRE IMPLEMENTATIONS ====================
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

// Fetch earthquake data
// fetchEarthquakeData(latitude, longitude);



// Now its going to use the location to find if there's a crucial disaster nearby
// If there's nothing then rip u die
// If the disaster is bigger then the "drones" will prioritze you
// The ai will categorize the severity of the disaster



// For the fire calculations

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



    // * @param {Array<Object>} nearbyFires - An array of nearby fire objects with latitude and longitude. //




// -- NearbyFire Generations

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
const nearbyFires = generateNearbyFires(latitude, longitude);



    


// -- Calculate the disatance of the nearby fire and the person
// Finds the closest fires with the range
for(const fire of nearbyFires){
    const fireDistance = calculateDistance(latitude, longitude,
        fire.latitude, fire.longitude);

    if (fireDistance <= range && fireDistance < closestDistance) {
        closestDistance = fireDistance;
        closestFire = fire;
    }
}


if (!closestFire) {
    console.log("❌ No fires are within range. Drone will not be deployed.");
    return;
}

console.log(`🔥 Fire is within ${range}m. Deploying drone...`);
console.log('Closest fire is ',closestFire)

// Generate the best path for hospital//

if(closestFire.latitude && closestFire.longitude){
    console.log('lat',closestFire.latitude)
    console.log('long',closestFire.longitude)
}


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