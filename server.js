
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

const products = [
  { id: 1, name: 'Zinc Oxide Tape 1.25cm x 10m', price: 8.91, category: 'firstaid', image: 'https://martinservices.ie/wp-content/uploads/2021/11/613_relitape_contents_1-thegem-product-justified-portrait-m.jpg' },
  { id: 2, name: 'Z-Fold White 2 ply – Professional', price: 24.96, category: 'cleaning', image: 'https://martinservices.ie/wp-content/uploads/2021/09/h.9655132_2-thegem-product-justified-portrait-m.jpg' },
  { id: 3, name: 'White Roll Towel (200m x 6)', price: 62.78, category: 'sanitary', image: 'https://martinservices.ie/wp-content/uploads/2021/09/nw.51282_versatwin_2ply_toilet_tissue_125mx24_1_2-thegem-product-justified-portrait-m.jpg' }
];
// zf
let cart = [];

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
  res.render('shop', { products });
});

app.get('/shop/:category', (req, res) => {
  const category = req.params.category;
  const filtered = products.filter(p => p.category === category);
  res.render('shop', { products: filtered });
});

app.post('/cart', (req, res) => {
  const product = products.find(p => p.id == req.body.productId);
  const quantity = parseInt(req.body.quantity) || 1;
  if (product) cart.push({ ...product, quantity });
  res.redirect('/shop');
});

app.get('/cart', (req, res) => {
  res.render('cart', { cart });
});

app.post('/returnCart', (req, res) => {
  const punchOutOrderMessage = `<?xml version="1.0"?>
<cXML payloadID="return-${new Date().getTime()}" timestamp="${new Date().toISOString()}">
  <Message>
    <PunchOutOrderMessage>` +
    cart.map(item => `
      <ItemIn quantity="${item.quantity}">
        <ItemID><SupplierPartID>${item.id}</SupplierPartID></ItemID>
        <ItemDetail>
          <UnitPrice><Money currency="EUR">${item.price}</Money></UnitPrice>
          <Description xml:lang="en">${item.name}</Description>
          <UnitOfMeasure>EA</UnitOfMeasure>
        </ItemDetail>
      </ItemIn>`).join('') +
    `</PunchOutOrderMessage>
  </Message>
</cXML>`;

  res.send(`<html><body><form id="punchoutForm" method="post" action="https://webhook.site/a5136848-a203-42a7-a639-ff8ae2e3ff7b">
    <input type="hidden" name="cxml-urlencoded" value='${punchOutOrderMessage}' />
    </form><script>document.getElementById('punchoutForm').submit();</script></body></html>`);

  cart = [];
});

app.listen(port, () => console.log(`Server running on port ${port}`));
