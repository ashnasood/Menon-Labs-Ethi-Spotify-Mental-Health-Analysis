/* To create a table with the list of songs in a session */

let session = [
    { trackName: "!", artistName: "Samey", emotion: "Energetic" },
    { trackName: "! (The Song Formerly Known As)", artistName: "Regurgitator", emotion: "Energetic" },
    { trackName: "!!De Repente!!", artistName: "Rosendo", emotion: "Energetic" },
    { trackName: "!H.a.p.p.y!", artistName: "Dawid Podsiad\u0142o", emotion: "Chill" },
    { trackName: "!I'll Be Back!", artistName: "Ril\u00e8s", emotion: "Energetic" }
];

// Generates the header row of the table
function generateTableHead(table, data) {
  let thead = table.createTHead();
  let row = thead.insertRow();
  for (let key of data) {
    let th = document.createElement("th");
    let text = document.createTextNode(key);
    th.appendChild(text);
    row.appendChild(th);
  }
}

// Creates rows and columns and populates the table with the given data
function generateTable(table, data) {
  for (let element of data) {
    let row = table.insertRow();
    for (key in element) {
      let cell = row.insertCell();
      let text = document.createTextNode(element[key]);
      cell.appendChild(text);
    }
  }
}

// looks for the <table> tag in the HTML file
let table = document.querySelector("table");
// start from the beginning of the data object
let data = Object.keys(session[0]);

// Create the complete table 
generateTable(table, session);
generateTableHead(table, data);
