from pathlib import Path
import re

path = Path('src/App.jsx')
text = path.read_text(encoding='utf-8')
pattern = re.compile(r"  const getPlayerNotesText = \(playerId\) => \{.*?\n  const updatePlayerNotesText =", re.S)
replacement = '''  const getPlayerNotesText = (playerId) => {
    const stored = playerNotes[playerId] ?? playerNotes[String(playerId)] ?? '';
    if (typeof stored === 'string') return stored;
    if (!Array.isArray(stored)) return '';

    const lineBreak = String.fromCharCode(10);
    return stored.map(note => {
      const timestamp = note?.timestamp ? new Date(note.timestamp).toLocaleString() : '';
      const coach = note?.coach || 'Coach';
      const header = [timestamp, coach].filter(Boolean).join(' • ');
      const body = note?.note || '';
      return (header ? `[${header}]${lineBreak}${body}` : body).trim();
    }).filter(Boolean).join(`${lineBreak}${lineBreak}`);
  };

  const updatePlayerNotesText ='''
text, count = pattern.subn(replacement, text, count=1)
if count != 1:
    raise SystemExit(f'expected one shared note helper block, found {count}')
path.write_text(text, encoding='utf-8')
print('Fixed shared note helper syntax')
