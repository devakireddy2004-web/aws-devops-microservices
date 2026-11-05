const http = require('http');

const serviceName = 'Order Service';
const endpoint = 'orders';
const records = [{"id":1001,"userId":1,"productId":101,"status":"PLACED"},{"id":1002,"userId":2,"productId":102,"status":"SHIPPED"}];

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.url === '/health') {
    res.writeHead(200);
    return res.end(JSON.stringify({ status: 'UP', service: serviceName }));
  }
  if (req.url === '/' || req.url === '/' + endpoint) {
    res.writeHead(200);
    return res.end(JSON.stringify({ service: serviceName, data: records }));
  }
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Route not found', service: serviceName }));
});

const port = process.env.PORT || 3000;
server.listen(port, '0.0.0.0', () => {
  console.log(`${serviceName} listening on port ${port}`);
});
