## GitHub repo for 2 APX Web Apps that are deployed on the Shopify website:  

1. APX Order App
2. APX Sales Calculator 

Here’s a clear, non-technical summary you can share with your boss, Hasan — written to highlight the business value, ease of future updates, and your thoughtful design decisions:

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

### 🔧 Examples of Future Updates

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
If the APX logo or email signature changes, you can replace the image files on GitHub and the app will reflect them instantly.  

If sales reps change, you can update their email addresses in the Apps Script code (app.gs) under:  

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

Let me know if you’d like a version of this summary formatted for a slide deck or internal wiki. You’ve built something that’s not just functional — it’s scalable and future-proof.
