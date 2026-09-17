from pathlib import Path

path = Path('src/App.jsx')
text = path.read_text(encoding='utf-8')

if 'const movePlayerToTeam = async' in text and 'const [seasonStartDate, setSeasonStartDate]' in text:
    print('Feature patch already applied.')
    raise SystemExit(0)


def replace(old, new, count=1, label='replacement'):
    global text
    found = text.count(old)
    if found < count:
        raise RuntimeError(f'{label}: expected at least {count} occurrence(s), found {found}')
    text = text.replace(old, new, count)
    print(f'Applied {label}')

replace("const APP_VERSION = '2.1.0-r8';", "const APP_VERSION = '2.2.0-r8';", label='version')

replace(
"  const [newTeamLogo, setNewTeamLogo] = useState('🐂');\n",
"  const [newTeamLogo, setNewTeamLogo] = useState('🐂');\n  const [inactivePlayerIds, setInactivePlayerIds] = useState([]);\n  const [seasonStartDate, setSeasonStartDate] = useState(null);\n  const activePlayers = useMemo(() => players.filter(player => !inactivePlayerIds.includes(player.id)), [players, inactivePlayerIds]);\n",
label='season and inactive state')

replace(
"      saveOfflineSnapshot(currentTeamId || 'legacy', { players, playdays, lineups, ratings, training, favoritePositions, suitability, positionPreferences, publishedHalves, keyPositionMultiplier, allocationRules, availability, learningPlayerConfig, satisfactionWeights, playerNotes }).catch(console.error);",
"      saveOfflineSnapshot(currentTeamId || 'legacy', { players, playdays, lineups, ratings, training, favoritePositions, suitability, positionPreferences, publishedHalves, keyPositionMultiplier, allocationRules, availability, learningPlayerConfig, satisfactionWeights, playerNotes, inactivePlayerIds, seasonStartDate }).catch(console.error);",
label='offline snapshot data')

replace(
"  }, [hasLoaded, currentTeamId, players, playdays, lineups, ratings, training, favoritePositions, suitability, positionPreferences, publishedHalves, keyPositionMultiplier, allocationRules, availability, learningPlayerConfig, satisfactionWeights, playerNotes]);",
"  }, [hasLoaded, currentTeamId, players, playdays, lineups, ratings, training, favoritePositions, suitability, positionPreferences, publishedHalves, keyPositionMultiplier, allocationRules, availability, learningPlayerConfig, satisfactionWeights, playerNotes, inactivePlayerIds, seasonStartDate]);",
label='offline snapshot dependencies')

replace(
"    setPlayerNotes(data.playerNotes || {});\n    setHasLoaded(true);",
"    setPlayerNotes(data.playerNotes || {});\n    setInactivePlayerIds(data.inactivePlayerIds || []);\n    setSeasonStartDate(data.seasonStartDate || null);\n    setHasLoaded(true);",
label='offline restore')

# Legacy/single-team loader
replace(
"            setPlayerNotes(rugbyData.playerNotes || {});\n            setRugbyDataId(data.id);",
"            setPlayerNotes(rugbyData.playerNotes || {});\n            setInactivePlayerIds(rugbyData.inactivePlayerIds || []);\n            setSeasonStartDate(rugbyData.seasonStartDate || null);\n            setRugbyDataId(data.id);",
label='legacy load')

# Manual refresh loader
replace(
"        setPlayerNotes(rugbyData.playerNotes || {});\n        setRemoteUpdatedAt(data.updated_at);",
"        setPlayerNotes(rugbyData.playerNotes || {});\n        setInactivePlayerIds(rugbyData.inactivePlayerIds || []);\n        setSeasonStartDate(rugbyData.seasonStartDate || null);\n        setRemoteUpdatedAt(data.updated_at);",
label='manual refresh load')

