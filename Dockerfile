# Image tag must stay in lockstep with the installed @playwright/test version
# (currently 1.61.1) — a mismatch causes browser/driver version errors.
FROM mcr.microsoft.com/playwright:v1.61.1-jammy

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV CI=true

CMD ["npx", "playwright", "test"]
