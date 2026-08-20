# Nexora AI

## Run with Docker Compose

From the repository root, build and start the frontend, backend, and database:

```powershell
docker compose up --build
```

Open the website at [http://localhost:3000](http://localhost:3000).

The API is available at [http://localhost:8000](http://localhost:8000), with interactive documentation at [http://localhost:8000/docs](http://localhost:8000/docs).

Demo password-reset emails are captured by Mailpit at [http://localhost:8025](http://localhost:8025).

To stop and remove the running containers:

```powershell
docker compose down
```