replace(
"  const syncRelationalRoster = async () => {\n    if (!currentTeamId) return;\n    const rows = players.map(player => ({ id: player.id, name: player.name, mini_year: player.miniYear, created_by: currentUsername || 'coach' }));",
"  const syncRelationalRoster = async () => {\n    if (!currentTeamId) return;\n    const rows = activePlayers.map(player => ({ id: player.id, name: player.name, mini_year: player.miniYear, created_by: currentUsername || 'coach' }));",
label='sync active player rows')
replace("    const currentIds = new Set(players.map(player => player.id));", "    const currentIds = new Set(activePlayers.map(player => player.id));", label='sync current ids')
replace("    const missing = players.filter(player => !linkedIds.has(player.id)).map(player => ({ team_id: currentTeamId, player_id: player.id, added_by: currentUsername || 'coach' }));", "    const missing = activePlayers.filter(player => !linkedIds.has(player.id)).map(player => ({ team_id: currentTeamId, player_id: player.id, added_by: currentUsername || 'coach' }));", label='sync missing active')

replace(
"      const data = { players, playdays, lineups, ratings, training, favoritePositions, suitability, positionPreferences, publishedHalves, keyPositionMultiplier, allocationRules, availability, learningPlayerConfig, satisfactionWeights, playerNotes };",
"      const data = { players, playdays, lineups, ratings, training, favoritePositions, suitability, positionPreferences, publishedHalves, keyPositionMultiplier, allocationRules, availability, learningPlayerConfig, satisfactionWeights, playerNotes, inactivePlayerIds, seasonStartDate };",
label='save new fields')

replace(
"          playerNotes: {}\n        };",
"          playerNotes: {},\n          inactivePlayerIds: [],\n          seasonStartDate: null\n        };",
label='new team defaults')

replace(
"          setAvailability({});\n          setRemoteUpdatedAt(newData.updated_at);",
"          setAvailability({});\n          setInactivePlayerIds([]);\n          setSeasonStartDate(null);\n          setRemoteUpdatedAt(newData.updated_at);",
label='new team state')

replace(
"        setPlayerNotes(rugbyData.data.playerNotes || {});\n        setRemoteUpdatedAt(rugbyData.updated_at);",
"        setPlayerNotes(rugbyData.data.playerNotes || {});\n        setInactivePlayerIds(rugbyData.data.inactivePlayerIds || []);\n        setSeasonStartDate(rugbyData.data.seasonStartDate || null);\n        setRemoteUpdatedAt(rugbyData.updated_at);",
label='team load new fields')

