from pathlib import Path
import re

app_path = Path('src/App.jsx')
text = app_path.read_text(encoding='utf-8')

# 1) Import availability normalizer.
old_import = "import { availabilityKey, getAvailabilityStatus, isEligibleForHalf, getDynamicBenchSize, cleanupLineupsForPlayday, cleanupLineupsForMatch, getHistoryRange, validateAssignment, validateLineupForPublish, normalizeSuitability, preferenceScore } from './domain/planner';"
new_import = "import { availabilityKey, getAvailabilityStatus, isEligibleForHalf, getDynamicBenchSize, cleanupLineupsForPlayday, cleanupLineupsForMatch, getHistoryRange, validateAssignment, validateLineupForPublish, normalizeAvailabilityStatus, normalizeSuitability, preferenceScore } from './domain/planner';"
if old_import not in text:
    raise SystemExit('planner import not found')
text = text.replace(old_import, new_import, 1)

# 2) Simplify statuses to three visible choices.
old_options = """const availabilityOptions = [
  { value: 'available', label: 'Available', icon: '✓', color: '#059669', bg: '#d1fae5' },
  { value: 'train-only', label: 'Train Only', icon: '◐', color: '#ca8a04', bg: '#fef9c3' },
  { value: 'injured', label: 'Injured', icon: '✚', color: '#b91c1c', bg: '#fee2e2' },
  { value: 'absent', label: 'Absent', icon: '○', color: '#6b7280', bg: '#f3f4f6' },
  { value: 'not-selected', label: 'Not selected', icon: '–', color: '#7c3aed', bg: '#ede9fe' },
  { value: 'unavailable', label: 'Unavailable', icon: '✕', color: '#dc2626', bg: '#fee2e2' },
];"""
new_options = """const availabilityOptions = [
  { value: 'available', label: 'Available', icon: '✓', color: '#059669', bg: '#d1fae5' },
  { value: 'train-only', label: 'Train Only', icon: '◐', color: '#ca8a04', bg: '#fef9c3' },
  { value: 'unavailable', label: 'Not available', icon: '✕', color: '#dc2626', bg: '#fee2e2' },
];"""
if old_options not in text:
    raise SystemExit('availability options block not found')
text = text.replace(old_options, new_options, 1)

# 3) Existing legacy status values should appear as Not available in the Squad UI.
old_player_avail = "          const playerAvail = availability[player.id] || 'available';"
new_player_avail = "          const playerAvail = normalizeAvailabilityStatus(availability[player.id]);"
if old_player_avail not in text:
    raise SystemExit('playerAvail line not found')
text = text.replace(old_player_avail, new_player_avail, 1)

# 4) Add shared-note helpers. Legacy note arrays are flattened only when shown/edited,
#    preserving all existing trainer remarks in readable text.
anchor = """  const toggleDoNotPlayPosition = (playerId, positionId) => {
    const key = `${playerId}-${positionId}`;
    setSuitability(prev => {
      const next = { ...prev };
      const current = next[key] !== undefined ? normalizeSuitability(next[key]) : 0;
      if (current === 10) delete next[key];
      else next[key] = 10;
      return next;
    });
  };

"""
helpers = anchor + """  const getPlayerNotesText = (playerId) => {
    const stored = playerNotes[playerId] ?? playerNotes[String(playerId)] ?? '';
    if (typeof stored === 'string') return stored;
    if (!Array.isArray(stored)) return '';

    return stored.map(note => {
      const timestamp = note?.timestamp ? new Date(note.timestamp).toLocaleString() : '';
      const coach = note?.coach || 'Coach';
      const header = [timestamp, coach].filter(Boolean).join(' • ');
      return `${header ? `[${header}]\n` : ''}${note?.note || ''}`.trim();
    }).filter(Boolean).join('\n\n');
  };

  const updatePlayerNotesText = (playerId, value) => {
    setPlayerNotes(prev => ({ ...prev, [playerId]: value }));
  };

"""
if anchor not in text:
    raise SystemExit('toggleDoNotPlayPosition anchor not found')
