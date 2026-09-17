from pathlib import Path

path = Path('src/App.jsx')
text = path.read_text(encoding='utf-8')

replacements = {
    "return { score: -Infinity, explanations: ['❌ Suitability 10: do not play this position (HARD)'] };":
        "return { score: -Infinity, explanations: ['❌ Do not play this position (HARD block)'] };",
    "const suitabilityNormalized = ({ 0: 10, 1: 100, 2: 65, 3: 30 }[playerSuitability] ?? 0);\n          const strengthNormalized = (ratingNormalized * 0.6) + (suitabilityNormalized * 0.4);":
        "const strengthNormalized = ratingNormalized;",
    "explanations.push(`Skill (${rating}★, suitability ${playerSuitability})${keyMultiplier > 1 ? ` ×${keyMultiplier.toFixed(2)} key position` : \"\"}: ${strengthScore.toFixed(2)} pts`);":
        "explanations.push(`Skill (${rating}★)${keyMultiplier > 1 ? ` ×${keyMultiplier.toFixed(2)} key position` : \"\"}: ${strengthScore.toFixed(2)} pts`);",
    "bestFitCount: playersForPosition.filter(p => p.suitability === 1).length,":
        "bestFitCount: playersForPosition.filter(p => p.rating === 5).length,",
    "Suitability-1 coverage risk at: {weakPositions.map(wp => `#${wp.position.code} ${wp.position.name} (${wp.bestFitCount} best-fit)`).join(', ')}":
        "5-star coverage risk at: {weakPositions.map(wp => `#${wp.position.code} ${wp.position.name} (${wp.bestFitCount} × 5★)`).join(', ')}",
    "Ratings, training, suitability, preferences, notes and old match history will NOT be deleted.":
        "Ratings, training, position blocks, preferences, notes and old match history will NOT be deleted.",
    "const [suitability, setSuitability] = useState({}); // player-position -> 0/1/2/3/10":
        "const [suitability, setSuitability] = useState({}); // legacy profile values; 10 is retained as the hard do-not-play block",
}

for old, new in replacements.items():
    if old not in text:
        raise SystemExit(f'Expected text not found: {old[:80]}')
    text = text.replace(old, new, 1)

path.write_text(text, encoding='utf-8')
print('Refined star-driven scoring and removed user-facing S terminology')
