function saveFavorite(name) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  if (!favorites.includes(name)) {
    favorites.push(name);
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }

  displayFavorites();
}
const symptomMap = {
  "covid 19": "Fever, cough, loss of taste/smell, shortness of breath, fatigue, headache, sore throat",
  "hepatitis": "Fatigue, jaundice (yellow skin/eyes), abdominal pain, nausea, dark urine, pale stool",
  "immunodeficiency": "Frequent infections, digestive issues, delayed growth, autoimmune disorders",
  "flu": "Fever, chills, muscle aches, cough, sore throat, runny nose, fatigue",
  "diabetes": "Frequent urination, increased thirst, unexplained weight loss, fatigue, blurred vision"
};
const aboutElements = document.querySelectorAll('#about h3, #about p');

const observer = new IntersectionObserver(entries => { //- IntersectionObserver is a browser API that watches when elements enter or leave the viewport

  entries.forEach(entry => { // loops through each observed element.
    if (entry.isIntersecting) {
      entry.target.classList.add('show');
    }
  });
}, { threshold: 0.2 }); //this threshold i a variable. it can be changed. it means that when at least 20% of the text is visible the functiopn applies

aboutElements.forEach(element => observer.observe(element));


// ===================== GENE DATA =====================
let geneData = {
  fetchGeneData: function (geneName) {
    fetch(`https://rest.ensembl.org/lookup/symbol/homo_sapiens/${geneName}?content-type=application/json`)
      .then(response => response.json())
      .then(data => {
        console.log(data);
        this.displayData(data);
      })
      .catch(error => console.error("Error fetching gene data:", error));
  },

  displayData: function (data) {
    const container = document.getElementById("gene-info");
    if (!container) return; // ✅ important fix

    container.innerHTML = "";

    const name = document.createElement("h3");
    name.textContent = data.display_name || "N/A";

    const desc = document.createElement("p");
    desc.textContent = data.description || "No description";

    const list = document.createElement("ul");

    const createItem = (label, value) => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${label}:</strong> ${value ?? "N/A"}`;
      return li;
    };

    list.appendChild(createItem("Stable ID", data.id));
    list.appendChild(createItem("Chromosome", data.seq_region_name));
    list.appendChild(createItem("Species", data.species));
    list.appendChild(createItem("Location", `${data.start} - ${data.end}`));
    list.appendChild(createItem("Length", data.end && data.start ? data.end - data.start : "N/A"));
    list.appendChild(createItem("Strand", data.strand));
    list.appendChild(createItem("Gene Source", data.source));
    list.appendChild(createItem("db Type", data.db_type));

    container.appendChild(name);
    container.appendChild(desc);
    container.appendChild(list);
  }
};

// ===================== GENE EVENT =====================
const geneInput = document.getElementById("gene-input");
const geneBtn = document.getElementById("searchBtn");

if (geneBtn && geneInput) {
  geneBtn.addEventListener("click", () => {
    const geneName = geneInput.value.trim();
    if (geneName) {
      geneData.fetchGeneData(geneName);
    }
  });
}


// ===================== DISEASE DATA =====================
let diseaseData = {
  fetchDiseaseStats: function (country) {
    const container = document.getElementById("disease-info");
    if (!container) return;

    fetch(`https://disease.sh/v3/covid-19/countries/${country}`)
      .then(response => response.json())
      .then(data => {
        const stats = document.createElement("p");
        stats.textContent = `Cases: ${data.cases}, Deaths: ${data.deaths}, Recovered: ${data.recovered}`;
        container.appendChild(stats);
      })
      .catch(error => console.log("Error fetching stats", error));
  },

  fetchDiseaseInfo: function (diseaseName) {
    const container = document.getElementById("disease-info");
    if (!container) return;

    fetch(`http://127.0.0.1:5000/medgen?term=${diseaseName}`)
      .then(response => response.json())
      .then(data => {
        container.innerHTML = "";

        const uids = data.result?.uids || [];

        uids.forEach(uid => {
          const disease = data.result[uid];

          const title = disease.title || "Unknown disease";
          const conceptId = disease.conceptid || "N/A";
          const semanticType = disease.semantictype?.value || "N/A";

          let synonyms = "None";
          let definition = "No definition available";
          let identifiers = "None";

          if (disease.conceptmeta) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(disease.conceptmeta, "text/xml");

            const nameNodes = xmlDoc.getElementsByTagName("Name");
            if (nameNodes.length > 0) {
              synonyms = Array.from(nameNodes).map(n => n.textContent).join(", ");
            }

            const defNodes = xmlDoc.getElementsByTagName("Definitions");
            if (defNodes.length > 0) {
              definition = defNodes[0].textContent || definition;
            }

            const snomedNodes = xmlDoc.getElementsByTagName("SNOMEDCT");
            if (snomedNodes.length > 0) {
              identifiers = snomedNodes[0].textContent || identifiers;
            }
          }

          //           const card = document.createElement("div");
          //           card.className = "protein-card";
          //           card.innerHTML = `
          //   <h2>${name}</h2>
          //   <p><strong>Function:</strong> ${functionText}</p>
          //   <p><strong>Location:</strong> ${locationText}</p>
          //   <p><strong>Sequence:</strong> <span style="font-family: monospace;">${sequence}</span></p>
          //   <button class="save-btn">⭐ Save to Favorites</button>
          // `;

          //           card.querySelector(".save-btn").addEventListener("click", () => {
          //             saveFavorite("protein", name);
          //           });

          //           container.appendChild(card);
        });
      })
      .catch(error => console.error("Error fetching disease info:", error));
  }
};