text = text.replace(anchor, helpers, 1)

# 5) Make the hard-block control a small red cross in the top-right of each position card.
old_card = """                        <div key={pos.id} className={`rounded-xl p-2 text-center border ${trained ? 'bg-white border-gray-200' : 'bg-gray-100 border-gray-100'}`}>
                          <div className="flex items-center justify-center gap-1 mb-1">"""
new_card = """                        <div key={pos.id} className={`relative rounded-xl p-2 text-center border ${trained ? 'bg-white border-gray-200' : 'bg-gray-100 border-gray-100'}`}>
                          <button
                            type="button"
                            onClick={() => toggleDoNotPlayPosition(player.id, pos.id)}
                            aria-pressed={positionSuitability === 10}
                            className={`absolute top-1 right-1 w-5 h-5 rounded-full border flex items-center justify-center text-[11px] font-bold transition-all ${positionSuitability === 10 ? 'bg-red-600 border-red-600 text-white shadow-sm' : 'bg-white border-red-200 text-red-400 hover:bg-red-50 hover:border-red-400'}`}
                            title={positionSuitability === 10 ? 'Do not play here — click to allow again' : 'Tick to block this position'}
                          >
                            ✕
                          </button>
                          <div className="flex items-center justify-center gap-1 mb-1">"""
if old_card not in text:
    raise SystemExit('position card opening not found')
text = text.replace(old_card, new_card, 1)

old_allowed_button = re.compile(r'''                          <button\n                            type="button"\n                            onClick=\{\(\) => toggleDoNotPlayPosition\(player\.id, pos\.id\)\}.*?                          </button>\n                          <button onClick=\{\(\) => handleTrainingToggle''', re.S)
replacement = """                          <button onClick={() => handleTrainingToggle"""
text, count = old_allowed_button.subn(replacement, text, count=1)
if count != 1:
    raise SystemExit(f'expected one Position allowed button, found {count}')

# 6) Replace popup/add/delete note list with one shared open textarea.
notes_pattern = re.compile(r'''                  \{\/\* Player Notes \*\/\}\n                  <div className="mt-4 pt-3 border-t border-gray-200">.*?                  </div>\n\n                  \{\/\* Move \/ Remove Player \*\/\}''', re.S)
notes_replacement = '''                  {/* Player Notes */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="text-xs font-medium text-gray-500">Shared Coach Notes</div>
                      <div className="text-[10px] text-gray-400">Visible and editable by all coaches</div>
                    </div>
                    <textarea
                      value={getPlayerNotesText(player.id)}
                      onChange={(e) => updatePlayerNotesText(player.id, e.target.value)}
                      rows={6}
                      placeholder="Add observations, development points or other remarks here…"
                      className="w-full resize-y px-3 py-2 text-xs text-gray-800 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="text-[10px] text-gray-400 mt-1">Any coach with access can add, change or remove text. Use Save to sync changes.</div>
                  </div>

                  {/* Move / Remove Player */}'''
text, count = notes_pattern.subn(notes_replacement, text, count=1)
if count != 1:
    raise SystemExit(f'expected one Player Notes block, found {count}')

app_path.write_text(text, encoding='utf-8')

