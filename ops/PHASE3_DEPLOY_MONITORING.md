# LiftWeb Phase 3 — Deploy & Monitoring Checklist

## 1) Database hardening rollout

1. Open Supabase SQL editor
2. Run: `liftweb/supabase/phase3_hardening.sql`
3. Validate indexes created successfully
4. Insert at least one moderator row:

```sql
insert into public.moderators (user_id)
values ('<your-auth-user-id>')
on conflict (user_id) do nothing;
```

## 2) Application deploy checks

- [ ] `npm ci`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Deploy to hosting target
- [ ] Smoke-check routes:
  - `/`
  - `/explore`
  - `/lifts`
  - `/workouts`
  - `/moderation/reports`

## 3) Monitoring cadence (weekly)

- Review open reports count and age
- Ensure no reports are stuck in `open` for >7 days
- Review feed latency from `/explore`
- Confirm new logs are visible in feed within expected time

## 4) Operational thresholds

- High-priority if:
  - moderation queue > 20 open reports
  - repeated feed load failures
  - auth/session regressions on guarded routes

## 5) Incident response quick steps

1. Capture failing route and timestamp
2. Check recent deployment diff
3. Confirm Supabase availability and RLS impact
4. Roll back app deploy if needed
5. Document root cause and mitigation in repo issues
