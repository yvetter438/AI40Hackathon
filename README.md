# DAEMON

Autonomous personal performance operator — hackathon MVP.

## Develop

```bash
cd daemon
npm install
npm run dev
```

- **Dashboard:** http://localhost:3000/dashboard  
- **Calendar:** http://localhost:3000/calendar  
- **Clock:** http://localhost:3000/clock  

## Deploy (Vercel)

Import the `daemon` folder as a Next.js project on Vercel.

## Demo flow

1. Show drift + policies on dashboard.  
2. Inject **Poor sleep (5.5h)**.  
3. Show tool log (`set_alarm`, `update_calendar_blocks`, `set_focus_mode`).  
4. Open **Clock** — wake alarm time changed, DAEMON label.  
5. Open **Calendar** — workout moved to evening.