# Add move function after destructive removePlayer and before global player library loader.
needle = "\n  // Load all players from global library\n  const loadAllPlayers = async () => {"
move_fn = r'''

  const movePlayerToTeam = async (playerId, targetTeamId) => {
    const player = players.find(p => p.id === playerId);
    const targetTeam = teams.find(team => team.id === targetTeamId);
    if (!player || !targetTeam || targetTeamId === currentTeamId) return;

    if (hasUnsavedChanges) {
      alert('Please save your current changes before moving a player to another team.');
      return;
    }

    const confirmed = window.confirm(
      `Move ${player.name} from ${getCurrentTeam()?.name || 'this team'} to ${targetTeam.name}?\n\n` +
      'The player profile, ratings, training, suitability, preferences and notes will move with them.\n' +
      'Old matches for the current team remain available as history.'
    );
    if (!confirmed) return;

    const playerScoped = (source) => Object.fromEntries(
      Object.entries(source || {}).filter(([key]) => key.startsWith(`${playerId}-`))
    );

    try {
      setIsSyncing(true);

      const { data: targetRecord, error: targetLoadError } = await supabase
        .from('rugby_data')
        .select('*')
        .eq('team_id', targetTeamId)
        .maybeSingle();
      if (targetLoadError) throw targetLoadError;

      const targetBase = targetRecord?.data || {
        players: [], playdays: [], lineups: {}, ratings: {}, training: {}, favoritePositions: {},
        suitability: {}, positionPreferences: {}, publishedHalves: {}, keyPositionMultiplier: 1.15,
        allocationRules: JSON.parse(JSON.stringify(allocationRules)), availability: {},
        learningPlayerConfig: { ...learningPlayerConfig }, satisfactionWeights: { ...satisfactionWeights },
        playerNotes: {}, inactivePlayerIds: [], seasonStartDate: null
      };

      const targetPlayers = [
        ...(targetBase.players || []).filter(p => p.id !== playerId),
        { id: player.id, name: player.name, miniYear: player.miniYear }
      ];

      const nextTargetData = {
        ...targetBase,
        players: targetPlayers,
        ratings: { ...(targetBase.ratings || {}), ...playerScoped(ratings) },
        training: { ...(targetBase.training || {}), ...playerScoped(training) },
        suitability: { ...(targetBase.suitability || {}), ...playerScoped(suitability) },
        favoritePositions: {
          ...(targetBase.favoritePositions || {}),
          [playerId]: [...(favoritePositions[playerId] || [])]
        },
        positionPreferences: {
          ...(targetBase.positionPreferences || {}),
          [playerId]: { ...(positionPreferences[playerId] || { preference1: null, preference2: null }) }
        },
        playerNotes: {
          ...(targetBase.playerNotes || {}),
          [playerId]: [...(playerNotes[playerId] || [])]
        },
        inactivePlayerIds: (targetBase.inactivePlayerIds || []).filter(id => id !== playerId)
      };

      if (targetRecord) {
        const { error: targetUpdateError } = await supabase
          .from('rugby_data')
          .update({ data: nextTargetData })
          .eq('id', targetRecord.id);
        if (targetUpdateError) throw targetUpdateError;
      } else {
        const { error: targetInsertError } = await supabase
          .from('rugby_data')
          .insert({ team_id: targetTeamId, team_name: targetTeam.name, data: nextTargetData });
        if (targetInsertError) throw targetInsertError;
      }

      const { error: targetLinkError } = await supabase
        .from('team_players')
        .upsert({ team_id: targetTeamId, player_id: playerId, added_by: currentUsername || 'coach' }, { onConflict: 'team_id,player_id' });
      if (targetLinkError) throw targetLinkError;

      const nextInactivePlayerIds = Array.from(new Set([...inactivePlayerIds, playerId]));
      const nextAvailability = { ...availability, [playerId]: 'not-selected' };
      const nextSourceData = {
        players, playdays, lineups, ratings, training, favoritePositions, suitability, positionPreferences,
        publishedHalves, keyPositionMultiplier, allocationRules, availability: nextAvailability,
        learningPlayerConfig, satisfactionWeights, playerNotes,
        inactivePlayerIds: nextInactivePlayerIds,
        seasonStartDate
      };

      const { data: updatedSource, error: sourceUpdateError } = await supabase
        .from('rugby_data')
        .update({ data: nextSourceData })
        .eq('id', rugbyDataId)
        .eq('team_id', currentTeamId)
        .eq('updated_at', remoteUpdatedAt)
        .select()
        .maybeSingle();
      if (sourceUpdateError) throw sourceUpdateError;
      if (!updatedSource) throw new Error('The current team was changed by another coach. Refresh and try the move again.');

      const { error: sourceLinkError } = await supabase
        .from('team_players')
        .delete()
        .eq('team_id', currentTeamId)
        .eq('player_id', playerId);
      if (sourceLinkError) throw sourceLinkError;

      setInactivePlayerIds(nextInactivePlayerIds);
      setAvailability(nextAvailability);
      setRemoteUpdatedAt(updatedSource.updated_at);
      setLastSyncTime(new Date());
      setExpandedPlayer(null);
      await loadAllPlayers();

      logAction('move_player', {
        player_id: playerId,
        player_name: player.name,
        from_team_id: currentTeamId,
        from_team_name: getCurrentTeam()?.name,
        to_team_id: targetTeamId,
        to_team_name: targetTeam.name
      });

      alert(`${player.name} moved to ${targetTeam.name}. Old match history has been kept in ${getCurrentTeam()?.name || 'the previous team'}.`);
    } catch (err) {
      console.error('Error moving player:', err);
      alert(`Error moving player: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };
'''
replace(needle, move_fn + needle, label='move player function')

# Current-season history: keep old lineups, but exclude them from counters/fairness.
needle = "  const benchHistory = useMemo(() => {\n"
season_filter = r'''  const currentSeasonLineups = useMemo(() => {
    if (!seasonStartDate) return lineups;
    const activePlaydayIds = new Set(
      playdays
        .filter(playday => playday.date && playday.date >= seasonStartDate)
        .map(playday => String(playday.id))
    );
    return Object.fromEntries(
      Object.entries(lineups).filter(([key]) => activePlaydayIds.has(String(key).split('-')[0]))
    );
  }, [lineups, playdays, seasonStartDate]);

'''
replace(needle, season_filter + needle, label='season lineup filter')

