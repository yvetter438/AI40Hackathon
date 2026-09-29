# DAEMON

Autonomous personal performance operator — hackathon MVP.

## Develop

```bash
cd daemon
npm install
npm run dev
```

- **Dashboard:** http://localhost:3000/dashboard  
- **Calendar (PWA):** http://localhost:3000/calendar  
- **Clock / Alarms (PWA):** http://localhost:3000/clock  

## iPhone home screen

1. Open `/calendar` in **Safari** → Share → **Add to Home Screen** (title: **Calendar**).
2. Open `/clock` in Safari → same flow (title: **Clock**).
3. Use the dashboard to **Inject event** (e.g. poor sleep). Calendar and Clock refresh automatically.

## Deploy (Vercel)

Import the `daemon` folder as a Next.js project on Vercel.

## Demo flow

1. Show drift + policies on dashboard.  
2. Inject **Poor sleep (5.5h)**.  
3. Show tool log (`set_alarm`, `update_calendar_blocks`, `set_focus_mode`).  
4. Open **Clock** — wake alarm time changed, DAEMON label.  
5. Open **Calendar** — workout moved to evening.
