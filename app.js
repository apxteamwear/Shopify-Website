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
  const team = p.teamName || "Not Applicable";
  const email = emailAddress || p.email || "akhtarhasan2005@gmail.com";
  const phone = p.phone || "Not Provided";
  const address = p.deliveryAddress || "Not Provided";
  const productCount = parseInt(p.productCount, 10);

  const jamesEmail = "james@apxteamwear.com";
  const craigEmail = "craig@apxteamwear.com";
  const jordanEmail = "jordan@apxteamwear.com";
  const managerEmail = salesManager === "James" ? jamesEmail :
                       salesManager === "Craig" ? craigEmail :
                       salesManager === "Jordan" ? jordanEmail :
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
  const clientSummary = `
👤 Your Name: ${name}
🏘️ Your Club Name: ${club}
🫂 Your Team Name/Coach: ${team}
📧 Your Email: ${email}
📞 Your Phone Number: ${phone}
📦 Your Delivery Address:
${address}

—

${orderSummary}

Attached is the spreadsheet for your order.
`;

  const file = generateOrderSpreadsheet(p, club, sizeQtyMaps);
  Utilities.sleep(1000);
  const excelBlob = exportSheetAsExcel(file.getId(), `Order - ${club} - ${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy")}`);
  const driveLink = `https://drive.google.com/file/d/${file.getId()}/view`;

  const companySummary = `
👤 Customer Name: ${name}
🏘️ Club Name: ${club}
🫂 Team Name/Coach: ${team}
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
          <img src="https://raw.githubusercontent.com/apxteamwear/Shopify-Website/main/img/APX-Landscape-Black.png" alt="APX Logo" style="max-width: 180px;">
        </div>
        <p>Dear Sales Rep,</p>
        <p>A new kit order has been submitted via the APX Teamwear web app. Below are the client details and order contents:</p>
        <pre style="background:#f9f9f9; padding:10px; border:1px solid #ccc;">${companySummary}</pre>
        <div style="margin-top: 40px; text-align: center;">
          <img src="https://raw.githubusercontent.com/apxteamwear/Shopify-Website/main/img/APX%20-%20Email%20Sig%2001.jpeg" alt="APX Signature" style="max-width: 400px;">
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
            <img src="https://raw.githubusercontent.com/apxteamwear/Shopify-Website/main/img/APX-Landscape-Black.png" alt="APX Logo" style="max-width: 180px;">
          </div>
          <p>Hi ${name} from ${club},</p>
          <p>We received your order. Here’s a summary:</p>
          <pre style="background:#f9f9f9; padding:10px; border:1px solid #ccc;">${clientSummary}</pre>
          <p>If you notice any issues, feel free to reach out to us directly.</p>
          <div style="margin-top: 40px; text-align: center;">
            <img src="https://raw.githubusercontent.com/apxteamwear/Shopify-Website/main/img/APX%20-%20Email%20Sig%2001.jpeg" alt="APX Signature" style="max-width: 400px;">
          </div>
        </div>
      `,
      attachments: [excelBlob]
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
  const teamName    = p.teamName || "";
  const address     = p.deliveryAddress || "Not Provided";

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
  sheet.getRange("M6").setValue(teamName);
  sheet.getRange("R3").setValue(address);

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
