import config from "../conf/index.js";

//Implementation of fetch call to fetch all reservations
async function fetchReservations() {
  // TODO: MODULE_RESERVATIONS
  // 1. Fetch Reservations by invoking the REST API and return them
  try{
 let res = await fetch(config.backendEndpoint +"/reservations/");

 let data = await res.json();
// console.log(data);
 return data;
}
catch(error){

  return null;
}
  // Place holder for functionality to work in the Stubs
 // return null;

}

//Function to add reservations to the table. Also; in case of no reservations, display the no-reservation-banner, else hide it.
function addReservationToTable(reservations) {
  // TODO: MODULE_RESERVATIONS
  // 1. Add the Reservations to the HTML DOM so that they show up in the table

  //Conditionally render the no-reservation-banner and reservation-table-parent

  /*
    Iterating over reservations, adding it to table (into div with class "reservation-table") and link it correctly to respective adventure
    The last column of the table should have a "Visit Adventure" button with id=<reservation-id>, class=reservation-visit-button and should link to respective adventure page

    Note:
    1. The date of adventure booking should appear in the format D/MM/YYYY (en-IN format) Example:  4/11/2020 denotes 4th November, 2020
    2. The booking time should appear in a format like 4 November 2020, 9:32:31 pm
  */

    let reservationTable = document.getElementById("reservation-table");


  if(reservations.length > 0){
    document.getElementById("no-reservation-banner").style.display = "none";
    document.getElementById("reservation-table-parent").style.display = "block";

}
else{
  document.getElementById("no-reservation-banner").style.display = "block";
  document.getElementById("reservation-table-parent").style.display = "none";

} 
  // let reservationTable = document.getElementById("reservation-table");
    reservations.map((ele) => {
      let newElement = document.createElement("tr");
      // console.log(newElement);
      console.log(ele.time);
      //console.log(ele.adventure);

      let datestr = ele.date;
      let date = new Date(datestr);
      let formattedDate = date.toLocaleDateString('en-IN', { year: 'numeric', month: 'numeric', day: 'numeric' });
      
      console.log(formattedDate); // Output: "02/17/2023"
      
      
      let dateStr = ele.time;
      let time = new Date(dateStr);
      let formattedTime = time.toLocaleString('en-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: 'numeric', 
        minute: 'numeric', 
        second: '2-digit', 
        hour12: true 
      });
      
      // console.log(formattedTime); // Output: "11/4/2023, 9:32:31 PM"
      let result = formattedTime;
      result = result.replace(" at ",", ");

      console.log(result); // Output: "February 3, 2023, 4:11:13 PM"





      newElement.innerHTML = `
      <th>${ele.id}</th>
      <td>${ele.name}</td>
      <td>${ele.adventureName}</td>
      <td>${ele.person}</td>
      <td>${formattedDate}</td>
      <td>${ele.price}</td>
      <td>${result}</td>
      <td>
        <div class="reservation-visit-button" id=${ele.id}>
          <a href="../detail/?adventure=${ele.adventure}">Visit Adventure</a>
         </div>
      </td>
      `
      // console.log(newElement);
      reservationTable.appendChild(newElement);
    })

    

}

export { fetchReservations, addReservationToTable };
