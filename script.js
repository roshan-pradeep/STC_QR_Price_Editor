/**
 * ====================================================
 * App Name: STC QR Price Editor
 * File: script.js
 * Description: Google Sheets (Apps Script API) සමඟ සම්බන්ධ වෙමින්
 *              Admin Panel එකේ දත්ත කළමනාකරණය සහ Staff View Page එක 
 *              ක්‍රියාත්මක කිරීම සඳහා වන JavaScript කේතය.
 * ====================================================
 */

// Google Apps Script එකෙන් ලැබුණු Web App URL එක මෙතනට දාන්න
const API_URL = "https://script.google.com/macros/s/AKfycbxQZ4VyNmOGvGCR8p-6tapP_pseXWklUdRhCb_qviuGLMkswrhrPfnYQEylsjU9cRHF3A/exec";

// Page එක Load වුණු ගමන් අදාළ ಪುಟයට අවශ්‍ය දත්ත ලබාගැනීම
document.addEventListener("DOMContentLoaded", function () {
    // Admin panel එකේ (index.html) නම් items ටික Table එකට ගෙන ඒම
    if (document.getElementById("items-table-body")) {
        fetchItems();
    }

    // Staff/Customer view page එකේ (view.html) නම් අදාළ item එකේ විස්තර ගෙන ඒම
    if (document.getElementById("view-name")) {
        fetchSingleItemDetails();
    }
});

/**
 * 1. සියලුම Items හෝ Search ප්‍රතිඵල Table එකට ගෙන ඒම (Admin Panel සඳහා)
 */
