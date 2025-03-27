document.addEventListener('DOMContentLoaded', getLocation)

function getLocation(){
    document.getElementById('clickMe').addEventListener('click', function(){
        // alert(`Describe the general location and be specific (Road Signs, Buildings)`);
        
        // If there's nothing around the location, then the robot will say ur good

        console.log(simulateResponses);

        if (navigator.geolocation){
            navigator.geolocation.getCurrentPosition((position) => {

                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                document.getElementById('location').textContent = `I got yo ass: 
                    Latitude: ${latitude}, Longitude: ${longitude}`;

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