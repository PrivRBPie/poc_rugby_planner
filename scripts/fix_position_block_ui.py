from pathlib import Path

path = Path('src/App.jsx')
text = path.read_text(encoding='utf-8')

old_help = '<p className="text-[10px] text-gray-400 mb-2">1★ = avoid if possible · 3★ = suitable · 5★ = excellent. Use “Do not play” only for a hard block.</p>'
new_help = '<p className="text-[10px] text-gray-400 mb-2">1★ = avoid if possible · 3★ = suitable · 5★ = excellent. Tick the red × only when a player must not play that position.</p>'
if old_help not in text:
    raise SystemExit('position help text not found')
text = text.replace(old_help, new_help, 1)

old = '''                        <div key={pos.id} className={`relative rounded-xl p-2 text-center border ${trained ? 'bg-white border-gray-200' : 'bg-gray-100 border-gray-100'}`}>
                          <button onClick={() => handleTrainingToggle(player.id, pos.id)} className={`text-[10px] px-2 py-1 rounded-full transition-all w-full mb-1.5 font-medium ${trained ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}>{trained ? '✓ Trained' : 'Not trained'}</button>
                          {trained && <div className="flex justify-center"><StarRating value={rating} onChange={(v) => handleRatingChange(player.id, pos.id, v)} /></div>}
                        </div>'''
new = '''                        <div key={pos.id} className={`relative rounded-xl p-2 text-center border ${trained ? 'bg-white border-gray-200' : 'bg-gray-100 border-gray-100'}`}>
                          <button
                            type="button"
                            onClick={() => toggleDoNotPlayPosition(player.id, pos.id)}
                            aria-pressed={positionSuitability === 10}
                            className={`absolute top-1 right-1 w-5 h-5 rounded-full border flex items-center justify-center text-[11px] font-bold transition-all ${positionSuitability === 10 ? 'bg-red-600 border-red-600 text-white shadow-sm' : 'bg-white border-red-200 text-red-400 hover:bg-red-50 hover:border-red-400'}`}
                            title={positionSuitability === 10 ? 'Do not play here — click to allow again' : 'Tick to block this position'}
                          >
                            ✕
                          </button>
                          <div className="flex items-center justify-center gap-1 mb-1 pr-4">
                            <span className="text-xs font-bold" style={{ color: DIOK.blue }}>#{pos.code}</span>
                            {preferenceRank && <span className="text-[9px] font-bold text-yellow-600">P{preferenceRank}</span>}
                          </div>
                          <div className="text-[10px] text-gray-500 mb-1">{pos.name}</div>
                          {timesPlayed > 0 && <div className="text-[10px] text-emerald-600 mb-1">{timesPlayed}× played</div>}
                          <button onClick={() => handleTrainingToggle(player.id, pos.id)} className={`text-[10px] px-2 py-1 rounded-full transition-all w-full mb-1.5 font-medium ${trained ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}>{trained ? '✓ Trained' : 'Not trained'}</button>
                          {trained && <div className="flex justify-center"><StarRating value={rating} onChange={(v) => handleRatingChange(player.id, pos.id, v)} /></div>}
                        </div>'''
if old not in text:
    raise SystemExit('damaged position card block not found')
text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')
print('Restored position card details and added red cross hard-block control')