// ===================== DISEASE EVENT =====================
const diseaseBtn = document.getElementById("disease-search-btn");
const diseaseInput = document.getElementById("disease-input");

if (diseaseBtn && diseaseInput) {
  diseaseBtn.addEventListener("click", () => {
    const diseaseName = diseaseInput.value.trim();
    const container = document.getElementById("disease-info");

    if (!container) return;

    container.innerHTML = "";

    if (diseaseName) {
      diseaseData.fetchDiseaseInfo(diseaseName);
      diseaseData.fetchDiseaseStats("Lebanon");
    } else {
      container.innerHTML = "<p>Please enter a disease name.</p>";
    }
  });
}


// ===================== PROTEIN DATA =====================
let proteinData = {
  fetchProteinData: function (proteinName) {
    const container = document.getElementById("protein-info");
    if (!container) return;

    fetch(`https://rest.uniprot.org/uniprotkb/search?query=${proteinName}+AND+organism_id:9606&format=json&size=1`)
      .then(res => res.json())
      .then(data => {
        container.innerHTML = "";

        if (!data.results || data.results.length === 0) {
          container.innerHTML = "<p>No protein found</p>";
          return;
        }

        const entry = data.results[0];

        const name =
          entry.proteinDescription?.recommendedName?.fullName?.value ||
          "Unknown protein";

        let functionText = "No function available";
        const func = entry.comments?.find(c => c.commentType === "FUNCTION");
        if (func?.texts?.length > 0) {
          functionText = func.texts.map(t => t.value).join(" ");
        }

        let locationText = "No location available";
        const loc = entry.comments?.find(c => c.commentType === "SUBCELLULAR LOCATION");
        if (loc?.subcellularLocations) {
          locationText = loc.subcellularLocations
            .map(l => l.location?.value)
            .filter(Boolean)
            .join(", ");
        }

        const sequence = entry.sequence?.value || "No sequence";

        const card = document.createElement("div");
        card.className = "protein-card";
        card.innerHTML = `
  <h2>${name}</h2>
  <p><strong>Function:</strong> ${functionText}</p>
  <p><strong>Location:</strong> ${locationText}</p>
  <p><strong>Sequence:</strong> <span style="font-family: monospace;">${sequence}</span></p>
  <button class="save-btn">⭐ Save to Favorites</button>
`;

        card.querySelector(".save-btn").addEventListener("click", () => {
          saveFavorite(name);
        });

        container.appendChild(card);
      })
      .catch(err => {
        console.error("Error:", err);
        container.innerHTML = "<p>Failed to load protein data</p>";
      });
  }
};

// ===================== PROTEIN EVENTS =====================
document.addEventListener("DOMContentLoaded", () => {
  const proteinBtn = document.getElementById("protein-search-btn");
  const proteinInput = document.getElementById("protein-input");

  if (proteinBtn && proteinInput) {
    proteinBtn.addEventListener("click", () => {
      const proteinName = proteinInput.value.trim();
      if (proteinName) {
        proteinData.fetchProteinData(proteinName);
      }
    });
  }

  const proteinSearchBar = document.querySelector(".protein-search-bar");

  if (proteinSearchBar) {
    proteinSearchBar.addEventListener("keyup", (event) => {
      if (event.key === "Enter") {
        const proteinName = proteinSearchBar.value.trim();
        if (proteinName) {
          proteinData.fetchProteinData(proteinName);
        }
      }
    });
  }
});

const geneSearchBar = document.querySelector(".gene-search-bar");
geneSearchBar.addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
    const geneName = geneSearchBar.value.trim();
    if (geneName) {
      geneData.fetchGeneData(geneName);
    }
  }
});

const proteinSearchBar = document.querySelector(".protein-search-bar");
proteinSearchBar.addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
    const proteinName = proteinSearchBar.value.trim();
    if (proteinName) {
      proteinData.fetchProteinData(proteinName);
    }
  }
});

const diseaseSearchBar = document.querySelector(".disease-search-bar");
diseaseSearchBar.addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
    const diseaseName = diseaseSearchBar.value.trim();
    if (diseaseName) {
      diseaseData.fetchDiseaseInfo(diseaseName);
    }
  }
});
function displayFavorites() {
  let container = document.getElementById("favorites-list");
  if (!container) return;

  // 🔥 ALWAYS read fresh data
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  container.innerHTML = "";

  favorites.forEach((item, index) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <span>${item}</span>
      <button onclick="removeFavorite(${index})">❌</button>
    `;
    container.appendChild(div);
  });
}
document.addEventListener("DOMContentLoaded", () => {
  displayFavorites();
});
function removeFavorite(index) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  favorites.splice(index, 1);
  localStorage.setItem("favorites", JSON.stringify(favorites));

  displayFavorites();
}

