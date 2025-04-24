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



async function fetchHospitals() {
    try {
      const response = await fetch('http://192.168.2.135:5000/get-hospitals');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("Hospitals:", data.hospitals);
      
      // You can now use data.hospitals to do stuff in your UI
      return data.hospitals;
  
    } catch (error) {
      console.error("Failed to fetch hospitals:", error);
    }
  }


  

// function getImageOrVideo(event){
//     event.preventDefault();
//     console.log('SENT')

//     const mediaInput = document.getElementById('mediaInput');
//     const file = mediaInput.files[0];

//     if (file) {
//         console.log("Selected file:", file);
//         console.log("File type:", file.type);
  
//         const formData = new FormData();
//         formData.append("media", file);
  
//         fetch('/api/upload-media', {
//           method: 'POST',
//           body: formData
//         })
//         .then(response => response.text())
//         .then(result => {
//           console.log("Upload success:", result);
//         })
//         .catch(error => {
//           console.error("Upload error:", error);
//         });
//       }
// }



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
                
                await fetch('http://192.168.2.135:5000/save-hospitals', {
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
                await fetch('http://192.168.2.135:5000/save-grid-info', {
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

    // await writeDataToJson(hospitals, gridData.bounds, gridData.dimensions);


    // let closestDistance = Infinity
    // let closestFire = null



    async function testOutNewPath(latitude, longitude, hospitalPath, sateliteResponse){

        // If its undefined check out the add error handling
        const convertHospiCoords = gridToLatLon(hospitalPath.nearest_hospital.grid, 
            sateliteResponse.gridData)
    
        
        const condasfsa = gridToLatLon([228, 269], 
            sateliteResponse.gridData)
        console.log('dddasa', condasfsa)
    
        try {
            const response = await fetch('http://192.168.2.135:5001/api/get-path', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                start: [latitude, longitude],
                end: convertHospiCoords
            })
            });
        
            // Check if the response is OK (status 200-299)
            if (response.ok) {
                const data = await response.json(); 
                // console.log('Response: PATHHTHS', data);
                return data;
            } else {
                console.error('Server error:', response.status, await response.text());
            }
        } catch (error) {
            console.error('Request failed', error);
        }
    }


    // First function
function gridToLatLon(coords, gridData) {
    const { min_lat, max_lat, min_lon, max_lon } = gridData.bounds;
    const { width, height } = gridData.dimensions;
  
    const lat = max_lat - (coords[1] / height) * (max_lat - min_lat);
    const lon = min_lon + (coords[0] / width) * (max_lon - min_lon);
  
    return [lat, lon];
}