document.addEventListener('DOMContentLoaded', getLocation)

function getLocation(){

    async function fetchEarthquakeData(latitude, longitude, maxradius=100){
        const earthquakeResponse = await fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${latitude}&longitude=${longitude}&maxradius=${maxradius}`)
        if (earthquakeResponse.ok){
            const earthquakeData = await earthquakeResponse.json()

            // Have different instructions for different levels

            earthquakeData.features[0].properties.mag = 10

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
    document.getElementById('clickMe').addEventListener('click', function(){
        // alert(`Describe the general location and be specific (Road Signs, Buildings)`);
        
        // If there's nothing around the location, then the robot will say ur good

        console.log(simulateResponses);

        // Get my location
        if (navigator.geolocation){
            navigator.geolocation.getCurrentPosition((position) => {

                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                document.getElementById('location').textContent = `I got yo ass: 
                    Latitude: ${latitude}, Longitude: ${longitude}`;


                fetchEarthquakeData(latitude, longitude);

                // Now its going to use the location to find if there's a crucial disaster nearby
                // If there's nothing then rip u die
                // If the disaster is bigger then the "drones" will prioritze you
                // The ai will categorize the severity of the disaster

                // sendLocationToServer(latitude, longitude);
            })
             
        }
    })

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