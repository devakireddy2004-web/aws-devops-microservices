const http = require('http');

const serviceName = 'User Service';
const endpoint = 'users';
const records = [{"id":1,"name":"Asha"},{"id":2,"name":"Ravi"}];

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
