from pathlib import Path

path = Path('src/App.jsx')
text = path.read_text(encoding='utf-8')

old_import = "import { loadOfflineSnapshot, saveOfflineSnapshot } from './offlineStore';\n"
new_import = "import { loadOfflineSnapshot, saveOfflineSnapshot } from './offlineStore';\nimport CoachAccessPanel from './CoachAccessPanel';\n"
if old_import not in text:
    raise SystemExit('offlineStore import not found')
text = text.replace(old_import, new_import, 1)

old_default = """        // Get last selected team from localStorage or default to first team
        const lastTeamId = localStorage.getItem('rugbyPlannerLastTeamId');
        const defaultTeam = lastTeamId
          ? teamsData.find(t => t.id === lastTeamId)
          : teamsData[0];
"""
new_default = """        // On a fresh login, start on the coach's Primary team. During an existing
        // session, preserve the last team they deliberately switched to.
        const startTeamId = localStorage.getItem('rugbyPlannerStartTeamId');
        const lastTeamId = localStorage.getItem('rugbyPlannerLastTeamId');
        const primaryTeamId = localStorage.getItem('rugbyPlannerPrimaryTeamId');
        const defaultTeam = (startTeamId && teamsData.find(t => t.id === startTeamId))
          || (lastTeamId && teamsData.find(t => t.id === lastTeamId))
          || (primaryTeamId && teamsData.find(t => t.id === primaryTeamId))
          || teamsData[0];

        // The Primary-team redirect is one-shot after login. Once inside the app,
        // normal team switching and the remembered last team continue to work.
        if (startTeamId) localStorage.removeItem('rugbyPlannerStartTeamId');
"""
if old_default not in text:
    raise SystemExit('default team block not found')
text = text.replace(old_default, new_default, 1)

old_admin = """        {/* Backup & Restore (Hidden at bottom) */}
        <div className=\"mt-12 pt-8 border-t border-gray-200\">\n"""
new_admin = """        <div className=\"mt-8\">
          <CoachAccessPanel teams={teams} />
        </div>

        {/* Backup & Restore (Hidden at bottom) */}
        <div className=\"mt-12 pt-8 border-t border-gray-200\">\n"""
if old_admin not in text:
    raise SystemExit('advanced actions block not found')
text = text.replace(old_admin, new_admin, 1)

path.write_text(text, encoding='utf-8')
