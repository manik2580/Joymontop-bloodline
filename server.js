const express = require("express")
const cors = require("cors")
const fs = require("fs").promises
const path = require("path")

const app = express()
const port = process.env.PORT || 3000

// Path to the JSON file for storing donor data
const DATA_FILE = path.join(__dirname, "data", "donors.json")

// Middleware
// Enable CORS for all origins. In a production environment, you would restrict this
// to your specific frontend domain(s) for security.
app.use(cors())
// Enable parsing of JSON request bodies
app.use(express.json())
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")))

/**
 * Helper function to read donor data from the JSON file.
 * If the file doesn't exist, it creates an empty one.
 * @returns {Array} An array of donor objects.
 */
async function readDonors() {
  try {
    const data = await fs.readFile(DATA_FILE, "utf8")
    return JSON.parse(data)
  } catch (error) {
    if (error.code === "ENOENT") {
      // File does not exist, return empty array and create the file
      await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
      await fs.writeFile(DATA_FILE, "[]", "utf8")
      return []
    }
    console.error("Error reading donor data:", error)
    return [] // Return empty array on other errors
  }
}

/**
 * Helper function to write donor data to the JSON file.
 * @param {Array} donors - The array of donor objects to save.
 */
async function writeDonors(donors) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(donors, null, 2), "utf8")
  } catch (error) {
    console.error("Error writing donor data:", error)
  }
}

// API Endpoints

/**
 * @route GET /api/donors
 * @description Get all saved donor data.
 */
app.get("/api/donors", async (req, res) => {
  const donors = await readDonors()
  res.json(donors)
})

/**
 * @route POST /api/donors
 * @description Handle form submissions and save new donor data.
 */
app.post("/api/donors", async (req, res) => {
  const newDonor = req.body

  // Basic validation for required fields
  if (!newDonor.name || !newDonor.blood_group || !newDonor.phone || !newDonor.address) {
    return res.status(400).json({ message: "Missing required donor fields." })
  }

  const donors = await readDonors()

  // Ensure unique ID. The frontend generates an ID using Date.now().toString().
  // This backend check ensures uniqueness in case of collisions or direct API calls.
  if (!newDonor.id || donors.some((d) => d.id === newDonor.id)) {
    newDonor.id = Date.now().toString() // Generate a new unique ID if not provided or duplicate
  }

  // Ensure isVerified is a boolean, defaulting to false if not provided
  newDonor.isVerified = typeof newDonor.isVerified === "boolean" ? newDonor.isVerified : false

  donors.push(newDonor)
  await writeDonors(donors)
  res.status(201).json(newDonor) // Respond with the created donor object
})

/**
 * @route PUT /api/donors/:id
 * @description Update an existing donor by ID.
 */
app.put("/api/donors/:id", async (req, res) => {
  const donorId = req.params.id
  const updatedDonorData = req.body
  const donors = await readDonors()

  const index = donors.findIndex((d) => d.id === donorId)

  if (index !== -1) {
    // Merge existing donor data with updated data, preserving the original ID
    donors[index] = { ...donors[index], ...updatedDonorData, id: donorId }
    await writeDonors(donors)
    res.json(donors[index]) // Respond with the updated donor object
  } else {
    res.status(404).json({ message: "Donor not found." })
  }
})

/**
 * @route DELETE /api/donors/:id
 * @description Delete a donor by ID.
 */
app.delete("/api/donors/:id", async (req, res) => {
  const donorId = req.params.id
  let donors = await readDonors()

  const initialLength = donors.length
  donors = donors.filter((d) => d.id !== donorId)

  if (donors.length < initialLength) {
    await writeDonors(donors)
    res.status(204).send() // 204 No Content indicates successful deletion
  } else {
    res.status(404).json({ message: "Donor not found." })
  }
})

/**
 * @route DELETE /api/donors/reset
 * @description Reset all donor data (clear the JSON file).
 */
app.delete("/api/donors/reset", async (req, res) => {
  await writeDonors([]) // Write an empty array to clear all data
  res.status(204).send() // 204 No Content indicates successful reset
})

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`)
  console.log(`Frontend served from http://localhost:${port}/index.html`)
})
