from pathlib import Path

path = Path('migrations/20260917_r8_coach_management.sql')
text = path.read_text(encoding='utf-8')
old = """-- Pick a deterministic primary team for existing accounts that do not yet have one.\nupdate public.coach_accounts ca\nset primary_team_id = chosen.team_id,\n    updated_at = now()\nfrom lateral (\n  select cta.team_id\n  from public.coach_team_access cta\n  join public.teams t on t.id = cta.team_id\n  where cta.coach_id = ca.id\n  order by t.name, t.id\n  limit 1\n) chosen\nwhere ca.primary_team_id is null;\n"""
new = """-- Pick a deterministic primary team for existing accounts that do not yet have one.\nupdate public.coach_accounts ca\nset primary_team_id = (\n      select cta.team_id\n      from public.coach_team_access cta\n      join public.teams t on t.id = cta.team_id\n      where cta.coach_id = ca.id\n      order by t.name, t.id\n      limit 1\n    ),\n    updated_at = now()\nwhere ca.primary_team_id is null\n  and exists (\n    select 1 from public.coach_team_access cta where cta.coach_id = ca.id\n  );\n"""
if old not in text:
    raise SystemExit('primary-team migration block not found')
path.write_text(text.replace(old, new, 1), encoding='utf-8')
