import config from "../conf/index.js";

//Implementation to extract adventure ID from query params
function getAdventureIdFromURL(search) {
  // TODO: MODULE_ADVENTURE_DETAILS
  // 1. Get the Adventure Id from the URL

  let url = new URLSearchParams(search);

  let result = url.get("adventure");

  console.log(result);
  return result;


  // Place holder for functionality to work in the Stubs
  //return null;
}
//Implementation of fetch call with a paramterized input based on adventure ID
async function fetchAdventureDetails(adventureId) {
  // TODO: MODULE_ADVENTURE_DETAILS
  // 1. Fetch the details of the adventure by making an API call

  try{
    let response = await fetch(config.backendEndpoint +`/adventures/detail/?adventure=${adventureId}`)
    let data = await response.json();

    console.log(data);
    return data;
  }
  catch(error){
    return null;
  }


  // Place holder for functionality to work in the Stubs
  //return null;
}

//Implementation of DOM manipulation to add adventure details to DOM
function addAdventureDetailsToDOM(adventure) {
  // TODO: MODULE_ADVENTURE_DETAILS
  // 1. Add the details of the adventure to the HTML DOM


  //nameElement.innerHTML = adventure.name;
  //subtitleElement.innerHTML = adventure.subtitle;




  // name
  const {name, subtitle, images, content} = adventure;
  // let nameElement = document.createElement("div");
  let nameElement = document.getElementById("adventure-name");
  nameElement.innerHTML = name;
  
  //subtitles

  let subtitleElement = document.getElementById("adventure-subtitle");
  subtitleElement.innerHTML = subtitle;
  // document.getElementById("adventure-subtitle").append(subtitleElement);

  //adding images

  // console.log(adventure);
  let photoGallery = document.getElementById("photo-gallery");


  images.map((image) =>{
    //image.preventDefault();
  const divElement = document.createElement("div");
  divElement.classList = "col-lg-12";

  divElement.innerHTML = `
  <img src=${image} class ="activity-card-image pb-3 pb-md-0"
  />
  `
  photoGallery.appendChild(divElement);
  });


  //content

  const contentElement = document.getElementById("adventure-content");
  contentElement.innerHTML = content;

  // document.getElementById("adventure-content").append(contentElement);?
  
}

//Implementation of bootstrap gallery component
function addBootstrapPhotoGallery(images) {
  // TODO: MODULE_ADVENTURE_DETAILS
  // 1. Add the bootstrap carousel to show the Adventure images

  let photoGallery = document.getElementById("photo-gallery");

  photoGallery.innerHTML =
  `
  <div id="carouselExampleIndicators" class="carousel slide" data-bs-ride="carousel">
  <div class="carousel-indicators">
    <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="0" class="active" aria-current="true" aria-label="Slide 1"></button>
    <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="1" aria-label="Slide 2"></button>
    <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="2" aria-label="Slide 3"></button>
  </div>
  <div class="carousel-inner" id="carousel-inner">
    
  </div>
  <button class="carousel-control-prev" type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide="prev">
    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
    <span class="visually-hidden">Previous</span>
  </button>
  <button class="carousel-control-next" type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide="next">
    <span class="carousel-control-next-icon" aria-hidden="true"></span>
    <span class="visually-hidden">Next</span>
  </button>
</div>
  `
let carouselInner = document.getElementById("carousel-inner");


  images.map((image,index) =>{
    const divElement = document.createElement("div");
    divElement.className = `carousel-item ${index=== 0 ? "active" : ""}`;
  
    divElement.innerHTML = `
    <img src=${image} class ="activity-card-image pb-3 pb-md-0"
    />
    `
    carouselInner.appendChild(divElement);
  });



}

//Implementation of conditional rendering of DOM based on availability
function conditionalRenderingOfReservationPanel(adventure) {
  // TODO: MODULE_RESERVATIONS
  // 1. If the adventure is already reserved, display the sold-out message.

  if(adventure.available){
    document.getElementById("reservation-panel-available").style.display = "block";
    document.getElementById("reservation-panel-sold-out").style.display = "none";
    document.getElementById("reservation-person-cost").innerHTML= adventure.costPerHead;
  
  }
  else{
    document.getElementById("reservation-panel-sold-out").style.display = "block";
    document.getElementById("reservation-panel-available").style.display = "none";
    // document.getElementById("reservation-person-cost").innerHTML = adventure.costPerHaed;
  }

}

//Implementation of reservation cost calculation based on persons
function calculateReservationCostAndUpdateDOM(adventure, persons) {
  // TODO: MODULE_RESERVATIONS
  // 1. Calculate the cost based on number of persons and update the reservation-cost field
document.getElementById("reservation-cost").innerHTML = adventure.costPerHead*persons;
}

//Implementation of reservation form submission
function captureFormSubmit(adventure) {
  // TODO: MODULE_RESERVATIONS
  // 1. Capture the query details and make a POST API call using fetch() to make the reservation
  // 2. If the reservation is successful, show an alert with "Success!" and refresh the page. If the reservation fails, just show an alert with "Failed!".
  

  let form = document.getElementById("myForm");

  form.addEventListener("submit", async (event) => {
    
    event.preventDefault()

    let url = config.backendEndpoint + "/reservations/new";

    let formElements = form.elements;

    console.log(formElements);

    let payLoads ={
      name:formElements["name"].value.trim(),
      date:formElements["date"].value,
      person:formElements["person"].value,
      adventure:adventure.id,
    }
    try{
    let response = await fetch(url, {
      method:"POST",
      body:JSON.stringify(payLoads),
      headers:{
        "content-type":"application/json"
      }
    });

      if(response.ok){
        alert("success");
      }

      else{
        alert("failed");
      }
    }
    catch (error){
      alert("Failed-to fetch");
    }
  });
}

//Implementation of success banner after reservation
function showBannerIfAlreadyReserved(adventure) {
  // TODO: MODULE_RESERVATIONS
  // 1. If user has already reserved this adventure, show the reserved-banner, else don't
    if(adventure.reserved){
      document.getElementById("reserved-banner").style.display = "block";
    }
    else{
    document.getElementById("reserved-banner").style.display = "none";
    }
}

export {
  getAdventureIdFromURL,
  fetchAdventureDetails,
  addAdventureDetailsToDOM,
  addBootstrapPhotoGallery,
  conditionalRenderingOfReservationPanel,
  captureFormSubmit,
  calculateReservationCostAndUpdateDOM,
  showBannerIfAlreadyReserved,
};
