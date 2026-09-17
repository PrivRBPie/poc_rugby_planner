from pathlib import Path

path = Path('src/App.jsx')
text = path.read_text(encoding='utf-8')

old_squad = '''        <div className="flex items-center gap-2">\n          <button onClick={startNewSeason} disabled={isSyncing} className="px-3 py-2 rounded-xl font-semibold text-xs border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50" title="Restart season statistics without deleting ratings or history">↻ New Season</button>\n          <button onClick={() => { setNewPlayer({ name: '', miniYear: '2nd year' }); setShowAddPlayer(true); }} className="flex items-center gap-1.5 text-white px-3 py-2 rounded-xl font-semibold text-sm" style={{ backgroundColor: DIOK.blue }}><Icons.Plus /> Add</button>\n        </div>'''
new_squad = '''        <div className="flex items-center gap-2">\n          <button onClick={() => { setNewPlayer({ name: '', miniYear: '2nd year' }); setShowAddPlayer(true); }} className="flex items-center gap-1.5 text-white px-3 py-2 rounded-xl font-semibold text-sm" style={{ backgroundColor: DIOK.blue }}><Icons.Plus /> Add</button>\n        </div>'''

old_admin = '''        <div>\n          <h2 className="text-xl font-bold text-gray-900">Admin Dashboard</h2>\n          <p className="text-sm text-gray-500">Login activity and system overview</p>\n        </div>'''
new_admin = '''        <div className="flex items-center justify-between gap-3">\n          <div>\n            <h2 className="text-xl font-bold text-gray-900">Admin Dashboard</h2>\n            <p className="text-sm text-gray-500">Login activity and system overview</p>\n          </div>\n          <button\n            onClick={startNewSeason}\n            disabled={isSyncing}\n            className="px-3 py-2 rounded-xl font-semibold text-xs border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"\n            title="Restart season statistics without deleting ratings or history"\n          >\n            ↻ New Season\n          </button>\n        </div>'''

if old_squad not in text:
    raise SystemExit('Squad New Season button block not found')
if old_admin not in text:
    raise SystemExit('Admin header block not found')

text = text.replace(old_squad, new_squad, 1)
text = text.replace(old_admin, new_admin, 1)
path.write_text(text, encoding='utf-8')
print('Moved New Season button from Squad to Admin')
