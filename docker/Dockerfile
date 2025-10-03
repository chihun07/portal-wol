# syntax=docker/dockerfile:1
FROM node:20-bullseye-slim AS frontend-build
WORKDIR /build/web
COPY web/package.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund
COPY web ./
ARG NEXT_PUBLIC_API_BASE=""
ENV NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}
RUN npm run build

FROM python:3.12-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
RUN apt-get update && apt-get install -y --no-install-recommends iputils-ping && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
COPY --from=frontend-build /build/web/out ./app/static

# -------- Production Image --------
FROM base AS prod
# etherwake를 사용할 경우, 호스트에 설치 권장. 컨테이너는 기본적으로 python 방식 사용.
ENV HOST=0.0.0.0 PORT=8000
EXPOSE 8000/udp
EXPOSE 8000
CMD ["python","-m","app.main"]