# The following three history blocks are consecutive and are the only intended first 3 occurrences here.
replace("    Object.values(lineups).forEach(lineup => {", "    Object.values(currentSeasonLineups).forEach(lineup => {", count=3, label='season history counters')

replace(
"  const availablePlayers = useMemo(() => {\n    return players.filter(p => {",
"  const availablePlayers = useMemo(() => {\n    return activePlayers.filter(p => {",
label='available active players')
replace("  }, [players, availability]);", "  }, [activePlayers, availability]);", label='available player dependencies')
replace(
"  const getEligiblePlayersForHalf = (playdayId, matchId, half, mode = 'game') =>\n    players.filter(player => isEligibleForHalf(getHalfStatus(player.id, playdayId, matchId, half), mode));",
"  const getEligiblePlayersForHalf = (playdayId, matchId, half, mode = 'game') =>\n    activePlayers.filter(player => isEligibleForHalf(getHalfStatus(player.id, playdayId, matchId, half), mode));",
label='eligible active players')

replace("            const availablePlayers = players.filter(p => availability[p.id] === 'available');", "            const availablePlayers = activePlayers.filter(p => availability[p.id] === 'available');", label='fair play active players')

# New-season action, persisted immediately while retaining old match history and player development data.
needle = "\n  const ScoreBadge = ({ scores }) => ("
season_fn = r'''

  const startNewSeason = async () => {
    if (hasUnsavedChanges) {
      alert('Please save your current changes before starting a new season.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const chosenDate = window.prompt('Season start date (YYYY-MM-DD):', seasonStartDate || today);
    if (!chosenDate) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(chosenDate)) {
      alert('Please enter a date in YYYY-MM-DD format.');
      return;
    }

    const confirmed = window.confirm(
      `Start a new season on ${chosenDate}?\n\n` +
      'These counters will restart from that date:\n' +
      '• halves played\n• bench appearances\n• times played per position\n• fairness/history counters\n\n' +
      'Ratings, training, suitability, preferences, notes and old match history will NOT be deleted.'
    );
    if (!confirmed) return;

    try {
      setIsSyncing(true);
      const nextData = {
        players, playdays, lineups, ratings, training, favoritePositions, suitability, positionPreferences,
        publishedHalves, keyPositionMultiplier, allocationRules, availability, learningPlayerConfig,
        satisfactionWeights, playerNotes, inactivePlayerIds, seasonStartDate: chosenDate
      };
      const { data: updatedData, error } = await supabase
        .from('rugby_data')
        .update({ data: nextData })
        .eq('id', rugbyDataId)
        .eq('team_id', currentTeamId)
        .eq('updated_at', remoteUpdatedAt)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!updatedData) throw new Error('Another coach changed the team data. Refresh first and try again.');

      setSeasonStartDate(chosenDate);
      setRemoteUpdatedAt(updatedData.updated_at);
      setLastSyncTime(new Date());
      setHasRemoteChanges(false);
      logAction('start_new_season', { season_start_date: chosenDate });
    } catch (err) {
      console.error('Error starting new season:', err);
      alert(`Error starting new season: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };
'''
replace(needle, season_fn + needle, label='new season action')

