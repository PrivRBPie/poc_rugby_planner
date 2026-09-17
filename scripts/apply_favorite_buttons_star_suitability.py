from pathlib import Path
import re

app_path = Path('src/App.jsx')
text = app_path.read_text(encoding='utf-8')

# 1) Replace two-dropdown ranked preferences with visual favorite-position buttons.
#    Preserve rank internally by the order in which buttons are selected (up to four).
helper_pattern = re.compile(
    r"  const getPreferenceRank = \(playerId, positionId\) => \{.*?\n  const removePlayer = async \(playerId\) => \{",
    re.S,
)
helper_replacement = '''  const getFavoritePositionsForPlayer = (playerId) => {
    const favorites = favoritePositions[playerId] || favoritePositions[String(playerId)] || [];
    if (favorites.length > 0) return favorites.slice(0, 4);

    // Backwards compatibility for data saved by the temporary two-dropdown UI.
    const prefs = positionPreferences[playerId] || positionPreferences[String(playerId)] || {};
    return [prefs.preference1, prefs.preference2].filter(Boolean).slice(0, 4);
  };

  const getPreferenceRank = (playerId, positionId) => {
    const favorites = getFavoritePositionsForPlayer(playerId);
    const index = favorites.indexOf(positionId);
    return index >= 0 ? index + 1 : null;
  };

  const isFavoritePosition = (playerId, positionId) => getPreferenceRank(playerId, positionId) !== null;

  const toggleFavoritePosition = (playerId, positionId) => {
    const current = getFavoritePositionsForPlayer(playerId);
    let next;

    if (current.includes(positionId)) {
      next = current.filter(id => id !== positionId);
    } else {
      if (current.length >= 4) {
        alert('You can select up to 4 favorite positions. Deselect one first.');
        return;
      }
      next = [...current, positionId];
    }

    setFavoritePositions(prev => ({ ...prev, [playerId]: next }));
    // Keep the first two mirrored for compatibility with older scoring/data exports.
    setPositionPreferences(prev => ({
      ...prev,
      [playerId]: {
        preference1: next[0] || null,
        preference2: next[1] || null,
      },
    }));
  };

  const getSuitability = (playerId, positionId) => {
    const key = `${playerId}-${positionId}`;
    const explicit = suitability[key] !== undefined ? normalizeSuitability(suitability[key]) : 0;

    // Suitability is now driven by the intuitive 1-5 star rating.
    // The only separate suitability state we retain is the explicit hard block.
    if (explicit === 10) return 10;
    if (!training[key]) return 0;

    const rating = Number(ratings[key] || 0);
    if (rating >= 5) return 1; // best fit
    if (rating >= 3) return 2; // suitable / OK
    return 3;                  // weak fit / use with attention
  };

  const toggleDoNotPlayPosition = (playerId, positionId) => {
    const key = `${playerId}-${positionId}`;
    setSuitability(prev => {
      const next = { ...prev };
      const current = next[key] !== undefined ? normalizeSuitability(next[key]) : 0;
      if (current === 10) delete next[key];
      else next[key] = 10;
      return next;
    });
  };

  const removePlayer = async (playerId) => {'''
text, helper_count = helper_pattern.subn(helper_replacement, text, count=1)
if helper_count != 1:
    raise SystemExit(f'Expected to replace preference/suitability helper block once, found {helper_count}')

preference_ui_pattern = re.compile(
    r'''                  <div className="text-xs font-medium text-gray-500 mt-3 mb-1">Ranked Position Preferences</div>.*?                  <div className="text-xs font-medium text-gray-500 mb-2">Position Training, Suitability & Ratings</div>''',
    re.S,
)
preference_ui_replacement = '''                  <div className="text-xs font-medium text-gray-500 mt-3 mb-1">Favorite Positions</div>
                  <p className="text-[10px] text-gray-400 mb-2">Tap up to 4 positions. The small number shows preference order.</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {positions.map(pos => {
                      const rank = getPreferenceRank(player.id, pos.id);
                      const selected = rank !== null;
                      return (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() => toggleFavoritePosition(player.id, pos.id)}
                          className={`relative min-w-10 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${selected ? 'bg-yellow-50 border-yellow-400 text-yellow-800 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}
                          title={`${pos.name}${selected ? ` · preference ${rank}` : ''}`}
                        >
                          #{pos.code}
                          {selected && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-yellow-500 text-white text-[9px] flex items-center justify-center">
                              {rank}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Position Training & Rating</div>
                  <p className="text-[10px] text-gray-400 mb-2">1★ = avoid if possible · 3★ = suitable · 5★ = excellent. Use “Do not play” only for a hard block.</p>'''
text, ui_count = preference_ui_pattern.subn(preference_ui_replacement, text, count=1)
if ui_count != 1:
    raise SystemExit(f'Expected to replace ranked preference UI once, found {ui_count}')

# 2) Remove S0/S1/S2/S3/S10 dropdown and replace it with a single explicit hard-block control.
suitability_select_pattern = re.compile(
    r'''                          <select\n                            value=\{positionSuitability\}.*?                          </select>\n''',
    re.S,
)
suitability_replacement = '''                          <button
                            type="button"
                            onClick={() => toggleDoNotPlayPosition(player.id, pos.id)}
                            className={`w-full mb-1 text-[9px] border rounded px-1.5 py-1 font-semibold transition-colors ${positionSuitability === 10 ? 'bg-red-100 border-red-300 text-red-800' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                            title={positionSuitability === 10 ? 'Hard block: this player must not play this position' : 'Set a hard block for this position'}
                          >
                            {positionSuitability === 10 ? '⛔ Do not play' : 'Position allowed'}
                          </button>
'''
text, select_count = suitability_select_pattern.subn(suitability_replacement, text, count=1)
if select_count != 1:
    raise SystemExit(f'Expected to replace one suitability dropdown, found {select_count}')

app_path.write_text(text, encoding='utf-8')

# 3) Let ranked favorites use positions 1-4 in the scoring helper.
planner_path = Path('src/domain/planner.ts')
planner = planner_path.read_text(encoding='utf-8')
old = '''export function preferenceScore(rank: 1 | 2 | null | undefined) {
  if (rank === 1) return 100;
  if (rank === 2) return 60;
  return 0;
}'''
new = '''export function preferenceScore(rank: 1 | 2 | 3 | 4 | null | undefined) {
  if (rank === 1) return 100;
  if (rank === 2) return 75;
  if (rank === 3) return 50;
  if (rank === 4) return 25;
  return 0;
}'''
if old not in planner:
    raise SystemExit('preferenceScore block not found')
planner = planner.replace(old, new, 1)
planner_path.write_text(planner, encoding='utf-8')

print('Applied favorite-position buttons and star-driven suitability simplification')
