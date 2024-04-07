import data from './data.json' assert { type: "json" };
import { genreMapping, locationMapping } from './enum.js';

const gebi = (id) => document.getElementById(id);
const cre = (tag) => document.createElement(tag);

const containerDiv = gebi("container");
const submitButton = gebi("submit");
const genreSelect = gebi("genre");
const locationSelect = gebi("location");

const clearContainer = () => {
    containerDiv.innerHTML = "";
}

const displayPrice = (priceInt) => {
    let priceString = "";
    for (let i = 0; i < priceInt; i++){
        priceString += "$";
    }
    return priceString;
}

const displayLocation = (location) => {
    return (locationMapping[location] == undefined)?location:locationMapping[location];
}

const displayGenre = (genre) => {
    return (genreMapping[genre] == undefined)?genre:genreMapping[genre];
}

const randomSelect = (array) => {
    return array[Math.floor(Math.random()*array.length)];
}

const appendRow = (row) => {
    const newRow = cre("div");
    newRow.innerHTML = `
        <h3><a href="${row.Link}">${row.Restaurant}</a></h3>
        區域：${displayLocation(row.Location)}<br>
        類別：${displayGenre(row.Genre)}<br>
        價格：${displayPrice(parseInt(row.Price))}
    `;
    newRow.classList.add("row");
    containerDiv.appendChild(newRow);
}

submitButton.addEventListener("click", () => {
    clearContainer();
    let genre = genreSelect.value;
    let location = locationSelect.value;
    let rows = [];
    for (let row of data){
        if (location == "Random"){
            location = randomSelect(locations);
        }
        if (genre == "Random"){
            genre = randomSelect(genres);
        }
        if (genre !== row.Genre && genre !== "All"){
            continue;
        }
        if (location !== row.Location && location !== "All"){
            continue;
        }
        rows.push(row);
    }

    // shuffle the result
    rows = rows.sort((a, b) => (Math.random() - 0.5));
    rows.forEach((row) => appendRow(row));
});

// Add options to the select

const createGenreOption = (genre) => {
    let option = cre("option");
    option.value = genre;
    option.innerHTML = displayGenre(genre);
    genreSelect.appendChild(option);
}

let genres = [];
const genreSelectAdd = () => {
    createGenreOption("All");
    createGenreOption("Random");
    for (let row of data){
        let genre = row.Genre;
        if (genres.indexOf(genre) == -1){
            genres.push(genre);
            
            // add to select
            createGenreOption(genre);
        }
    }
}
genreSelectAdd();

const createLocationOption = (location) => {
    let option = cre("option");
    option.value = location;
    option.innerHTML = displayLocation(location);
    locationSelect.appendChild(option);
}

let locations = [];
const locationSelectAdd = () => {
    createLocationOption("All");
    createLocationOption("Random");
    for (let row of data){
        let location = row.Location;
        if (locations.indexOf(location) == -1){
            locations.push(location);
            
            // add to select
            createLocationOption(location);
        }
    }
}
locationSelectAdd();
