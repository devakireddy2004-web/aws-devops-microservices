# AWS DevOps Microservices Starter

This is a beginner-friendly sample application for the AWS/DevOps assignment.
It contains three small Node.js microservices: User, Product, and Order.

## Run locally (Docker required)
1. Install Docker Desktop (Windows/macOS) or Docker Engine + Compose (Linux).
2. Open a terminal in this folder.
3. Run: `docker compose up --build -d`
4. Check: `docker compose ps`
5. Open these URLs:
   - http://localhost/users
   - http://localhost/products
   - http://localhost/orders
   - http://localhost/health
6. View logs: `docker compose logs -f`
7. Stop: `docker compose down`

## Routes
Nginx is the single entry point on port 8080:
- `/users` -> User Service
- `/products` -> Product Service
- `/orders` -> Order Service
- `/health` -> Nginx health response

Each service also has `/health`.

## Important
- This is sample source code because the assignment PDF does not include application source code.
- It is a demonstration application, not a production business application.
- Do not add AWS keys, passwords, private keys, or other secrets to Git.
- The assignment asks you to deploy existing services; it does not require feature development.
- Later stages will add Terraform, Jenkins, ECR, EC2 deployment, Prometheus and Grafana.
