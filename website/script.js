document.addEventListener('DOMContentLoaded', setup)

// let userLocation = {latitude: null, longitude: null};
/* Main setup (Comment in the future*)
*/
function setup(){

    /* Display the map object
    */
    function updateMap(latitude, longitude){
        // Using leaftlet to simulate drone and map
 
       
       if(latitude != null &&
           latitude != null){

            
            map.setView([latitude, longitude], 13);

            // Add a user marker
            L.marker([latitude, longitude]).addTo(map)
            .bindPopup('This is me')
            .openPopup();

            // L.circle([(latitude), (longitude)], {
            //     color: 'red',
            //     fillColor: '#f03',
            //     fillOpacity: 0.5,
            //     radius: 500
            // }).addTo(map);



            // Help center or a drone constantly circling
            let droneLatitude = latitude-0.30;
            let droneLongitude = longitude-0.50;

            const droneMarker = L.circle([(droneLatitude), (droneLongitude)], {
                color: 'green',
                fillColor: '#000',
                fillOpacity: 0.5,
                radius: 1000
            }).addTo(map);
            

            const targetLatitude = latitude;
            const targetLongitude = longitude;


            function calculateDistance(lat1, lon1, lat2, lon2) {
                const R = 6371; // Radius of the Earth in kilometers
                const dLat = (lat2 - lat1) * Math.PI / 180;
                const dLon = (lon2 - lon1) * Math.PI / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                          Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distance = R * c; // Distance in kilometers
                return distance * 1000; // Convert to meters
            }


            // Test out speed and make sure it doesn't skip the tolerance
            const speed = 0.005;
            const tolerance = 0.001;

            const intervalId = setInterval(()=> {

                console.log('Drone is on its way');
          

                const distance = calculateDistance(droneLatitude, droneLongitude, targetLatitude, targetLongitude);

                if (distance <= tolerance) {
                // if(Math.abs(droneLatitude - targetLatitude) <= tolerance &&
                //     Math.abs(droneLongitude - targetLongitude) <= tolerance){
                    
                    clearInterval(intervalId);
                    console.log("Drone has reached your location and stopped.");
                    droneMarker.setLatLng([targetLatitude, targetLongitude]);

                    
                } else{

                    // Return the new frame
                    const moveTowardsTarget = (current, target, speed) => {
                        if (current < target) {
                            return current + speed; 
                        } else if (current > target) {
                            return current - speed; 
                        }
                        return current; 
                    };

                    // if(droneLatitude < targetLatitude){
                    //     droneLatitude += speed;

                    // } else{
                    //     droneLatitude -= speed;
                    // }

                    // if (droneLongitude < targetLongitude) {
                    //     droneLongitude += speed; 
                    // } else {
                    //     droneLongitude -= speed;
                    // }

                    droneLatitude = moveTowardsTarget(droneLatitude, targetLatitude, speed);
                    droneLongitude = moveTowardsTarget(droneLongitude, targetLongitude, speed);
                    droneMarker.setLatLng([droneLatitude, droneLongitude])
                }

            }, 100)
       }
  
   }

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

    // When the button is clicked
    document.getElementById('assistance').addEventListener('click', function(){
        // alert(`Describe the general location and be specific (Road Signs, Buildings)`);
        
        // If there's nothing around the location, then the robot will say ur good

        // console.log(simulateResponses);

        // Get my location

        // Check if object and the position exists
        console.log(navigator.geolocation)
        if (navigator.geolocation){

            navigator.geolocation.getCurrentPosition((position) => {

                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                document.getElementById('location').textContent = `I got yo ass: 
                    Latitude: ${latitude}, Longitude: ${longitude}`;

                    
               
                // Fetch earthquake data
                fetchEarthquakeData(latitude, longitude);


                // Set the global userLocation variable
                // userLocation.latitude=latitude;
                // userLocation.longitude=longitude;
            
                updateMap(latitude, longitude);


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
            console.log('Locationdead')
        }
    })



    // Display the map
    const map = L.map('map').setView([51.505, -0.09], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // The drone

}

const simulateResponses = [
    "Sorry but you're now dead",
    "Please cover your mouth",
    "There's a tornado, run away",
    "I will provide you with assistance"
]



function getEarthquakeResponse(magnitude){
    switch(true){
        case(magnitude < 3):
            return "You a pussy. No actions needed";
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