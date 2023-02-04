import config from "../conf/index.js";

async function init() {
  //Fetches list of all cities along with their images and description
  let cities = await fetchCities();

  //console.log("hello");
  //console.log(config+"/cities");

  //Updates the DOM with the cities
  cities.forEach((key) => {
    addCityToDOM(key.id, key.city, key.description, key.image);
  });
}

//Implementation of fetch call
async function fetchCities() {
  // TODO: MODULE_CITIES
  // 1. Fetch cities using the Backend API and return the data

  try{

    let result = await fetch(config.backendEndpoint + "/cities");
     let data = await result.json();
     return data;
     //console.log(data);
  }
  catch(error){
    return null;
  }


};

//Implementation of DOM manipulation to add cities
function addCityToDOM(id, city, description, image) {
  // TODO: MODULE_CITIES
  // 1. Populate the City details and insert those details into the DOM

  let container = document.createElement("div");
  container.className = "col-6 col-lg-3 mb-4";

  container.innerHTML = 
                  `
                  <a href="pages/adventures/?city=${id}" id="${id}"

                  <div class="tile">
                    <div class="tile-text text-center">
                        <h5>${city}</h5>
                        <p>${description}</p>
                        </div>
                        <img class ="img-responsive" src ="${image}"/>
                        </a>
                        `;

                  document.getElementById("data").appendChild(container);


  

}
// console.log("hello")

export { init, fetchCities, addCityToDOM };
