# DeviceDock VPS deployment

This deployment keeps source code and Dockerfiles off the VPS. Images are
built locally, pushed to Docker Hub, and pulled by Docker Compose on the VPS.

## Production endpoints

- Frontend: `https://devicedock.duckdns.org`
- Backend: `https://backenddock.duckdns.org/api/v1`
- Docker Hub namespace: `mamunhossain1281`

The deployment uses three images from the same repository source:

- `mamunhossain1281/devicedock-frontend:latest`
- `mamunhossain1281/devicedock-backend:latest`
- `mamunhossain1281/devicedock-migrate:latest`

The migration image is intentionally separate. The backend runtime image only
contains compiled production files and cannot run Prisma CLI migrations.

## 1. Prepare Docker Hub

Create these three Docker Hub repositories, preferably as private repositories:

```text
devicedock-frontend
devicedock-backend
devicedock-migrate
```

Create a Docker Hub personal access token with Read & Write access for the
local machine. Create a separate Read-only token for the VPS.

## 2. Build and push images locally

Run from the repository root. Confirm that the VPS is `amd64`; otherwise change
the platform in all three commands.

```bash
docker login -u mamunhossain1281

docker buildx build \
  --platform linux/amd64 \
  --pull \
  --no-cache \
  --target runtime \
  --build-arg NEXT_PUBLIC_API_URL=https://backenddock.duckdns.org/api/v1 \
  --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_or_test_publishable_key \
  -t mamunhossain1281/devicedock-frontend:latest \
  --load \
  ./frontend

docker buildx build \
  --platform linux/amd64 \
  --pull \
  --no-cache \
  --target runtime \
  -t mamunhossain1281/devicedock-backend:latest \
  --load \
  ./backend

docker buildx build \
  --platform linux/amd64 \
  --pull \
  --no-cache \
  --target migration \
  -t mamunhossain1281/devicedock-migrate:latest \
  --load \
  ./backend

docker push mamunhossain1281/devicedock-frontend:latest
docker push mamunhossain1281/devicedock-backend:latest
docker push mamunhossain1281/devicedock-migrate:latest
```

`NEXT_PUBLIC_*` values are public and baked into the frontend image. Runtime
secrets must never be passed as build arguments.

## 3. Check DNS before touching Nginx

Both DuckDNS records must resolve to the VPS public IPv4 address:

```bash
dig +short devicedock.duckdns.org A
dig +short backenddock.duckdns.org A
```

Do not request certificates until both commands return the VPS IP.

## 4. Install Docker Engine on Ubuntu

Run these commands as `root` on the VPS. If Docker is already installed, verify
it first and skip this section.

```bash
docker --version
docker compose version
```

Install Docker from Docker's official apt repository:

```bash
apt update
apt install -y ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

tee /etc/apt/sources.list.d/docker.sources > /dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker
docker run --rm hello-world
```

## 5. Install Nginx and configure the firewall

Check for existing listeners first because the VPS may already host other apps:

```bash
ss -lntp | grep -E ':(80|443|3000|8080)\b' || true
nginx -v || true
```

Install Nginx and UFW, allow SSH before enabling the firewall, then allow only
web traffic publicly:

```bash
apt update
apt install -y nginx ufw
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status verbose
systemctl enable --now nginx
```

Application ports are bound to `127.0.0.1`, so Docker does not publish them on
the public interface. Redis and RabbitMQ have no host port mappings.

## 6. Create the protected VPS layout

Run on the VPS:

```bash
install -d -m 700 /opt/devicedock
install -d -m 700 /opt/devicedock/frontend
install -d -m 700 /opt/devicedock/backend
```

From the local repository root, replace `VPS_IP` and copy only deployment
files—no source code or Dockerfiles:

```bash
scp compose.production.yaml root@VPS_IP:/opt/devicedock/compose.production.yaml
scp .env.example root@VPS_IP:/opt/devicedock/.env
scp frontend/frontend.env.example root@VPS_IP:/opt/devicedock/frontend/frontend.env
scp backend/backend.env.example root@VPS_IP:/opt/devicedock/backend/backend.env
scp deploy/nginx/devicedock.conf root@VPS_IP:/etc/nginx/sites-available/devicedock
```

Back on the VPS, protect and edit the environment files:

```bash
chmod 600 /opt/devicedock/.env
chmod 600 /opt/devicedock/frontend/frontend.env
chmod 600 /opt/devicedock/backend/backend.env

nano /opt/devicedock/.env
nano /opt/devicedock/frontend/frontend.env
nano /opt/devicedock/backend/backend.env
```

