## GitHub repo for 2 APX Web Apps that are deployed on the Shopify website:  

1. APX Order App
2. APX Sales Calculator 

---

### 🧾 Project Summary for APX Order App  

The APX Order App is a custom-built web tool designed to streamline kit ordering for clubs. 
It allows club representatives to select products, specify sizes and quantities, and submit personalized orders — 
all through a clean, mobile-friendly interface and notify sales managers of the order. 
The system automatically generates a branded confirmation email and a structured spreadsheet that’s ready for internal processing.  

Behind the scenes, the app pulls product data from a central CSV file saved on the Shopify website. 
This file includes product names, images, and unique product codes. 
When a user selects items, the app dynamically builds the order form, ensuring that junior and adult sizing is correctly applied, 
and that personalization fields (e.g. initials, names, numbers) are tailored to the product type.  

Once submitted, the order is routed to the correct sales manager, 
and a branded spreadsheet is generated with all quantities and personalisation details mapped to the correct columns — including product codes and sock size aliases. 
The club name is also passed through and used in the spreadsheet filename and email summary, ensuring clarity for internal teams.  

---

#### 🔧 Examples of Future Updates  

Here are two common updates your team might need to make — both designed to be simple and low-risk:  

**1. Replacing Product Data (e.g. via Shopify upload):**   
If the product range changes, you can export a new CSV from Excel and upload it to Shopify. 
Just make sure the file includes the same columns: `Product Name`, `Image URL`, and `Product Code`. 
Once uploaded, you need to copy the link from Shopify and then replace it in the JavaScript (main.js) like this:  

```javascript
const csvUrl = "https://cdn.shopify.com/s/files/1/0904/2057/6591/files/Product_Links_-_ProductData.csv?v=1756453833";
```  

No other changes are needed — the app will automatically use the new data.  

**2. Updating Branding or Email Routing:**  
If the APX logo or email signature changes, you can replace the image files on GitHub and the app will reflect them instantly as long as they have the same name.  

If sales reps change, you can update their email addresses in the Apps Script code (app.js) under:  

```javascript
const jamesEmail = "newemail@example.com";
const craigEmail = "anotheremail@example.com";
```  

Then upload that code to [Google Apps Script](https://script.google.com/home), 
deploy the app from there, copy the link and replace this line in sizes.html:  

```html
<form id="sizeForm" method="POST" action="https://script.google.com/macros/s/AKfycbxL5ehds4Emw4xAESZkWKszNCdFHDdnKLV-Id4POGgxMqdnlpMwufljbJXCSHprK5RNNw/exec" target="hidden_iframe" onsubmit="formSubmitted = true;">
```  

with this, for example (changing the action part only):  

```html
<form id="sizeForm" method="POST" action="https://script.google.com/macros/s/AKfycbwTkPEzQN8HoZJtwMip6n3FJbmJ_YGpz46WV4zKzG4sPzU3tCZUwnmGyUox64JsZBNhCQ/exec" target="hidden_iframe" onsubmit="formSubmitted = true;">
```  

---

### **Project Overview: APX Order Cost Calculator**

The APX Order Cost Calculator is a custom-built web tool designed to help sales managers quickly calculate product costs, 
revenue, and profit margins based on live pricing tiers and discounts. 
It’s built to be mobile-friendly, brand-aligned with APX’s visual identity, and intuitive for non-technical users.  

The calculator loads product data from a central CSV file hosted online, 
allowing the team to keep pricing up to date without needing to modify the code. 
Users can select products, enter quantities, apply discounts, and instantly see a breakdown of total cost, 
revenue, and profit margin — with colour-coded feedback to highlight profitability.  

The interface includes a dark/light mode toggle, responsive APX logos (portrait for mobile, landscape for desktop), 
and a product search filter that helps users find items quickly. 
All fonts and colours follow APX’s brand guidelines, ensuring consistency across platforms.  

---

#### 🔧 Maintaining the Calculator: What You Might Need to Update  

Here are two common updates your team might want to make:  

#### 1. **Replacing the CSV Product Data**  
If the product list or pricing changes, you can upload a new CSV file to Shopify. 
Once uploaded, copy the public link to the file and update the JavaScript line that loads the data:  

```javascript
const res = await fetch("https://your-new-link.com/path/to/APX-Price-List.csv");
```  

This line appears near the top of the script and controls where the calculator pulls its data from. 
No other changes are needed — the calculator will automatically re-parse the new file.  

#### 2. **Updating the Logo or Brand Assets**  
If APX updates its logo or branding, you can replace the image URLs in the HTML header. For example:  

```html
<img src="https://your-new-logo-link.com/logo.png" alt="APX Logo">
```  

The calculator uses a `<picture>` element to switch between portrait and landscape logos depending on screen size and theme. 
You can swap out the image links without touching the layout or logic.  
