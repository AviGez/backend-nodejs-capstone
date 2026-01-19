# 🚀 מדריך העלאה לאוויר (Deployment Guide)

## אפשרויות העלאה לאוויר

### אפשרות 1: VPS עם Docker (מומלץ - הכי פשוט) ⭐

#### צעדים:

**1. רכישת VPS:**
- **DigitalOcean**: https://www.digitalocean.com/ ($6/חודש)
- **Linode**: https://www.linode.com/ ($5/חודש)
- **Hetzner**: https://www.hetzner.com/ (€4/חודש)
- **AWS Lightsail**: https://aws.amazon.com/lightsail/ ($5/חודש)

**2. התחברות לשרת:**
```bash
ssh root@your-server-ip
```

**3. התקנת Docker:**
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# התקנת Docker Compose
apt-get install docker-compose-plugin
```

**4. העלאת הקוד:**
```bash
# אפשרות א': Git Clone
git clone <your-repo-url>
cd Second-hand-store

# אפשרות ב': העלאת קבצים עם SCP
scp -r /path/to/Second-hand-store root@your-server-ip:/root/
```

**5. יצירת קובץ `.env` לייצור:**

צור קובץ `backend/.env`:
```env
MONGO_URL=mongodb://root:YOUR_SECURE_PASSWORD@mongo:27017/secondChance?authSource=admin
JWT_SECRET=your-very-secure-random-secret-key-here-min-32-chars
NODE_ENV=production
PORT=3060
FRONTEND_BASE_URL=https://yourdomain.com
SOCKET_ORIGIN=https://yourdomain.com
```

צור קובץ `frontend/.env`:
```env
REACT_APP_API_URL=https://api.yourdomain.com
```

**6. עדכון `docker-compose.yml` לייצור:**

```yaml
version: "3.9"

services:
  mongo:
    image: mongo:6
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: YOUR_SECURE_PASSWORD
    volumes:
      - mongo_data:/data/db
    # הסר את ה-port mapping בייצור או הגבל ל-localhost
    # ports:
    #   - "127.0.0.1:27017:27017"

  backend:
    build:
      context: ./backend
    depends_on:
      - mongo
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3060
      MONGO_URL: mongodb://root:YOUR_SECURE_PASSWORD@mongo:27017/secondChance?authSource=admin
      JWT_SECRET: ${JWT_SECRET}
      FRONTEND_BASE_URL: ${FRONTEND_BASE_URL}
      SOCKET_ORIGIN: ${SOCKET_ORIGIN}
    ports:
      - "3060:3060"

  frontend:
    build:
      context: ./frontend
    depends_on:
      - backend
    restart: unless-stopped
    environment:
      REACT_APP_API_URL: ${REACT_APP_API_URL}
    ports:
      - "80:80"
      - "443:443"

volumes:
  mongo_data:
```

**7. התקנת Nginx כפורטל קדמי (Reverse Proxy):**

```bash
apt-get update
apt-get install nginx certbot python3-certbot-nginx
```

צור קובץ `/etc/nginx/sites-available/yourdomain`:
```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3060;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support for Socket.IO
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

הפעל את האתר:
```bash
ln -s /etc/nginx/sites-available/yourdomain /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

**8. הגדרת SSL עם Let's Encrypt:**
```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

**9. הפעלת האפליקציה:**
```bash
cd /root/Second-hand-store
docker compose up -d --build
```

**10. בדיקה:**
- Frontend: https://yourdomain.com
- Backend: https://api.yourdomain.com

---

### אפשרות 2: Railway (קל ומהיר) ⚡

Railway תומך ב-Docker Compose ומתאים לפרויקטים כאלה.

**1. הרשמה:** https://railway.app/

**2. יצירת פרויקט חדש:**
- לחץ על "New Project"
- בחר "Deploy from GitHub repo" (או העלה את הקוד)

**3. הגדרת משתני סביבה:**
ב-Railway Dashboard, הוסף:
```
MONGO_URL=mongodb://root:password@mongo:27017/secondChance?authSource=admin
JWT_SECRET=your-secret-key
NODE_ENV=production
FRONTEND_BASE_URL=https://your-app.railway.app
REACT_APP_API_URL=https://your-backend.railway.app
```

**4. Railway יטפל ב:**
- בניית Docker images
- הפעלת containers
- SSL certificates
- Domain management

**עלות:** $5/חודש + שימוש

---

### אפשרות 3: Render (חינמי לפרויקטים קטנים) 🆓

**1. הרשמה:** https://render.com/

**2. יצירת Web Service:**
- בחר את ה-repo שלך
- בחר "Docker" כ-Deploy Type
- הגדר את `docker-compose.yml` כ-root

