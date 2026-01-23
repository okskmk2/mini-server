# 1. 베이스 이미지 지정
FROM oven/bun:latest AS base
WORKDIR /app

# 2. 의존성 설치
# lock 파일과 package.json을 먼저 복사하여 캐싱 활용
COPY package.json bun.lock ./
RUN bun install

# 3. 소스 코드 복사 및 빌드
COPY . .
# React 프로젝트 빌드 (Vite 등을 사용하는 경우)
RUN bun run build

# 4. 실행 환경 설정
# App Engine 요구사항: 포트 8080 수신 대기
ENV PORT=8080
EXPOSE 8080

# 5. 애플리케이션 실행
# 정적 파일을 서빙하는 서버(예: bun-serve) 또는 직접 작성한 server.ts 실행
CMD ["bun", "run", "start"]