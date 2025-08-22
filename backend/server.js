const express = require("express");
const cors = require("cors");
const lowDb = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const bodyParser = require("body-parser");
const { nanoid, customAlphabet } = require("nanoid");
var dayjs = require("dayjs");
const db = lowDb(new FileSync("db.json"));
const app = express();
const random_data = require("./random_data");
var utc = require("dayjs/plugin/utc"); // dependent on utc plugin
var timezone = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Kolkata");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = 8082;

/*
[GET API] used in module 1 to fetch data for all cities
The response is an [array] of cities with each having the following structure :
{
    "id": "<city-id>",
    "city": "<city-name>",
    "description": "<random-string>",
    "image": "<image-url>"
}
Data is sourced from "cities" array in db.json file
*/
app.get("/cities", (req, res) => {
  const data = db.get("cities").value();
  return res.json(data);
});

/*
[GET API] used in module 2 to fetch all adventures for a given city
The response is an [array] of adventures with each having the following structure :
{
    "id": "2447910730",
    "name": "Niaboytown",
    "costPerHead": 4003,
    "currency": "INR",
    "image": "https://images.pexels.com/photos/837745/pexels-photo-837745.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    "duration": 6,
    "category": "Party"
 }
Data is sourced from "adventures" array in db.json file
*/
app.get("/adventures", (req, res) => {
  const data = db.get("adventures").value();
  let response = (data.find((item) => item.id == req.query.city) || [])
    .adventures;
  if (response) return res.json(response);
  else
    return res.status(400).send({
      message: `Adventure not found for ${req.query.city}!`,
    });
});

/*
[GET API] used in module 3 to fetch details for a given adventure
The response is an [array] of adventures with each having the following structure :
 {
    "id": "2447910730",
    "name": "Niaboytown",
    "subtitle": "This is a mind-blowing adventure!",
    "images": [
    "https://images.pexels.com/photos/66997/pexels-photo-66997.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    "https://images.pexels.com/photos/837745/pexels-photo-837745.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    "https://images.pexels.com/photos/1624438/pexels-photo-1624438.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
    ],
    "content": "Random content",
    "available": false,
    "reserved": true,
    "costPerHead": 4003
 }
Data is sourced from "adventures" array in db.json file
*/
app.get("/adventures/detail", (req, res) => {
  const data = db.get("detail").value();
  let response = data.find((item) => item.id == req.query.adventure);
  if (response) return res.json(response);
  else
    return res.status(400).send({
      message: `Adventure details not found for ${req.query.adventure}!`,
    });
});

