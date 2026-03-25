from flask import Flask, request, jsonify
import requests
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # enable CORS for all routes

@app.route("/medgen")
def medgen():
    term = request.args.get("term")
    if not term:
        return jsonify({"error": "Missing term parameter"}), 400

    try:
        # Step 1: Search MedGen for the term
        search_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=medgen&term={term}&retmode=json"
        search_res = requests.get(search_url)
        search_data = search_res.json()

        idlist = search_data.get("esearchresult", {}).get("idlist", [])
        if not idlist:
            return jsonify({"message": "No MedGen records found"})

        # Step 2: Fetch summary for the first MedGen ID
        medgen_id = idlist[0]
        fetch_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=medgen&id={medgen_id}&retmode=json"
        fetch_res = requests.get(fetch_url)
        fetch_data = fetch_res.json()

        return jsonify(fetch_data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Run Flask on port 5000
    app.run(host="127.0.0.1", port=5000, debug=True)