**3. הוסף MongoDB:**
- Create → MongoDB
- העתק את ה-connection string

**4. הגדר משתני סביבה:**
```
MONGO_URL=<from-render-mongodb>
JWT_SECRET=your-secret
NODE_ENV=production
```

**עלות:** חינמי (עם הגבלות), $7/חודש ל-Pro

---

### אפשרות 4: פריסה נפרדת (Frontend + Backend) 🔀

#### Frontend: Vercel/Netlify
#### Backend: Railway/Render

**Frontend ב-Vercel:**
1. הרשמה: https://vercel.com/
2. Import Project → בחר את תיקיית `frontend`
3. Build Command: `npm run build`
4. Output Directory: `build`
5. Environment Variables:
   ```
   REACT_APP_API_URL=https://your-backend-url.com
   ```

**Backend ב-Railway:**
1. העלה את תיקיית `backend`
2. הגדר MongoDB (Railway MongoDB או MongoDB Atlas)
3. Environment Variables:
   ```
   MONGO_URL=mongodb://...
   JWT_SECRET=...
   NODE_ENV=production
   FRONTEND_BASE_URL=https://your-frontend.vercel.app
   ```

---

### אפשרות 5: MongoDB Atlas (מומלץ לכל האפשרויות) 🗄️

במקום MongoDB מקומי, השתמש ב-MongoDB Atlas (חינמי עד 512MB):

**1. הרשמה:** https://www.mongodb.com/cloud/atlas

**2. יצירת Cluster:**
- בחר Free Tier
- בחר Region קרוב אליך
- צור Database User
- הוסף IP Address (0.0.0.0/0 לכל IP או IP של השרת שלך)

**3. קבלת Connection String:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/secondChance?retryWrites=true&w=majority
```

**4. עדכון `MONGO_URL` בכל האפשרויות לעיל**

---

## 🔒 אבטחה לייצור

### 1. משתני סביבה:
- **אל תעלה** את קובץ `.env` ל-Git!
- השתמש במשתני סביבה של הפלטפורמה
- השתמש ב-secrets management

### 2. MongoDB:
- שנה את הסיסמה של root
- הגבל גישה ל-IP של השרת בלבד
- השתמש ב-MongoDB Atlas עם authentication

### 3. JWT Secret:
- השתמש במפתח חזק (מינימום 32 תווים)
- אל תשתף אותו
- שנה אותו אם נחשף

### 4. CORS:
- הגבל `FRONTEND_BASE_URL` לכתובת הייצור בלבד
- אל תשתמש ב-`*` בייצור

### 5. Firewall:
```bash
# פתח רק את הפורטים הנדרשים
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw enable
```

---

## 📋 Checklist לפני העלאה

- [ ] בדוק שהקוד עובד מקומית
- [ ] בדוק שהכל עובד עם Docker Compose מקומי
- [ ] שנה את כל הסיסמאות והמפתחות
- [ ] הגדר משתני סביבה לייצור
- [ ] עדכן את `FRONTEND_BASE_URL` ו-`REACT_APP_API_URL`
- [ ] הגדר SSL/HTTPS
- [ ] בדוק את ה-CORS settings
- [ ] הגדר backup ל-MongoDB
- [ ] בדוק את ה-logs
- [ ] בדוק את הביצועים

---

## 🐛 פתרון בעיות נפוצות

### הבעיה: האתר לא נטען
**פתרון:**
- בדוק שה-containers רצים: `docker compose ps`
- בדוק את ה-logs: `docker compose logs`
- בדוק את ה-firewall

### הבעיה: MongoDB לא מתחבר
**פתרון:**
- בדוק את ה-`MONGO_URL`
- בדוק שה-MongoDB container רץ
- בדוק את ה-network ב-Docker

### הבעיה: CORS errors
**פתרון:**
- עדכן את `FRONTEND_BASE_URL` ב-backend
- בדוק את ה-CORS middleware

### הבעיה: Socket.IO לא עובד
**פתרון:**
- בדוק את ה-`SOCKET_ORIGIN`
- ודא שה-Nginx מגדיר WebSocket headers
- בדוק את ה-ports

---

## 📞 תמיכה

אם נתקלת בבעיות:
1. בדוק את ה-logs: `docker compose logs -f`
2. בדוק את ה-status: `docker compose ps`
3. בדוק את ה-network: `docker network ls`

---

## 🎯 המלצה

**למתחילים:** השתמש ב-**Railway** או **Render** - הכי פשוט ומהיר.

**למתקדמים:** השתמש ב-**VPS עם Docker** - יותר שליטה וגמישות.

**לפרויקטים גדולים:** השתמש ב-**AWS/GCP** עם Kubernetes.

