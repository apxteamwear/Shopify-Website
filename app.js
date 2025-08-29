function doGet(e) {
  const params = e.parameter;
  const customerName = params.name || "";
  const email = params.email || "";
  const phone = params.phone || "";
  const salesManager = params.salesManager || "";
  const selectedProducts = params.products ? params.products.split(",").map(p => decodeURIComponent(p.trim())) : [];

  Logger.log("📥 doGet parameters: " + JSON.stringify(params));
  Logger.log("📞 Contact number: " + phone);
  Logger.log("👤 Sales Manager: " + salesManager);
  Logger.log("🧾 Selected products: " + JSON.stringify(selectedProducts));

  if (selectedProducts.length === 0) {
    return HtmlService.createHtmlOutput(showInitialForm())
      .setTitle("Start Your Kit Order")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  return HtmlService.createHtmlOutput(showSizeForm(customerName, email, phone, selectedProducts, salesManager))
    .setTitle("Select Sizes & Quantities")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function showInitialForm() {
  const categories = {
    Tops: [
      "Match T-Shirt", "Match Shirt (Long Sleeve)", "Goalkeeper Shirt (Long Sleeve)",
      "Training T-Shirt", "Polo Shirt", "Leisure T-Shirt",
      "Crew Neck Training Sweatshirt", "1/4 Zip Sweatshirt", "Full Zip Tracksuit Top", "Zipped Hoodie"
    ],
    Bottoms: ["Match Shorts", "Training Shorts", "Leisure Shorts", "Track Pants"],
    Accessories: ["Training Glove", "Training Socks", "Match Socks", "Player Towel", "Club Backpack"]
  };

  const oneSizeItems = ["Player Towel", "Club Backpack"];

  let html = `
    <h2>Start Your Kit Order</h2>
    <form id="initialForm">
      <label>Name:</label><br><input type="text" name="name" required><br>
      <label>Email:</label><br><input type="email" name="email" required><br>

      <label>Sales Manager:</label><br>
      <select name="salesManager" required>
        <option value="">Choose 1</option>
        <option value="James">James</option>
        <option value="Craig">Craig</option>
      </select><br>
      <div style="color:red; font-size:0.9em; margin-bottom:10px;">
        This is your Sales rep from APX – either James or Craig
      </div>

      <label>Phone Number:</label><br>
      <input type="text" id="phone" name="phone" required><br>
      <div id="phoneError" style="color:red; font-weight:bold; display:none;">Please enter a valid phone number.</div><br>

      <label>Club Name:</label><br><input type="text" name="clubName"><br><br>
  `;

  for (const [category, products] of Object.entries(categories)) {
    html += `<h3>${category}</h3><table style="width:100%; border-collapse:collapse;">`;

    products.forEach(product => {
      const isSingleSize = oneSizeItems.includes(product);

      html += `<tr>`;
      if (isSingleSize) {
        html += `
          <td colspan="2">
            <label>
              <input type="checkbox" name="products" value="${product}">
              ${product} (One Size)
            </label>
          </td>
        `;
      } else {
        html += `
          <td style="padding:5px;">
            <label>
              <input type="checkbox" name="products" value="Junior ${product}">
              ${product} (Junior)
            </label>
          </td>
          <td style="padding:5px;">
            <label>
              <input type="checkbox" name="products" value="Adult ${product}">
              ${product} (Adult)
            </label>
          </td>
        `;
      }

      html += `</tr>`;
    });

    html += `</table><br>`;
  }

  html += `
      <button type="submit">Continue</button>
    </form>
    <script>
      document.getElementById('initialForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const phone = formData.get('phone');
        const regex = /^(?:\\+44\\s?7\\d{3}|\\(?07\\d{3}\\)?)\\s?\\d{3}\\s?\\d{3}$/;

        const phoneError = document.getElementById("phoneError");
        if (!regex.test(phone)) {
          phoneError.style.display = "block";
          return;
        } else {
          phoneError.style.display = "none";
        }

        const name = encodeURIComponent(formData.get('clubName'));
        const email = encodeURIComponent(formData.get('email'));
        const phoneEncoded = encodeURIComponent(phone);
        const salesManager = encodeURIComponent(formData.get('salesManager'));
        const selected = formData.getAll('products');
        if (selected.length === 0) {
          alert("Please select at least one product.");
          return;
        }
        const products = selected.map(p => encodeURIComponent(p)).join(',');
        const scriptUrl = 'https://script.google.com/macros/s/AKfycbxL5ehds4Emw4xAESZkWKszNCdFHDdnKLV-Id4POGgxMqdnlpMwufljbJXCSHprK5RNNw/exec';
        const redirectUrl = scriptUrl + '?name=' + name + '&email=' + email + '&phone=' + phoneEncoded + '&salesManager=' + salesManager + '&products=' + products;
        window.location.href = redirectUrl;
      });
    </script>
  `;

  return html;
}


function getProductDataMap() {
  const sheet = SpreadsheetApp.openById('1E7WxmHsE29Zxk-CMloE24p6F73EVuwbiB9gZxgFQcV0').getSheetByName('ProductData');
  const data = sheet.getDataRange().getValues();

  const map = {};
  for (let i = 1; i < data.length; i++) {
    const [name, imageUrl, sizes] = data[i];
    if (name) {
      map[name.trim()] = {
        image: imageUrl,
        sizes: (sizes || "").split(",").map(s => s.trim())
      };
    }
  }
  return map;
}

function showSizeForm(name, email, phone, products, salesManager) {
  const productMap = getProductDataMap();

  const normalizeProductName = n => {
    if (n.startsWith("Junior ")) return n.replace("Junior ", "") + " (Junior)";
    if (n.startsWith("Adult ")) return n.replace("Adult ", "") + " (Adult)";
    return n;
  };

  const personalisedItems = {
    nameAndNumber: [
      "Match T-Shirt", "Match Shirt (Long Sleeve)",
      "Goalkeeper Shirt (Long Sleeve)", "Training T-Shirt",
      "1/4 Zip Sweatshirt", "Zipped Hoodie"
    ],
    numberOnly: [
      "Track Pants", "Match Shorts"
    ]
  };

  const mappedProducts = products.map((original, i) => {
    const trueName = normalizeProductName(original);
    const data = productMap[trueName] || {};
    let sizes = (data.sizes || []).map(s => s.trim()).filter(s => s);
    if (sizes.length === 0) sizes = ["One Size"];
    return { originalLabel: original, trueName, index: i, sizes, image: data.image || "" };
  });

  let html = `<h2>Select Sizes & Quantities for ${name}</h2><form id="sizeForm">`;
  html += `<input type="hidden" name="name" value="${name}">`;
  html += `<input type="hidden" name="email" value="${email}">`;
  html += `<input type="hidden" name="phone" value="${phone}">`;
  html += `<input type="hidden" name="salesManager" value="${salesManager}">`;
  html += `<input type="hidden" name="productCount" value="${products.length}">`;

  mappedProducts.forEach(({ trueName, index, sizes, image }) => {
    const productId = `product_${index}`;
    const baseName = trueName.replace(/ \(Junior\)| \(Adult\)/, "");
    html += `<h3 style="margin-top:30px;">${trueName}</h3>`;
    html += `<input type="hidden" name="${productId}_name" value="${trueName}">`;

    html += `<table border="1" cellpadding="6" style="border-collapse:collapse; text-align:center; width:100%;"><thead>
      <tr>
        <th>${image ? `<img src="${image}" style="max-width:150px;">` : ""}</th>
        ${sizes.map(size => `<th>${size}</th>`).join("")}
      </tr>
    </thead><tbody>
      <tr>
        <td>Qty</td>
        ${sizes.map(size => `
          <td>
            <input type="number" name="${productId}_${size}" min="0" value="0" style="width:60px;"
              oninput="updatePersonalisation('${productId}', '${trueName}', '${size}', this.value)">
          </td>
        `).join("")}
      </tr>
    </tbody></table>`;

    if (personalisedItems.nameAndNumber.includes(baseName)) {
      html += `
        <h4 style="margin-top:10px;">Personalisation for ${trueName}</h4>
        <table border="1" cellpadding="6" style="border-collapse:collapse; width:100%; text-align:center;">
          <thead><tr><th>Name</th><th>Number</th><th>Size</th></tr></thead>
          <tbody id="${productId}_personalisationBody"></tbody>
        </table>`;
    } else if (personalisedItems.numberOnly.includes(baseName)) {
      html += `
        <h4 style="margin-top:10px;">Personalisation for ${trueName}</h4>
        <table border="1" cellpadding="6" style="border-collapse:collapse; width:100%; text-align:center;">
          <thead><tr><th>Number</th><th>Size</th></tr></thead>
          <tbody id="${productId}_personalisationBody"></tbody>
        </table>`;
    }
  });

  html += `
    <h3 style="margin-top:30px;">Delivery Address</h3>
    <textarea name="deliveryAddress" rows="4" cols="50" required placeholder="Enter full delivery address"></textarea>
    <br><br>
    <button type="submit">Submit Final Order</button>
  </form>
  <div id="responseMsg" style="margin-top:20px; font-weight:bold;"></div>
  
  <script>
    function updatePersonalisation(productId, trueName, size, count) {
      const baseName = trueName.replace(/ \\(Junior\\)| \\(Adult\\)/, "");
      const tbody = document.getElementById(productId + '_personalisationBody');
      if (!tbody) return;
      const currentRows = tbody.querySelectorAll('tr[data-size="' + size + '"]');

      count = parseInt(count);
      if (!count || count <= 0) {
        currentRows.forEach(row => row.remove());
        return;
      }

      const diff = count - currentRows.length;

      for (let i = currentRows.length; i < count; i++) {
        const tr = document.createElement('tr');
        tr.setAttribute('data-size', size);

        if (${JSON.stringify(personalisedItems.nameAndNumber)}.includes(baseName)) {
          tr.innerHTML += '<td><input type="text" name="' + productId + '_name_' + size + '_' + i + '" placeholder="Optional"></td>';
          tr.innerHTML += '<td><input type="text" name="' + productId + '_number_' + size + '_' + i + '" placeholder="Optional"></td>';
        } else if (${JSON.stringify(personalisedItems.numberOnly)}.includes(baseName)) {
          tr.innerHTML += '<td><input type="text" name="' + productId + '_number_' + size + '_' + i + '" placeholder="Optional"></td>';
        }

        tr.innerHTML += '<td><input type="hidden" name="' + productId + '_size_' + size + '_' + i + '" value="' + size + '">' + size + '</td>';
        tbody.appendChild(tr);
      }

      for (let i = currentRows.length - 1; i >= count; i--) {
        currentRows[i].remove();
      }
    }

    document.getElementById('sizeForm').addEventListener('submit', function(e) {
      e.preventDefault();
      const data = new FormData(this);
      google.script.run
        .withSuccessHandler(function(msg) {
          document.body.innerHTML = msg;
        })
        .withFailureHandler(function(error) {
          document.getElementById('responseMsg').innerText = "❌ Submission failed.";
          console.error(error);
        })
        .handleFormSubmission(Object.fromEntries(data.entries()), "${email}");
    });
  </script>
  `;

  return html;
}

function handleFormSubmission(params, emailAddress) {
  const productMap = getProductDataMap();
  const salesManager = params.salesManager || "";
  return doPost({ parameter: params }, emailAddress, productMap, salesManager);
}

function doPost(e) {
  const data = e.parameter;
  const emailAddress = data.email || "default@example.com";
  const productMap = getProductDataMap();
  const salesManager = data.salesManager || "";

  const html = doPostInternal({ parameter: data }, emailAddress, productMap, salesManager);
  return ContentService.createTextOutput(html).setMimeType(ContentService.MimeType.HTML);
}

function doPostInternal(e, emailAddress, productMap, salesManager) {
  const p = e.parameter;
  const name = p.name || "Customer";
  const club = p.clubName || "Club";
  const email = emailAddress || p.email || "akhtarhasan2005@gmail.com";
  const phone = p.phone || "Not Provided";
  const address = p.deliveryAddress || "Not Provided";
  const productCount = parseInt(p.productCount, 10);

  const jamesEmail = "james@apxteamwear.com";
  const craigEmail = "craig@apxteamwear.com";
  const managerEmail = salesManager === "James" ? jamesEmail :
                       salesManager === "Craig" ? craigEmail :
                       "sales@apxteamwear.com";

  Logger.log(`📬 Processing order for ${club} (${email}), Products: ${productCount}`);
  Logger.log(`📧 Routing to Sales Manager: ${salesManager} → ${managerEmail}`);

  let orderSummary = `🛍️ Order Summary for ${club}\n\n`;
  const sizeQtyMaps = [];

  for (let i = 0; i < productCount; i++) {
    const base = `product_${i}`;
    const productName = p[`${base}_name`];
    const productCode = p[`${base}_code`] || "";
    if (!productName) continue;

    Logger.log(`🧾 Product: ${productName}, Code: ${productCode}`);
    orderSummary += `🔹 ${productName}\n`;

    const validSizes = productMap[productName]?.sizes || [];
    const sizeQtyMap = {};

    Object.keys(p).forEach(key => {
      if (key.startsWith(`${base}_`) &&
          !key.includes('_name_') &&
          !key.includes('_number_') &&
          !key.includes('_initials_') &&
          !key.includes('_size_') &&
          !key.includes('_code')) {
        const size = key.replace(`${base}_`, '');
        const qty = parseInt(p[key], 10);
        if (qty > 0) {
          const label = validSizes.includes(size) ? size : size;
          sizeQtyMap[label] = (sizeQtyMap[label] || 0) + qty;
        }
      }
    });
    sizeQtyMaps.push(sizeQtyMap);

    for (const size in sizeQtyMap) {
      const qty = sizeQtyMap[size];
      orderSummary += `  • Size: ${size}, Qty: ${qty}\n`;

      for (let r = 0; r < qty; r++) {
        const initialsField = p[`${base}_initials_${size}_${r}`];
        const nameField     = p[`${base}_name_${size}_${r}`];
        const numberField   = p[`${base}_number_${size}_${r}`];

        const hasInitials = initialsField && initialsField.trim();
        const hasName     = nameField && nameField.trim();
        const hasNumber   = numberField && numberField.trim();

        if (hasInitials || hasName || hasNumber) {
          orderSummary += `    ↳ Personalised ${size} [#${r + 1}]: `;
          if (hasInitials) orderSummary += `Initials: ${initialsField} `;
          if (hasName)     orderSummary += `Name: ${nameField} `;
          if (hasNumber)   orderSummary += `Number: ${numberField}`;
          orderSummary += `\n`;
        }
      }
    }

    orderSummary += `\n`;
  }

  Logger.log("📦 Final Order Summary:\n" + orderSummary);
  const clientSummary = orderSummary;

  const file = generateOrderSpreadsheet(p, club, sizeQtyMaps);
  Utilities.sleep(1000);
  const excelBlob = exportSheetAsExcel(file.getId(), `Order - ${club} - ${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy")}`);
  const driveLink = `https://drive.google.com/file/d/${file.getId()}/view`;

  const companySummary = `
    👤 Customer Name: ${name}
    🏘️ Club Name: ${club}
    📧 Email: ${email}
    📞 Phone: ${phone}
    📦 Delivery Address:
    ${address}

    —

    ${orderSummary}

    🔗 Google Sheets Link to Edit Spreadsheet in browser:
    ${driveLink}
    `;

  MailApp.sendEmail({
    to: managerEmail,
    subject: `New Kit Order from ${club}`,
    htmlBody: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="text-align: right;">
          <img src="https://raw.githubusercontent.com/AkhHas2005/APX/main/img/APX-Landscape-Black.png" alt="APX Logo" style="max-width: 180px;">
        </div>
        <p>Dear Sales Rep,</p>
        <p>A new kit order has been submitted via the APX Teamwear web app. Below are the client details and order contents:</p>
        <pre style="background:#f9f9f9; padding:10px; border:1px solid #ccc;">${companySummary}</pre>
        <div style="margin-top: 40px; text-align: center;">
          <img src="https://raw.githubusercontent.com/AkhHas2005/APX/main/img/APX%20-%20Email%20Sig%2001.jpeg" alt="APX Signature" style="max-width: 400px;">
        </div>
      </div>
    `,
    attachments: [excelBlob]
  });

  if (email.includes("@")) {
    MailApp.sendEmail({
      to: email,
      subject: `Your Kit Order Confirmation`,
      htmlBody: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <div style="text-align: right;">
            <img src="https://raw.githubusercontent.com/AkhHas2005/APX/main/img/APX-Landscape-Black.png" alt="APX Logo" style="max-width: 180px;">
          </div>
          <p>Hi ${name} from ${club},</p>
          <p>We received your order. Here’s a summary:</p>
          <pre style="background:#f9f9f9; padding:10px; border:1px solid #ccc;">${clientSummary}</pre>
          <p>If you notice any issues, feel free to reach out to us directly.</p>
          <div style="margin-top: 40px; text-align: center;">
            <img src="https://raw.githubusercontent.com/AkhHas2005/APX/main/img/APX%20-%20Email%20Sig%2001.jpeg" alt="APX Signature" style="max-width: 400px;">
          </div>
        </div>
      `
    });
  }

  return `<h2 style="color: green; text-align: center; margin-top: 50px;">
    ✅ Your order is confirmed!<br>
    A confirmation email has been sent to <strong>${email}</strong>.<br>
    If you notice any issues, feel free to reach out to us directly.
  </h2>`;
}



function exportSheetAsExcel(fileId, fileName) {
  const url = `https://docs.google.com/feeds/download/spreadsheets/Export?key=${fileId}&exportFormat=xlsx`;
  const token = ScriptApp.getOAuthToken();
  const response = UrlFetchApp.fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.getBlob().setName(`${fileName}.xlsx`);
}

/**
 * p             – the form parameters (e.parameter)
 * name          – the customer/club name for the filename & template
 * sizeQtyMaps   – an array where each index i is a map of { sizeLabel: quantity } for product_i
 */
function generateOrderSpreadsheet(p, name, sizeQtyMaps) {
  const TEMPLATE_ID = '1XSD8U61u4loh6j-ulQGMsaJ6EiT95zDR0X4_liHXbhQ';
  const FOLDER_ID   = '1QKzgRa9MbTUEX0CFhkl8vKfSz-vAwE-E';
  const clubName    = name || "Club";

  const template = SpreadsheetApp.openById(TEMPLATE_ID);
  const copy     = template.copy(`Order – ${clubName} – ${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy")}`);
  const sheet    = copy.getSheetByName('Sheet1');
  if (FOLDER_ID) {
    DriveApp.getFolderById(FOLDER_ID).addFile(DriveApp.getFileById(copy.getId()));
  }

  sheet.getRange("G2").setValue(Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy"));
  sheet.getRange("G3").setValue(Utilities.formatDate(new Date(Date.now() + 28*24*60*60*1000), Session.getScriptTimeZone(), "dd/MM/yyyy"));
  sheet.getRange("E5").setValue(clubName);
  sheet.getRange("L5").setValue("NEW");

  const sizeColumns = {
    "YXXS": 10, "YXS": 11, "YS": 12, "YM": 13, "YL": 14,
    "XS": 15,   "S": 16,   "M": 17,  "L": 18,   "XL": 19,
    "2XL": 20,  "3XL": 21, "4XL": 22, "5XL": 23, "6XL": 24,

    // Sock size aliases
    "12-3 (S)": 16,
    "4-6 (M)": 17,
    "7-11 (L)": 18,
    "12-14 (XL)": 19
  };

  const productsToWrite = [];
  for (let i = 0; i < sizeQtyMaps.length; i++) {
    const map = sizeQtyMaps[i] || {};
    if (Object.values(map).some(q => q > 0)) {
      productsToWrite.push(i);
    }
  }

  const maxTemplateRows = 7;
  const overflow = Math.max(0, productsToWrite.length - maxTemplateRows);
  if (overflow) {
    sheet.insertRowsAfter(16, overflow);
    const templateRow = sheet.getRange(16, 1, 1, sheet.getMaxColumns());
    for (let r = 0; r < overflow; r++) {
      templateRow.copyTo(sheet.getRange(17 + r, 1), SpreadsheetApp.CopyPasteType.PASTE_FORMAT);
    }
  }

  let writeRow = 10;
  const personalisationRows = [];

  productsToWrite.forEach(i => {
    const base        = `product_${i}`;
    const productName = p[`${base}_name`];
    const productCode = p[`${base}_code`] || "";
    if (!productName) return;

    sheet.getRange(writeRow, 1).setValue(productName);
    sheet.getRange(writeRow, 6).setValue(productCode);

    const sizeMap = sizeQtyMaps[i];
    Object.entries(sizeMap).forEach(([size, qty]) => {
      if (qty <= 0) return;
      const col = sizeColumns[size] || 26;
      const cell = sheet.getRange(writeRow, col);
      cell.setValue((cell.getValue() || 0) + qty);

      for (let r = 0; r < qty; r++) {
        const initialsField = p[`${base}_initials_${size}_${r}`]?.trim();
        const nameField     = p[`${base}_name_${size}_${r}`]?.trim();
        const numberField   = p[`${base}_number_${size}_${r}`]?.trim();

        const labelParts = [];
        if (initialsField) labelParts.push(initialsField);
        if (nameField)     labelParts.push(nameField);
        if (numberField)   labelParts.push(numberField);

        if (labelParts.length > 0) {
          personalisationRows.push({
            garment: productName,
            label: labelParts.join(" / "),
            position: "CENTER",
            size: size
          });
        }
      }
    });

    writeRow++;
  });

  const basePersonalisationStart = 19;
  const safeSpacer               = 2;
  const startRow                 = Math.max(writeRow + safeSpacer, basePersonalisationStart);
  const maxPersonalRows          = 10;
  const overflowP = Math.max(0, personalisationRows.length - maxPersonalRows);
  if (overflowP) {
    sheet.insertRowsAfter(28, overflowP);
    const templateRow = sheet.getRange(28, 1, 1, sheet.getMaxColumns());
    for (let r = 0; r < overflowP; r++) {
      templateRow.copyTo(sheet.getRange(29 + r, 1), SpreadsheetApp.CopyPasteType.PASTE_FORMAT);
    }
  }

  let pRow = startRow;
  personalisationRows.forEach(({ garment, label, position, size }) => {
    sheet.getRange(pRow, 1).setValue(garment);
    sheet.getRange(pRow, 4).setValue(label);
    sheet.getRange(pRow, 5).setValue(position);
    sheet.getRange(pRow, 8).setValue(size);
    pRow++;
  });

  SpreadsheetApp.flush();
  Logger.log(`📄 Spreadsheet filled for ${clubName}: ${productsToWrite.length} items, ${personalisationRows.length} personalisations`);
  return DriveApp.getFileById(copy.getId());
}
