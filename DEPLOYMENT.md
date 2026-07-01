# ReciTrack Deployment Checklist

## 1. Database

Use a hosted PostgreSQL database such as Supabase.

Backend production `DATABASE_URL` should look like:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require"
```

Run migrations from the backend folder:

```bash
npx prisma migrate deploy
npm run prisma:generate
```

## 2. Backend Environment

Set these on the backend host:

```env
NODE_ENV=production
PORT=4000
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require"
JWT_ACCESS_SECRET="long-random-secret"
JWT_REFRESH_SECRET="different-long-random-secret"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
FRONTEND_URL="https://your-frontend-domain"
REFRESH_COOKIE_SAME_SITE="none"
REFRESH_COOKIE_SECURE="true"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-google-app-password"
SMTP_FROM="ReciTrack <your-email@gmail.com>"
```

Backend build command:

```bash
npm install
npm run build
npx prisma migrate deploy
```

Backend start command:

```bash
npm start
```

## 3. Frontend Environment

Set this on the frontend host:

```env
VITE_API_URL="https://your-backend-domain/api"
```

Frontend build command:

```bash
npm install
npm run build
```

Frontend output folder:

```text
dist
```

## 4. First Production Teacher

Create the first teacher after migrations:

```bash
TEACHER_USERNAME="teacher.username" \
TEACHER_PASSWORD="StrongPassword123!" \
TEACHER_FIRST_NAME="First" \
TEACHER_LAST_NAME="Last" \
TEACHER_EMAIL="teacher@email.com" \
npm run create:teacher
```

## 5. Smoke Tests

After deploy:

- Login as teacher.
- Add teacher email in Settings.
- Create a section.
- Create a class.
- Create a student with email.
- Post an announcement with expiration date.
- Test forgot password email.
- Login as student.
- Check student announcements and recitation history.