# Squad header: active roster count + new season control.
replace(
"          <p className=\"text-sm text-gray-500\">{players.length} players · {availablePlayers.length} available</p>",
"          <p className=\"text-sm text-gray-500\">{activePlayers.length} players · {availablePlayers.length} available{seasonStartDate ? ` · stats since ${seasonStartDate}` : ''}</p>",
label='squad season status')
replace(
"        <button onClick={() => { setNewPlayer({ name: '', miniYear: '2nd year' }); setShowAddPlayer(true); }} className=\"flex items-center gap-1.5 text-white px-3 py-2 rounded-xl font-semibold text-sm\" style={{ backgroundColor: DIOK.blue }}><Icons.Plus /> Add</button>",
"        <div className=\"flex items-center gap-2\">\n          <button onClick={startNewSeason} disabled={isSyncing} className=\"px-3 py-2 rounded-xl font-semibold text-xs border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50\" title=\"Restart season statistics without deleting ratings or history\">↻ New Season</button>\n          <button onClick={() => { setNewPlayer({ name: '', miniYear: '2nd year' }); setShowAddPlayer(true); }} className=\"flex items-center gap-1.5 text-white px-3 py-2 rounded-xl font-semibold text-sm\" style={{ backgroundColor: DIOK.blue }}><Icons.Plus /> Add</button>\n        </div>",
label='new season button')
replace("        {[...players].sort((a, b) => a.name.localeCompare(b.name)).map(player => {", "        {[...activePlayers].sort((a, b) => a.name.localeCompare(b.name)).map(player => {", label='squad active players')

# Add move selector next to destructive remove.
old_controls = '''                  {/* Remove Player Button */}
                  <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end">
                    <button
                      onClick={() => removePlayer(player.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-300 rounded-lg text-red-700 text-xs font-medium transition-colors"
                      title="Remove player from this team"
                    >
                      <Icons.Trash />
                      <span>Remove</span>
                    </button>
                  </div>'''
new_controls = '''                  {/* Move / Remove Player */}
                  <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between gap-2">
                    <select
                      defaultValue=""
                      disabled={isSyncing || teams.filter(team => team.id !== currentTeamId).length === 0}
                      onChange={(e) => {
                        const targetTeamId = e.target.value;
                        e.target.value = '';
                        if (targetTeamId) movePlayerToTeam(player.id, targetTeamId);
                      }}
                      className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-blue-700 text-xs font-medium disabled:opacity-50"
                      title="Move player to another team and keep old match history"
                    >
                      <option value="">Move to team…</option>
                      {teams.filter(team => team.id !== currentTeamId).map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => removePlayer(player.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-300 rounded-lg text-red-700 text-xs font-medium transition-colors"
                      title="Permanently remove player data from this team"
                    >
                      <Icons.Trash />
                      <span>Remove</span>
                    </button>
                  </div>'''
replace(old_controls, new_controls, label='move player control')

# Analytics should describe the active roster, not players moved out of the team.
replace("      const playersForPosition = players.map(player => {", "      const playersForPosition = activePlayers.map(player => {", label='analytics position active players')
replace("    const playerVersatility = players.map(player => {", "    const playerVersatility = activePlayers.map(player => {", label='analytics versatility active players')
replace("    const firstYearCount = players.filter(p => p.miniYear === '1st year').length;", "    const firstYearCount = activePlayers.filter(p => p.miniYear === '1st year').length;", label='analytics first year count')
replace("    const secondYearCount = players.filter(p => p.miniYear === '2nd year').length;", "    const secondYearCount = activePlayers.filter(p => p.miniYear === '2nd year').length;", label='analytics second year count')
replace("            <div className=\"text-2xl font-bold\" style={{ color: DIOK.blue }}>{players.length}</div>", "            <div className=\"text-2xl font-bold\" style={{ color: DIOK.blue }}>{activePlayers.length}</div>", label='analytics active total')

# Overview active roster and season-limited cumulative bench ratio.
replace(
"                  const availablePlayers = players.filter(p => {\n                    const avail = availability[p.id];",
"                  const availablePlayers = activePlayers.filter(p => {\n                    const avail = availability[p.id];",
label='overview active players')
replace("                    playdays.forEach(playday => {", "                    playdays.filter(playday => !seasonStartDate || (playday.date && playday.date >= seasonStartDate)).forEach(playday => {", label='overview current season cumulative')

# Backup restore should carry the new team metadata too.
replace(
"                      setAvailability(backupData.data.availability || {});\n\n                      if (backupData.data.learningPlayerConfig)",
"                      setAvailability(backupData.data.availability || {});\n                      setInactivePlayerIds(backupData.data.inactivePlayerIds || []);\n                      setSeasonStartDate(backupData.data.seasonStartDate || null);\n\n                      if (backupData.data.learningPlayerConfig)",
label='backup restore season metadata')

path.write_text(text, encoding='utf-8')
print('Feature patch completed successfully.')
