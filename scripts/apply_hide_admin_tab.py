from pathlib import Path

app = Path('src/App.jsx')
auth = Path('src/AuthGate.jsx')

app_text = app.read_text()
auth_text = auth.read_text()

old = "export default function RugbyLineupPlanner() {\n  const [activeTab, setActiveTab] = useState('squad');"
new = "export default function RugbyLineupPlanner({ coachRole = 'coach' }) {\n  const [activeTab, setActiveTab] = useState('squad');\n  const isAdmin = coachRole === 'admin';\n\n  useEffect(() => {\n    if (!isAdmin && activeTab === 'admin') setActiveTab('squad');\n  }, [isAdmin, activeTab]);"
if old not in app_text:
    raise SystemExit('App component signature marker not found')
app_text = app_text.replace(old, new, 1)

old = "        {activeTab === 'admin' && AdminView()}"
new = "        {activeTab === 'admin' && isAdmin && AdminView()}"
if old not in app_text:
    raise SystemExit('Admin view marker not found')
app_text = app_text.replace(old, new, 1)

old = "          {tabs.map(tab => ("
new = "          {tabs.filter(tab => tab.id !== 'admin' || isAdmin).map(tab => ("
if old not in app_text:
    raise SystemExit('Tabs marker not found')
app_text = app_text.replace(old, new, 1)

old = "  if (session && coach?.ok && !coach.mustSetPassword) return children;"
new = "  if (session && coach?.ok && !coach.mustSetPassword) {\n    return React.isValidElement(children)\n      ? React.cloneElement(children, { coachRole: coach.role || 'coach' })\n      : children;\n  }"
if old not in auth_text:
    raise SystemExit('AuthGate child marker not found')
auth_text = auth_text.replace(old, new, 1)

app.write_text(app_text)
auth.write_text(auth_text)