Generate independent secrets when filling the files:

```bash
openssl rand -hex 32
openssl rand -base64 36
```

Use the hexadecimal output for the RabbitMQ password so it is safe inside the
AMQP URL assembled by Compose. If a database password contains reserved URL
characters, URL-encode it in `DATABASE_URL`.

Never reuse the JWT secret, NextAuth secret, RabbitMQ password, Google client
secret, Gmail App Password, Stripe secret, or database password.

## 7. Required external dashboard configuration

Google OAuth web client:

```text
Authorized JavaScript origin:
https://devicedock.duckdns.org

Authorized redirect URI:
https://devicedock.duckdns.org/api/auth/callback/google
```

Stripe webhook endpoint:

```text
https://backenddock.duckdns.org/api/v1/payments/webhooks/stripe
```

Copy the endpoint's production `whsec_...` value into
`backend/backend.env`. Use the same Google client ID in frontend and backend.

For Gmail SMTP, enable Google 2-Step Verification and put a generated App
Password—not the normal Gmail password—in `SMTP_PASSWORD`.

## 8. Configure Nginx over HTTP

Enable the copied site without removing unrelated existing sites:

```bash
ln -s /etc/nginx/sites-available/devicedock /etc/nginx/sites-enabled/devicedock
nginx -t
systemctl reload nginx
```

If Nginx reports a duplicate `server_name`, find and disable only the older
DeviceDock configuration before retrying:

```bash
grep -R "devicedock.duckdns.org\|backenddock.duckdns.org" /etc/nginx/sites-enabled
```

## 9. Log in to Docker Hub and start the stack

Use the VPS Read-only Docker Hub access token when prompted for the password:

```bash
docker login -u mamunhossain1281
cd /opt/devicedock
docker compose --env-file .env -f compose.production.yaml config --quiet
docker compose --env-file .env -f compose.production.yaml pull
docker compose --env-file .env -f compose.production.yaml up -d --remove-orphans
docker compose --env-file .env -f compose.production.yaml ps
```

The `migrate` container should exit with code 0. The frontend, backend, Redis,
and RabbitMQ containers should be running or healthy:

```bash
docker compose --env-file .env -f compose.production.yaml logs migrate
docker compose --env-file .env -f compose.production.yaml logs --tail=100 backend
docker compose --env-file .env -f compose.production.yaml logs --tail=100 frontend

curl -fsS http://127.0.0.1:3006/api/v1/
curl -I http://127.0.0.1:3005/
curl -I http://devicedock.duckdns.org/
curl -fsS http://backenddock.duckdns.org/api/v1/
```

Do not continue to TLS until the HTTP checks work.

## 10. Install Certbot and enable HTTPS

Install Certbot using its recommended snap package:

```bash
apt install -y snapd
snap install core
snap refresh core
snap install --classic certbot
ln -sf /snap/bin/certbot /usr/local/bin/certbot
```

Request one certificate covering both domains and let Certbot configure the
HTTP-to-HTTPS redirects:

```bash
certbot --nginx \
  -d devicedock.duckdns.org \
  -d backenddock.duckdns.org \
  --redirect \
  --agree-tos \
  --no-eff-email \
  --email YOUR_EMAIL_ADDRESS

nginx -t
systemctl reload nginx
certbot renew --dry-run
```

Final checks:

```bash
curl -I https://devicedock.duckdns.org/
curl -fsS https://backenddock.duckdns.org/api/v1/
```

## 11. Deploy an update

Repeat all three local `--pull --no-cache` builds and pushes. Then run on the
VPS:

```bash
cd /opt/devicedock
docker compose --env-file .env -f compose.production.yaml pull
docker compose --env-file .env -f compose.production.yaml up -d --remove-orphans
docker compose --env-file .env -f compose.production.yaml ps
docker compose --env-file .env -f compose.production.yaml logs --tail=100 backend frontend
```

Compose uses `pull_policy: always`, so the current `latest` images are checked
on every deployment.

## 12. Operational commands

```bash
cd /opt/devicedock

docker compose --env-file .env -f compose.production.yaml ps
docker compose --env-file .env -f compose.production.yaml logs -f backend frontend
docker compose --env-file .env -f compose.production.yaml restart backend
docker compose --env-file .env -f compose.production.yaml stop
docker compose --env-file .env -f compose.production.yaml start
docker system df
```

Do not run `docker compose down -v`: `-v` deletes the persistent Redis and
RabbitMQ volumes. Because only `latest` is retained, reliable image rollback is
not available; database migrations may also be irreversible. Take a database
backup before risky schema changes.