/*
[GET] API used in module 3 to make a new reservation
Expects serialized form data in the format name=Roy&date=2020-10-08&person=2&adventure=8318638903
If the reservation is successful, it flips the "available" key to "false" and "reserved" key to "true" for the given adventure
*/
app.post("/reservations/new", (req, res) => {
  try {
    const reservation = req.body;

    // Basic presence checks
    if (
      !reservation?.name ||
      !reservation?.date ||
      !reservation?.person ||
      !reservation?.adventure
    ) {
      return res.status(400).json({ message: "Invalid data received" });
    }

    // Parse + validate inputs
    const nameRaw = String(reservation.name).trim();
    const dateRaw = String(reservation.date).trim(); // YYYY-MM-DD
    const person = Math.floor(Number(reservation.person));
    const adventureId = String(reservation.adventure).trim();

    if (
      !nameRaw ||
      !dateRaw ||
      !Number.isFinite(person) ||
      person <= 0 ||
      !adventureId
    ) {
      return res.status(400).json({ message: "Invalid data received" });
    }

    // Date validation: today or future
    const reqDate = dayjs(dateRaw, "YYYY-MM-DD", true);
    if (!reqDate.isValid()) {
      return res
        .status(400)
        .json({ message: "Invalid date format. Use YYYY-MM-DD." });
    }
    const today = dayjs().tz("Asia/Kolkata").startOf("day");
    if (reqDate.isBefore(today)) {
      return res.status(400).json({
        message: "Date of booking is incorrect. Can't book for a past date!",
      });
    }

    // Fetch adventure
    const adv = db.get("detail").find({ id: adventureId }).value();
    if (!adv) {
      return res.status(404).json({ message: "Adventure not found" });
    }

    // Ensure capacity fields exist (for older records)
    const capacity = Number(adv.capacity ?? 0) || 0;
    const booked = Number(adv.booked ?? 0) || 0;

    if (capacity <= 0) {
      return res
        .status(409)
        .json({ message: "This adventure has no capacity configured." });
    }

    const remaining = capacity - booked;
    if (remaining <= 0) {
      // already sold out
      db.get("detail")
        .find({ id: adventureId })
        .assign({
          available: false,
          reserved: true,
        })
        .write();
      return res.status(409).json({ message: "Sold out." });
    }

    if (person > remaining) {
      // not enough seats
      return res.status(409).json({
        message: `Only ${remaining} seat(s) left.`,
        remaining,
      });
    }

    // All good → confirm
    const newBooked = booked + person;
    const isSoldOut = newBooked >= capacity;

    db.get("detail")
      .find({ id: adventureId })
      .assign({
        booked: newBooked,
        available: !isSoldOut,
        reserved: isSoldOut,
      })
      .write();

    const costPerHead = Number(adv.costPerHead) || 0;
    const adventureName = adv.name;

    // Normalize name (title case)
    const name = nameRaw
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" ");

    const idGen = customAlphabet("1234567890abcdef", 16);
    const reservationId = idGen();

    db.get("reservations")
      .push({
        id: reservationId,
        name,
        date: reqDate.format("YYYY-MM-DD"),
        person,
        adventure: adventureId,
        adventureName,
        price: person * costPerHead,
        time: new Date().toString(),
      })
      .write();

    return res.json({
      success: true,
      remaining: capacity - newBooked,
      soldOut: isSoldOut,
    });
  } catch (err) {
    console.error("POST /reservations/new error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/*
[POST] API used in reservations.html page to fetch all reservations
The response is an [array] of reservations with each having the following structure :
{
    "name": "Rahul",
    "date": "2020-10-26",
    "person": "02",
    "adventure": "2447910730",
    "adventureName": "Niaboytown",
    "price": 8006,
    "id": "34b2076696d4e51a",
    "time": "Sun Oct 25 2020 19:32:12 GMT+0530 (India Standard Time)"
}
Data is sourced from "reservations" array in db.json file
*/
app.get("/reservations", (req, res) => {
  const data = db.get("reservations").value();
  if (data) return res.json(data);
});

/*
[POST] API used to insert a randomly generated adventure to a city
The input is of the format
{
    "city": "bangkok"
}
The response is a randomly generated adventure inserted to given city
{
    "success": true,
    "id": "3409781073",
    "name": "Mereceville",
    "costPerHead": 823,
    "currency": "INR",
    "image": "https://images.pexels.com/photos/837745/pexels-photo-837745.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    "duration": 18,
    "category": "Cycling"
}
*/
app.post("/adventures/new", (req, res) => {
  try {
    const categories = ["Beaches", "Cycling", "Hillside", "Party"];
    const places = random_data.places || [];
    const images_collection = random_data.images || [];

    // ---- Resolve city -------------------------------------------------------
    // Prefer body.city; if absent, try to read the first available city from DB.
    let city = (req.body?.city || "").trim();

    // DB shape assumed: adventures: [ { id: "<cityId>", adventures: [] }, ... ]
    const citiesArr = db.get("adventures").value(); // array or undefined

    if (!city) {
      if (Array.isArray(citiesArr) && citiesArr.length && citiesArr[0]?.id) {
        city = String(citiesArr[0].id);
      } else {
        return res.status(400).json({
          success: false,
          message:
            "No city provided and no city found in DB. Seed the DB with at least one city or pass `city` in the request body.",
        });
      }
    }

    // If the city row doesn't exist, create it
    let cityRow = db.get("adventures").find({ id: city }).value();
    if (!cityRow) {
      cityRow = { id: city, adventures: [] };
      db.get("adventures").push(cityRow).write();
    }

    // ---- Build adventure detail --------------------------------------------
    // Defensive image picking: respect array length
    const pickImage = () => {
      if (!images_collection.length) return "";
      const idx = randomInteger(0, images_collection.length - 1);
      return images_collection[idx];
    };

    // collect up to 3 images (allow repeats if pool is smaller; dedupe if you want)
    const images = Array.from(
      { length: Math.min(3, Math.max(1, images_collection.length || 1)) },
      () => pickImage()
    );

    const nanoid = customAlphabet("1234567890", 10);
    const id = nanoid();

    const name =
      places.length > 0
        ? places[Math.floor(Math.random() * places.length)]
        : `Adventure ${id}`;

    const price = randomInteger(500, 5000);

    const adventureDetail = {
      id,
      name,
      subtitle: "This is a mind-blowing randomly generated adventure!",
      images,
      content:
        "A random paragraph can also be an excellent way for a writer to tackle writers' block. Writing block can often happen due to being stuck with a current project that the writer is trying to complete. By inserting a completely random paragraph from which to begin, it can take down some of the issues that may have been causing the writers' block in the first place.",
      available: true,
      reserved: false,
      costPerHead: price,
    };

    const adventuresData = {
      id,
      name,
      costPerHead: price,
      currency: "INR",
      image: images[Math.floor(Math.random() * images.length)] || "",
      duration: randomInteger(1, 20),
      category: categories[Math.floor(Math.random() * categories.length)],
    };

    // ---- Persist ------------------------------------------------------------
    db.get("detail").push(adventureDetail).write();

    const currentAdventures =
      db.get("adventures").find({ id: city }).get("adventures").value() || [];

    currentAdventures.push(adventuresData);

    db.get("adventures")
      .find({ id: city })
      .assign({ adventures: currentAdventures })
      .write();

    // ---- Respond ------------------------------------------------------------
    res.json({ success: true, city, ...adventuresData });
  } catch (err) {
    console.error("POST /adventures/new error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err?.message || String(err),
    });
  }
});

app.listen(process.env.PORT || PORT, () => {
  console.log(`Backend is running on port ${process.env.PORT || PORT}`);
});

/*
Helper function to generate a random integer between two limits
*/
function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
