from pathlib import Path
import re

path = Path('src/App.jsx')
text = path.read_text(encoding='utf-8')

# 1) Remove New Season from the Admin header.
admin_pattern = re.compile(r'''        <div className="flex items-center justify-between gap-3">\n          <div>\n            <h2 className="text-xl font-bold text-gray-900">Admin Dashboard</h2>\n            <p className="text-sm text-gray-500">Login activity and system overview</p>\n          </div>\n          <button\n            onClick=\{startNewSeason\}\n            disabled=\{isSyncing\}\n            className="px-3 py-2 rounded-xl font-semibold text-xs border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"\n            title="Restart season statistics without deleting ratings or history"\n          >\n            ↻ New Season\n          </button>\n        </div>''')
admin_replacement = '''        <div>\n          <h2 className="text-xl font-bold text-gray-900">Admin Dashboard</h2>\n          <p className="text-sm text-gray-500">Login activity and system overview</p>\n        </div>'''
text, admin_count = admin_pattern.subn(admin_replacement, text, count=1)
if admin_count != 1:
    raise SystemExit(f'Expected to remove 1 Admin New Season button, found {admin_count}')

# 2) Turn the backup section into Advanced Actions and place a redesigned New Season action there.
advanced_old = '''            <summary className="px-4 py-2 cursor-pointer text-xs text-gray-500 hover:text-gray-700 select-none">\n              🔧 Advanced: Database Backup & Restore\n            </summary>\n            <div className="p-4 space-y-4 border-t border-gray-200">\n              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">'''
advanced_new = '''            <summary className="px-4 py-3 cursor-pointer text-sm font-semibold text-gray-700 hover:text-gray-900 select-none">\n              🔧 Advanced Actions\n            </summary>\n            <div className="p-4 space-y-5 border-t border-gray-200">\n              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">\n                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">\n                  <div>\n                    <h4 className="text-sm font-bold text-gray-900">Start a new season</h4>\n                    <p className="text-xs text-gray-600 mt-1">Restart playing, bench, position and fairness counters from a chosen date. Ratings, training and historical matches are kept.</p>\n                  </div>\n                  <button\n                    onClick={startNewSeason}\n                    disabled={isSyncing}\n                    className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-amber-300 bg-white text-amber-800 text-sm font-bold shadow-sm hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed"\n                    title="Start a new season without deleting ratings or match history"\n                  >\n                    <span aria-hidden="true">↻</span> Start New Season\n                  </button>\n                </div>\n              </div>\n\n              <div>\n                <h4 className="text-sm font-bold text-gray-900">Database Backup & Restore</h4>\n                <p className="text-xs text-gray-500 mt-1 mb-3">Create a safety copy before restoring or making major administrative changes.</p>\n              </div>\n\n              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">'''
if advanced_old not in text:
    raise SystemExit('Advanced backup section marker not found')
text = text.replace(advanced_old, advanced_new, 1)

# 3) Fix false dirty/save state when switching teams.
# React state setters are asynchronous. initialState must be built from the newly loaded team payload,
# not the previous team's learning config / satisfaction weights / player notes.
stale_pattern = re.compile(r'''(\s+availability: JSON\.stringify\(rugbyData\.data\.availability \|\| \{\}\),\n)\s+learningPlayerConfig: JSON\.stringify\(learningPlayerConfig\),\n\s+satisfactionWeights: JSON\.stringify\(satisfactionWeights\),\n\s+playerNotes: JSON\.stringify\(playerNotes\),''')
stale_replacement = r'''\1          learningPlayerConfig: JSON.stringify(rugbyData.data.learningPlayerConfig || { maxStars: 2, maxGames: 5 }),\n          satisfactionWeights: JSON.stringify(rugbyData.data.satisfactionWeights || { playingTime: 50, fun: 30, learning: 20 }),\n          playerNotes: JSON.stringify(rugbyData.data.playerNotes || {}),'''
text, stale_count = stale_pattern.subn(stale_replacement, text, count=1)
if stale_count != 1:
    raise SystemExit(f'Expected 1 team-load initialState stale-state block, found {stale_count}')

path.write_text(text, encoding='utf-8')
print('Applied Advanced Actions redesign and team-switch Save-state fix')
