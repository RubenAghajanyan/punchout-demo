const express = require('express');
const bodyParser = require('body-parser');
const xml2js = require('xml2js');
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.text({ type: 'application/xml' }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

const sampleProducts = [
  { id: 'FAK-001', name: 'First Aid Kit', price: 29.99, category: 'firstaid' },
  { id: 'CLN-001', name: 'Cleaner Spray', price: 7.5, category: 'cleaning' },
  { id: 'SNP-001', name: 'Sanitary Wipes', price: 5.0, category: 'sanitary' }
];

let currentCart = [];

app.post('/punchout', (req, res) => {
  const xml = req.body;
  xml2js.parseString(xml, (err, result) => {
    const response = `
<?xml version="1.0"?>
<cXML version="1.2.014" payloadID="123456789" timestamp="${new Date().toISOString()}">
  <Response>
    <Status code="200" text="OK"/>
    <PunchOutSetupResponse>
      <StartPage>
        <URL>https://punchout-demo.onrender.com/shop</URL>
      </StartPage>
    </PunchOutSetupResponse>
  </Response>
</cXML>`;
    res.set('Content-Type', 'application/xml');
    res.send(response);
  });
});

app.get('/shop', (req, res) => {
  res.render('shop', { products: sampleProducts });
});

app.get('/shop/:category', (req, res) => {
  const category = req.params.category;
  const filteredProducts = sampleProducts.filter(p => p.category === category);
  res.render('shop', { products: filteredProducts });
});

app.get('/cart', (req, res) => {
  res.render('cart', { cart: currentCart });
});

app.get('/add-to-cart/:id', (req, res) => {
  const product = sampleProducts.find(p => p.id === req.params.id);
  if (product) currentCart.push(product);
  res.redirect('back');
});

app.post('/returnCart', (req, res) => {
  let itemsXml = currentCart.map(item => `
    <ItemIn quantity="1">
      <ItemID><SupplierPartID>${item.id}</SupplierPartID></ItemID>
      <ItemDetail>
        <UnitPrice><Money currency="EUR">${item.price}</Money></UnitPrice>
        <Description>${item.name}</Description>
        <UnitOfMeasure>EA</UnitOfMeasure>
      </ItemDetail>
    </ItemIn>`).join('');

  const cxml = `
  <cXML payloadID="return-${Date.now()}" timestamp="${new Date().toISOString()}">
    <Message>
      <PunchOutOrderMessage>
        ${itemsXml}
      </PunchOutOrderMessage>
    </Message>
  </cXML>`;

  res.send(`<html><body onload="document.forms[0].submit()">
    <form method="post" action="https://buyer-system.example.com/receive" target="_top">
      <input type="hidden" name="cxml-urlencoded" value='${cxml.replace(/'/g, '&apos;')}'>
    </form>
  </body></html>`);
});

app.listen(port, () => {
  console.log(`PunchOut server running at http://localhost:${port}`);
});
