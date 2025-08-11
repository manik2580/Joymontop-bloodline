document.addEventListener("DOMContentLoaded", () => {
  // Add this line at the very top of script.js, after the DOMContentLoaded listener
  const BASE_API_URL = "https://joymontop-bloodline-1.onrender.com" // Replace with your actual Render URL

  // --- Global Navigation (Hamburger Menu) ---
  const hamburgerMenu = document.querySelector(".hamburger-menu")
  const navList = document.querySelector(".nav-list")

  if (hamburgerMenu && navList) {
    hamburgerMenu.addEventListener("click", () => {
      navList.classList.toggle("active")
    })
  }

  // --- API Helper Functions ---
  // These functions abstract the fetch API calls to the backend.

  /**
   * Fetches all donor data from the backend API.
   * @returns {Array} An array of donor objects.
   */
  const getDonorsFromApi = async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/api/donors`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const donors = await response.json()
      // Ensure each donor object has an 'isVerified' property, defaulting to false.
      return donors.map((donor) => ({
        ...donor,
        isVerified: typeof donor.isVerified === "boolean" ? donor.isVerified : false,
      }))
    } catch (e) {
      console.error("Error fetching donors from API:", e)
      return []
    }
  }

  /**
   * Sends new donor data to the backend API.
   * @param {Object} donorData - The donor object to save.
   * @returns {Object} The saved donor object from the API.
   */
  const addDonorToApi = async (donorData) => {
    try {
      const response = await fetch(`${BASE_API_URL}/api/donors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(donorData),
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (e) {
      console.error("Error adding donor to API:", e)
      return null
    }
  }

  /**
   * Updates existing donor data in the backend API.
   * @param {string} id - The ID of the donor to update.
   * @param {Object} donorData - The updated donor object.
   * @returns {Object} The updated donor object from the API.
   */
  const updateDonorInApi = async (id, donorData) => {
    try {
      const response = await fetch(`${BASE_API_URL}/api/donors/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(donorData),
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (e) {
      console.error("Error updating donor in API:", e)
      return null
    }
  }

  /**
   * Deletes donor data from the backend API.
   * @param {string} id - The ID of the donor to delete.
   * @returns {boolean} True if successful, false otherwise.
   */
  const deleteDonorFromApi = async (id) => {
    try {
      const response = await fetch(`${BASE_API_URL}/api/donors/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return true // 204 No Content usually means success
    } catch (e) {
      console.error("Error deleting donor from API:", e)
      return false
    }
  }

  /**
   * Resets all donor data in the backend API.
   * @returns {boolean} True if successful, false otherwise.
   */
  const resetAllDonorsInApi = async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/api/donors/reset`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return true // 204 No Content usually means success
    } catch (e) {
      console.error("Error resetting donors in API:", e)
      return false
    }
  }

  // --- Public Donor Registration Page Logic (register.html) ---
  const publicRegistrationForm = document.getElementById("donor-registration-form")
  const publicSuccessMessage = document.getElementById("success-message")

  if (publicRegistrationForm) {
    publicRegistrationForm.addEventListener("submit", async (event) => {
      event.preventDefault() // Prevent default form submission

      const formData = new FormData(publicRegistrationForm)
      const donorData = {}
      for (const [key, value] of formData.entries()) {
        donorData[key] = value
      }

      // Generate a simple unique ID (for demo purposes, backend will also ensure uniqueness)
      donorData.id = Date.now().toString()
      donorData.isVerified = false // New donors are unverified by default

      const savedDonor = await addDonorToApi(donorData)

      if (savedDonor) {
        // Show success message
        if (publicSuccessMessage) {
          publicSuccessMessage.style.display = "block"
          setTimeout(() => {
            publicSuccessMessage.style.display = "none"
          }, 3000) // Hide message after 3 seconds
        }
        // Clear the form
        publicRegistrationForm.reset()
      } else {
        alert("ডোনার রেজিস্ট্রেশন ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।")
      }
    })
  }

  // --- Admin Login Page Logic (admin.html) ---
  const adminLoginForm = document.getElementById("admin-login-form")
  const loginErrorMessage = document.getElementById("login-error-message")

  if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", (event) => {
      event.preventDefault()

      const username = adminLoginForm.elements.username.value
      const password = adminLoginForm.elements.password.value

      // Hardcoded admin credentials (frontend-only authentication)
      const ADMIN_USERNAME = "Joymontop@blood2025"
      const ADMIN_PASSWORD = "Manik#80822"

      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        sessionStorage.setItem("isAdminLoggedIn", "true") // Store login status
        window.location.href = "admin-panel.html" // Redirect to admin panel
      } else {
        loginErrorMessage.style.display = "block" // Show error message
      }
    })
  }

  // --- Admin Panel Page Logic (admin-panel.html) ---
  const donorForm = document.getElementById("donor-form")
  const donorsTableBody = document.querySelector("#donors-table tbody")
  const noDonorsMessage = document.getElementById("no-donors-message")
  const submitDonorButton = document.getElementById("submit-donor-button")
  const cancelEditButton = document.getElementById("cancel-edit-button")
  const logoutButton = document.getElementById("logout-button")
  const resetDonorsButton = document.getElementById("reset-donors-button")
  const isVerifiedCheckbox = document.getElementById("is-verified")

  if (donorForm && donorsTableBody) {
    // Check if admin is logged in, otherwise redirect
    if (sessionStorage.getItem("isAdminLoggedIn") !== "true") {
      window.location.href = "admin.html"
      return // Stop further execution
    }

    // Logout functionality
    if (logoutButton) {
      logoutButton.addEventListener("click", () => {
        sessionStorage.removeItem("isAdminLoggedIn") // Clear login status
        window.location.href = "admin.html" // Redirect to login page
      })
    }

    // Reset All Donors functionality (uncommented from original HTML)
    if (resetDonorsButton) {
      resetDonorsButton.addEventListener("click", async () => {
        if (confirm("আপনি কি নিশ্চিত যে আপনি সকল ডোনারের তালিকা রিসেট করতে চান? এই অ্যাকশনটি পূর্বাবস্থায় ফেরানো যাবে না।")) {
          const success = await resetAllDonorsInApi()
          if (success) {
            await renderDonorsTable() // Re-render table (will now be empty)
            alert("সকল ডোনারের তালিকা রিসেট করা হয়েছে।")
          } else {
            alert("ডোনারের তালিকা রিসেট করতে ব্যর্থ হয়েছে।")
          }
        }
      })
    }

    /**
     * Renders the donor table with current data from the API.
     */
    const renderDonorsTable = async () => {
      const donors = await getDonorsFromApi()
      donorsTableBody.innerHTML = "" // Clear existing rows

      if (donors.length === 0) {
        noDonorsMessage.style.display = "block"
        donorsTableBody.closest("table").style.display = "none" // Hide table
      } else {
        noDonorsMessage.style.display = "none"
        donorsTableBody.closest("table").style.display = "table" // Show table
        donors.forEach((donor) => {
          const row = donorsTableBody.insertRow()
          row.innerHTML = `
                      <td>${donor.id}</td>
                      <td>${donor.name}</td>
                      <td>${donor.blood_group}</td>
                      <td>${donor.phone}</td>
                      <td>${donor.address}</td>
                      <td>${donor.donated_before}</td>
                      <td>${donor.isVerified ? "হ্যাঁ" : "না"}</td>
                      <td class="action-buttons">
                          <button class="button edit-button" data-id="${donor.id}">এডিট</button>
                          <button class="button delete-button" data-id="${donor.id}">ডিলিট</button>
                      </td>
                  `
        })
      }
    }

    /**
     * Handles adding a new donor or updating an existing one.
     */
    donorForm.addEventListener("submit", async (event) => {
      event.preventDefault()

      const formData = new FormData(donorForm)
      const donorData = {}
      for (const [key, value] of formData.entries()) {
        donorData[key] = value
      }

      // Get verification status from checkbox
      donorData.isVerified = isVerifiedCheckbox.checked

      const existingDonorId = donorForm.elements["donor-id"].value
      let success = false

      if (existingDonorId) {
        // Edit existing donor
        const updated = await updateDonorInApi(existingDonorId, donorData)
        if (updated) {
          success = true
          submitDonorButton.textContent = "ডোনার যোগ করুন" // Reset button text
          cancelEditButton.style.display = "none" // Hide cancel button
          donorForm.elements["donor-id"].value = "" // Clear hidden ID
        }
      } else {
        // Add new donor
        const added = await addDonorToApi(donorData)
        if (added) {
          success = true
        }
      }

      if (success) {
        await renderDonorsTable()
        donorForm.reset() // Clear form
        isVerifiedCheckbox.checked = false // Reset checkbox state
      } else {
        alert("ডোনার ডেটা সংরক্ষণ করতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।")
      }
    })

    /**
     * Handles Edit and Delete button clicks in the table.
     */
    donorsTableBody.addEventListener("click", async (event) => {
      if (event.target.classList.contains("edit-button")) {
        const donorIdToEdit = event.target.dataset.id
        const donors = await getDonorsFromApi() // Fetch latest data
        const donorToEdit = donors.find((donor) => donor.id === donorIdToEdit)

        if (donorToEdit) {
          // Populate form for editing
          donorForm.elements.name.value = donorToEdit.name
          donorForm.elements.blood_group.value = donorToEdit.blood_group
          donorForm.elements.phone.value = donorToEdit.phone
          donorForm.elements.address.value = donorToEdit.address
          document.getElementById(`donated-${donorToEdit.donated_before === "হ্যাঁ" ? "yes" : "no"}`).checked = true
          isVerifiedCheckbox.checked = donorToEdit.isVerified // Set verified checkbox

          donorForm.elements["donor-id"].value = donorToEdit.id // Set hidden ID for update
          submitDonorButton.textContent = "ডোনার আপডেট করুন" // Change button text
          cancelEditButton.style.display = "inline-block" // Show cancel button
          window.scrollTo({ top: 0, behavior: "smooth" }) // Scroll to top to show form
        }
      } else if (event.target.classList.contains("delete-button")) {
        const donorIdToDelete = event.target.dataset.id
        if (confirm("আপনি কি নিশ্চিত যে আপনি এই ডোনারকে ডিলিট করতে চান?")) {
          const success = await deleteDonorFromApi(donorIdToDelete)
          if (success) {
            await renderDonorsTable()
          } else {
            alert("ডোনার ডিলিট করতে ব্যর্থ হয়েছে।")
          }
        }
      }
    })

    /**
     * Handles canceling an edit operation.
     */
    if (cancelEditButton) {
      cancelEditButton.addEventListener("click", () => {
        donorForm.reset() // Clear form
        donorForm.elements["donor-id"].value = "" // Clear hidden ID
        submitDonorButton.textContent = "ডোনার যোগ করুন" // Reset button text
        cancelEditButton.style.display = "none" // Hide cancel button
        isVerifiedCheckbox.checked = false // Reset checkbox state
      })
    }

    // Initial render of the table when the page loads
    renderDonorsTable()
  }

  // --- Donor Search Page Logic (search.html) ---
  const searchForm = document.getElementById("donor-search-form")
  const searchResultsContainer = document.getElementById("search-results")
  const resetSearchFiltersButton = document.getElementById("reset-search-filters")

  if (searchForm && searchResultsContainer) {
    /**
     * Renders donor search results in a grid/card layout.
     * @param {Array} donors - The array of donor objects to display.
     */
    const renderSearchResults = (donors) => {
      searchResultsContainer.innerHTML = "" // Clear previous results

      if (donors.length === 0) {
        searchResultsContainer.innerHTML = '<p class="no-results">কোনো ডোনার খুঁজে পাওয়া যায়নি।</p>'
        return
      }

      donors.forEach((donor) => {
        const donorCard = document.createElement("div")
        donorCard.classList.add("donor-card")
        donorCard.innerHTML = `
                  <h4>${donor.name} <span class="blood-group-badge">${donor.blood_group}</span>
                  ${donor.isVerified ? '<span class="verified-badge"><i class="fas fa-check-circle"></i>ভেরিফাইড</span>' : ""}
                  </h4>
                  <p>ঠিকানা: ${donor.address}</p>
                  <p>পূর্বে রক্ত দিয়েছেন: ${donor.donated_before}</p>
                  <p>মোবাইল: <a href="tel:${donor.phone}" class="phone-link">${donor.phone}</a></p>
              `
        searchResultsContainer.appendChild(donorCard)
      })
    }

    /**
     * Filters donors based on search criteria and renders results.
     */
    const filterDonors = async () => {
      const allDonors = await getDonorsFromApi() // Fetch latest data
      const bloodGroup = document.getElementById("blood-group").value
      const district = document.getElementById("district").value.toLowerCase().trim()

      const filtered = allDonors.filter((donor) => {
        let matches = true

        if (bloodGroup && donor.blood_group !== bloodGroup) {
          matches = false
        }
        // Check if district/address input matches any part of the donor's address
        if (district && !donor.address.toLowerCase().includes(district)) {
          matches = false
        }

        return matches
      })
      renderSearchResults(filtered)
    }

    searchForm.addEventListener("submit", async (event) => {
      event.preventDefault()
      await filterDonors()
    })

    if (resetSearchFiltersButton) {
      resetSearchFiltersButton.addEventListener("click", async () => {
        searchForm.reset() // Clear form fields
        await filterDonors() // Re-render with no filters
      })
    }

    // Initial render of all donors on page load
    filterDonors()
  }
})