# 7) Collapse availability domain to three statuses while safely mapping legacy saved data.
planner_path = Path('src/domain/planner.ts')
planner = planner_path.read_text(encoding='utf-8')
old_top = """export type AvailabilityStatus = 'available' | 'train-only' | 'injured' | 'absent' | 'not-selected' | 'unavailable';

export function availabilityKey(playdayId: number | string, matchId: number | string, half: number | string, playerId: number | string) {
  return `half:${playdayId}:${matchId}:${half}:${playerId}`;
}

export function getAvailabilityStatus(map: Record<string, AvailabilityStatus>, playerId: number | string, playdayId?: number | string, matchId?: number | string, half?: number | string): AvailabilityStatus {
  if (playdayId !== undefined && matchId !== undefined && half !== undefined) {
    const halfStatus = map[availabilityKey(playdayId, matchId, half, playerId)];
    if (halfStatus) return halfStatus;
  }
  return map[String(playerId)] || 'available';
}
"""
new_top = """export type AvailabilityStatus = 'available' | 'train-only' | 'unavailable';

type LegacyAvailabilityStatus = 'injured' | 'absent' | 'not-selected';
type StoredAvailabilityStatus = AvailabilityStatus | LegacyAvailabilityStatus | string | null | undefined;

export function normalizeAvailabilityStatus(status: StoredAvailabilityStatus): AvailabilityStatus {
  if (status === 'available') return 'available';
  if (status === 'train-only') return 'train-only';
  return status ? 'unavailable' : 'available';
}

export function availabilityKey(playdayId: number | string, matchId: number | string, half: number | string, playerId: number | string) {
  return `half:${playdayId}:${matchId}:${half}:${playerId}`;
}

export function getAvailabilityStatus(map: Record<string, StoredAvailabilityStatus>, playerId: number | string, playdayId?: number | string, matchId?: number | string, half?: number | string): AvailabilityStatus {
  if (playdayId !== undefined && matchId !== undefined && half !== undefined) {
    const halfStatus = map[availabilityKey(playdayId, matchId, half, playerId)];
    if (halfStatus) return normalizeAvailabilityStatus(halfStatus);
  }
  return normalizeAvailabilityStatus(map[String(playerId)]);
}
"""
if old_top not in planner:
    raise SystemExit('planner availability block not found')
planner = planner.replace(old_top, new_top, 1)
planner_path.write_text(planner, encoding='utf-8')

# 8) Update tests for three-status model + legacy mapping.
test_path = Path('src/domain/__tests__/planner.test.ts')
test = test_path.read_text(encoding='utf-8')
test = test.replace(
    "import { availabilityKey, cleanupLineupsForMatch, cleanupLineupsForPlayday, getAvailabilityStatus, getDynamicBenchSize, getHistoryRange, isEligibleForHalf, normalizeSuitability, preferenceScore, validateAssignment, validateLineupForPublish } from '../planner';",
    "import { availabilityKey, cleanupLineupsForMatch, cleanupLineupsForPlayday, getAvailabilityStatus, getDynamicBenchSize, getHistoryRange, isEligibleForHalf, normalizeAvailabilityStatus, normalizeSuitability, preferenceScore, validateAssignment, validateLineupForPublish } from '../planner';"
)
test = test.replace(
    "expect(getAvailabilityStatus(map, 7, 1, 2, 1)).toBe('absent');",
    "expect(getAvailabilityStatus(map, 7, 1, 2, 1)).toBe('unavailable');"
)
test = test.replace(
    "expect(validateAssignment({ status: 'injured', mode: 'game', trained: false, duplicate: false })).toHaveLength(2);",
    "expect(validateAssignment({ status: 'unavailable', mode: 'game', trained: false, duplicate: false })).toHaveLength(2);"
)
marker = """  it('keeps train-only out of games but allows training', () => {
    expect(isEligibleForHalf('train-only', 'game')).toBe(false);
    expect(isEligibleForHalf('train-only', 'training')).toBe(true);
  });
"""
insert = marker + """  it('maps removed legacy availability statuses to not available', () => {
    expect(normalizeAvailabilityStatus('injured')).toBe('unavailable');
    expect(normalizeAvailabilityStatus('absent')).toBe('unavailable');
    expect(normalizeAvailabilityStatus('not-selected')).toBe('unavailable');
  });
"""
if marker not in test:
    raise SystemExit('test marker not found')
test = test.replace(marker, insert, 1)
test_path.write_text(test, encoding='utf-8')

print('Applied shared notes, red position block cross, and three-status availability model')