function fetchItems(searchQuery = "") {
    let url = `${API_URL}?action=get`;
    if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
    }

    fetch(url)
        .then(response => response.json())
        .then(data => {
            let tableBody = document.getElementById("items-table-body");
            tableBody.innerHTML = ""; // පරණ rows ඉවත් කිරීම

            // දත්ත කිසිවක් නැත්නම් දැනුම්දීමක් පෙන්වීම
            if (data.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-500">දත්ත හමු නොවීය.</td></tr>`;
                return;
            }

            // *** අලුතින් එකතු කළ ඩාටා උඩින්ම පෙන්වීම සඳහා array එක ආපසු හැරවීම (Reverse) ***
            data.reverse();

            // ලැබෙන දත්ත එකින් එක Table එකට ඇතුළත් කිරීම
            data.forEach(item => {
                let row = `
                    <tr class="border-b hover:bg-gray-50">
                        <td class="p-2 border">${item.id}</td>
                        <td class="p-2 border">${item.item_name}</td>
                        <td class="p-2 border">${item.model}</td>
                        <td class="p-2 border">Rs. ${parseFloat(item.price).toFixed(2)}</td>
                        <td class="p-2 border text-center space-x-2">
                            <button onclick="editItem('${item.id}', '${item.item_name}', '${item.model}', '${item.price}')" class="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600">Edit</button>
                            <button onclick="generateQRCode('${item.id}')" class="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700">QR Gen</button>
                        </td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
        })
        .catch(error => console.error("Error fetching items:", error));
}

/**
 * 2. Form එක Submit කළාම (අලුත් Item එකක් Save කිරීම හෝ පවතින එකක් Edit කිරීම)
 */
const itemForm = document.getElementById("item-form");
if (itemForm) {
    itemForm.addEventListener("submit", function (e) {
        e.preventDefault();

        let id = document.getElementById("item-id").value;
        let itemName = document.getElementById("item-name").value;
        let model = document.getElementById("item-model").value;
        let price = document.getElementById("item-price").value;

        let payload = {
            action: "save",
            id: id,
            item_name: itemName,
            model: model,
            price: price
        };

        // Save Button එක disable කරලා Saving... කියලා පෙන්වීම
        let saveBtn = document.getElementById("save-btn");
        saveBtn.innerText = "Saving...";
        saveBtn.disabled = true;

        // Google Apps Script API එකට POST request එකක් යැවීම
        fetch(API_URL, {
            method: "POST",
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(result => {
            if (result.status === "success") {
                alert("සාර්ථකව සුරකින ලදී!");
                
                // Form එක සම්පූර්ණයෙන්ම Reset කර ඉන්පුට් බොක්ස් හිස් කිරීම
                itemForm.reset();
                
                // Hidden ID field එක සම්පූර්ණයෙන්ම හිස් කිරීම (අතින් Edit මෝඩ් එකෙන් ඉවත් වීමට)
                document.getElementById("item-id").value = "";
                
                // Form Title එක සහ Button එක මුල් තත්ත්වයට පත් කිරීම
                document.getElementById("form-title").innerText = "අලුත් Item එකක් එකතු කරන්න";
                saveBtn.innerText = "Save & Generate QR";
                saveBtn.disabled = false;
                
                fetchItems(); // Table එක නැවත Refresh කිරීම
                generateQRCode(result.id); // Save වුණු වහාම අදාළ QR එක generate කර පෙන්වීම
            }
        })
        .catch(error => {
            console.error("Error saving item:", error);
            saveBtn.innerText = "Save & Generate QR";
            saveBtn.disabled = false;
        });
    });
}

/**
 * 3. Edit කිරීමට අවශ්‍ය දත්ත Form එකට ලබාගැනීම
 */
function editItem(id, name, model, price) {
    document.getElementById("item-id").value = id;
    document.getElementById("item-name").value = name;
    document.getElementById("item-model").value = model;
    document.getElementById("item-price").value = price;
    document.getElementById("form-title").innerText = `Item Edit කිරීම (ID: ${id})`;
    window.scrollTo({ top: 0, behavior: 'smooth' }); // පිටුව උඩට ගෙන යාම
}

/**
 * 4. QR Code එක Generate කර Screen එකේ පෙන්වීම (GitHub Pages ෆෝල්ඩර් පාත් එක සමඟ නිවැරදිව ක්‍රියාත්මක වේ)
 */
function generateQRCode(id) {
    let qrContainer = document.getElementById("qr-container");
    let qrcodeDiv = document.getElementById("qrcode");
    let qrLinkText = document.getElementById("qr-link-text");

    qrcodeDiv.innerHTML = ""; // මීට පෙර තිබූ QR එක clear කිරීම
    qrContainer.classList.remove("hidden"); // QR Box එක පෙන්වීම

    // GitHub Pages හෝ Live Server එකේ repository/folder නම සමඟ නිවැරදි URL එක සකස් කිරීම
    let path = window.location.pathname;
    let folderPath = path.substring(0, path.lastIndexOf('/'));
    let viewPageUrl = `${window.location.origin}${folderPath}/view.html?id=${id}`;

    // QRCode library එක පාවිච්චි කරලා QR එක ඇඳීම
    new QRCode(qrcodeDiv, {
        text: viewPageUrl,
        width: 150,
        height: 150
    });

    qrLinkText.innerText = viewPageUrl;
    qrContainer.scrollIntoView({ behavior: 'smooth' });
}

/**
 * 5. Search Bar එකේ Type කරද්දී Live Search වීම
 */
const searchBox = document.getElementById("search-box");
if (searchBox) {
    searchBox.addEventListener("input", function () {
        fetchItems(this.value);
    });
}

/**
 * 6. View Page එක සඳහා Google Sheet එකෙන් අදාළ Item එකේ විස්තර ගෙනැවිත් පෙන්වීම (`view.html` සඳහා)
 */
function fetchSingleItemDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');

    if (!itemId) return;

    fetch(`${API_URL}?action=get_single&id=${itemId}`)
        .then(response => response.json())
        .then(item => {
            if (item.error) {
                document.getElementById("details-box").innerHTML = `<p class="text-red-500 font-semibold">භාණ්ඩය හමු නොවීය!</p>`;
            } else {
                // Google Sheet එකෙන් ලැබුණු දත්ත view.html එකේ span වලට දැමීම
                document.getElementById("view-name").innerText = item.item_name;
                document.getElementById("view-model").innerText = item.model;
                document.getElementById("view-price").innerText = parseFloat(item.price).toFixed(2);
            }
        })
        .catch(error => {
            console.error("Error fetching single item:", error);
            document.getElementById("details-box").innerHTML = `<p class="text-red-500 font-semibold">දත්ත ලබාගැනීමේ දෝෂයක් සිදු විය.</p>`;
        });
}