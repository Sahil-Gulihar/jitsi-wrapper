# Welcome to Gmeet Clone!

   A simple implementation of JITSI Video call service using Remix.
  
## Development
```
npm run dev
# In Another terminal
node server.js
```


# Quick SERVER setup with Docker
```
docker pull jitsi/web
docker pull jitsi/jicofo
docker pull jitsi/prosody
docker pull jitsi/jvb
```

# Or use their docker-compose.yml (recommended)
```
git clone https://github.com/jitsi/docker-jitsi-meet
cd docker-jitsi-meet
cp env.example .env
```
# Edit .env file to configure your deployment
```
./gen-passwords.sh
docker-compose up -d
```