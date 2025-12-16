import React, { useState, useMemo } from 'react';

// Mini rugby positions (no 6,7,8)
const positions = [
  { id: 1, code: '1', name: 'Loosehead', row: 0 },
  { id: 2, code: '2', name: 'Hooker', row: 0 },
  { id: 3, code: '3', name: 'Tighthead', row: 0 },
  { id: 4, code: '4', name: 'Lock', row: 1 },
  { id: 5, code: '5', name: 'Lock', row: 1 },
  { id: 9, code: '9', name: 'Scrum-half', row: 2 },
  { id: 10, code: '10', name: 'Fly-half', row: 3 },
  { id: 11, code: '11', name: 'Left Wing', row: 4 },
  { id: 12, code: '12', name: 'Inside Centre', row: 4 },
  { id: 13, code: '13', name: 'Outside Centre', row: 4 },
  { id: 14, code: '14', name: 'Right Wing', row: 4 },
  { id: 15, code: '15', name: 'Fullback', row: 5 },
];

const initialPlayers = [
  { id: 1, name: 'Eick Soe', miniYear: '1st year' },
  { id: 2, name: 'Janes Bark', miniYear: '2nd year' },
  { id: 3, name: 'Esca Zand', miniYear: '2nd year' },
  { id: 4, name: 'Huib Schr', miniYear: '1st year' },
  { id: 5, name: 'Dries Wage', miniYear: '1st year' },
  { id: 6, name: 'Liam Hass', miniYear: '2nd year' },
  { id: 7, name: 'Francois Ross', miniYear: '1st year' },
  { id: 8, name: 'Lewis Deel', miniYear: '1st year' },
  { id: 9, name: 'Tobia Conc', miniYear: '1st year' },
  { id: 10, name: 'Alexander Jans', miniYear: '1st year' },
  { id: 11, name: 'Okke Zwaa', miniYear: '1st year' },
  { id: 12, name: 'Rosa On', miniYear: '2nd year' },
  { id: 13, name: 'Yannick Huis', miniYear: '2nd year' },
  { id: 14, name: 'Ot Dubbe', miniYear: '1st year' },
  { id: 15, name: 'Tjalle Kals', miniYear: '1st year' },
  { id: 16, name: 'Chris Klin', miniYear: '2nd year' },
  { id: 17, name: 'Ivan vdWa', miniYear: '1st year' },
  { id: 18, name: 'Edward Serf', miniYear: '1st year' },
  { id: 19, name: 'Teo Gorri', miniYear: '2nd year' },
  { id: 20, name: 'Hedwig Bong', miniYear: '1st year' },
];

const availabilityOptions = [
  { value: 'available', label: 'Available', icon: '✓', color: '#059669', bg: '#d1fae5' },
  { value: 'train-only', label: 'Train Only', icon: '◐', color: '#ca8a04', bg: '#fef9c3' },
  { value: 'injured', label: 'Injured', icon: '✕', color: '#dc2626', bg: '#fee2e2' },
  { value: 'absent', label: 'Absent', icon: '−', color: '#6b7280', bg: '#f3f4f6' },
];

const Icons = {
  Users: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Grid: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  Eye: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Calendar: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Star: ({ filled }) => <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "#eab308" : "none"} stroke={filled ? "#eab308" : "currentColor"} strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Plus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  X: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  ChevronDown: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
  ChevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
  Copy: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Wand: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8L19 13"/><path d="M15 9h0"/><path d="M17.8 6.2L19 5"/><path d="M3 21l9-9"/><path d="M12.2 6.2L11 5"/></svg>,
  Heart: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Zap: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Target: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  AlertTriangle: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
};

const StarRating = ({ value, onChange, readonly = false }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <button key={star} onClick={() => !readonly && onChange?.(star)} disabled={readonly} className={`${readonly ? '' : 'hover:scale-110'} transition-transform`}>
        <Icons.Star filled={star <= value} />
      </button>
    ))}
  </div>
);

const BenchIndicator = ({ count }) => (
  <div className="flex gap-0.5" title={`${count}× on bench`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className={`w-2 h-2 rounded-full ${i <= count ? 'bg-orange-400' : 'bg-gray-200'}`} />
    ))}
  </div>
);

const BottomSheet = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-3xl max-h-[85vh] flex flex-col animate-slideUp shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><Icons.X /></button>
        </div>
        <div className="flex-1 overflow-auto p-4">{children}</div>
      </div>
    </div>
  );
};

const DIOK = { blue: '#1e3a5f', blueLight: '#2d5a87', gray: '#f8fafc' };

export default function RugbyLineupPlanner() {
  const [activeTab, setActiveTab] = useState('schedule');
  const [players] = useState(initialPlayers);
  
  const [playdays, setPlaydays] = useState([
    { id: 1, date: '2025-12-06', name: 'Delft', matches: [
      { id: 1, opponent: 'RRC B', time: '09:30' },
      { id: 2, opponent: 'Delft A', time: '10:00' },
      { id: 3, opponent: 'RRC A', time: '11:00' },
    ]},
    { id: 2, date: '2024-11-29', name: 'Delft', matches: [
      { id: 1, opponent: 'Delft A', time: '09:30' },
      { id: 2, opponent: 'VRC B', time: '10:00' },      
	  { id: 3, opponent: 'VRC A', time: '10:30' },
    ]}
  ]);
  
  const [selectedPlaydayId, setSelectedPlaydayId] = useState(1);
  const selectedPlayday = playdays.find(p => p.id === selectedPlaydayId) || playdays[0];
  
  const [lineups, setLineups] = useState({});
  const [availability, setAvailability] = useState({});
  const [training, setTraining] = useState({
    '1-2': true, '1-1': true, '2-10': true, '2-9': true, '3-9': true, '3-10': true,
    '4-4': true, '4-5': true, '5-11': true, '5-12': true, '6-15': true, '6-14': true,
    '7-13': true, '7-12': true, '8-11': true, '8-14': true, '9-9': true, '9-10': true,
    '10-10': true, '10-9': true, '11-11': true, '11-12': true, '12-12': true, '12-13': true,
    '13-3': true, '13-1': true, '14-4': true, '14-5': true, '15-5': true, '15-4': true,
    '16-15': true, '16-14': true,
  });
  const [ratings, setRatings] = useState({
    '1-2': 5, '1-1': 3, '2-10': 5, '2-9': 4, '3-9': 4, '3-10': 3, '4-4': 4, '4-5': 4,
    '5-11': 4, '5-12': 3, '6-15': 5, '6-14': 3, '7-13': 4, '7-12': 2, '8-11': 4, '8-14': 2,
    '9-9': 5, '9-10': 3, '10-10': 4, '10-9': 2, '11-11': 4, '11-12': 2, '12-12': 4, '12-13': 2,
    '13-3': 3, '13-1': 2, '14-4': 4, '14-5': 3, '15-5': 3, '15-4': 2, '16-15': 3, '16-14': 2,
  });
  
  // Two favorite positions per player
  const [favoritePositions, setFavoritePositions] = useState({
    1: [2, 1], 2: [10, 9], 3: [9], 4: [4, 5], 5: [11, 12], 6: [15, 14],
    7: [13, 12], 8: [11], 9: [9, 10], 10: [10, 9], 11: [11, 14], 12: [12, 13],
  });
  
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showAddPlayday, setShowAddPlayday] = useState(false);
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [newPlayer, setNewPlayer] = useState({ name: '', miniYear: '1st year' });
  const [newPlayday, setNewPlayday] = useState({ date: '', name: '' });
  const [newMatch, setNewMatch] = useState({ opponent: '', time: '' });
  const [settings] = useState({ coachName: 'Coach Murphy', teamName: 'Bulls Minis', ageGroup: 'U10' });
  const [expandedPlayer, setExpandedPlayer] = useState(null);
  const [expandedHalf, setExpandedHalf] = useState(null);

  const tabs = [
    { id: 'schedule', label: 'Schedule', icon: <Icons.Calendar /> },
    { id: 'squad', label: 'Squad', icon: <Icons.Users /> },
    { id: 'lineup', label: 'Lineup', icon: <Icons.Grid /> },
    { id: 'overview', label: 'Overview', icon: <Icons.Eye /> },
  ];

  const BENCH_SIZE = 5;
  
  const allHalves = useMemo(() => {
    if (!selectedPlayday) return [];
    return selectedPlayday.matches.flatMap(m => [
      { matchId: m.id, half: 1, opponent: m.opponent, time: m.time, key: `${selectedPlayday.id}-${m.id}-1` },
      { matchId: m.id, half: 2, opponent: m.opponent, time: m.time, key: `${selectedPlayday.id}-${m.id}-2` },
    ]);
  }, [selectedPlayday]);

  const isFavoritePosition = (playerId, positionId) => (favoritePositions[playerId] || []).includes(positionId);

  const toggleFavoritePosition = (playerId, positionId) => {
    setFavoritePositions(prev => {
      const current = prev[playerId] || [];
      if (current.includes(positionId)) {
        return { ...prev, [playerId]: current.filter(id => id !== positionId) };
      } else if (current.length < 2) {
        return { ...prev, [playerId]: [...current, positionId] };
      } else {
        return { ...prev, [playerId]: [current[0], positionId] };
      }
    });
  };

  const benchHistory = useMemo(() => {
    const counts = {};
    players.forEach(p => counts[p.id] = 0);
    Object.values(lineups).forEach(lineup => {
      (lineup.bench || []).forEach(playerId => {
        if (playerId) counts[playerId] = (counts[playerId] || 0) + 1;
      });
    });
    return counts;
  }, [lineups, players]);

  const fieldHistory = useMemo(() => {
    const counts = {};
    players.forEach(p => counts[p.id] = 0);
    Object.values(lineups).forEach(lineup => {
      Object.values(lineup.assignments || {}).forEach(playerId => {
        if (playerId) counts[playerId] = (counts[playerId] || 0) + 1;
      });
    });
    return counts;
  }, [lineups, players]);

  const playerPositionCounts = useMemo(() => {
    const counts = {};
    Object.values(lineups).forEach(lineup => {
      Object.entries(lineup.assignments || {}).forEach(([posId, playerId]) => {
        if (!playerId) return;
        if (!counts[playerId]) counts[playerId] = {};
        counts[playerId][posId] = (counts[playerId][posId] || 0) + 1;
      });
    });
    return counts;
  }, [lineups]);

  const availablePlayers = useMemo(() => {
    return players.filter(p => {
      const status = availability[p.id] || 'available';
      return status === 'available' || status === 'train-only';
    });
  }, [players, availability]);

  const calculateScores = (playdayId, matchId, half) => {
    const key = `${playdayId}-${matchId}-${half}`;
    const lineup = lineups[key] || { assignments: {}, bench: [] };
    let happinessScore = 0, strengthScore = 0, trainingCount = 0, maxHappiness = 0, maxStrength = 0;
    
    Object.entries(lineup.assignments).forEach(([posId, playerId]) => {
      if (!playerId) return;
      const ratingKey = `${playerId}-${posId}`;
      const rating = ratings[ratingKey] || 0;
      const isPreferred = isFavoritePosition(playerId, parseInt(posId));
      const timesPlayed = playerPositionCounts[playerId]?.[posId] || 0;
      const trained = training[ratingKey];
      
      strengthScore += rating;
      maxStrength += 5;
      if (isPreferred) happinessScore += 1;
      maxHappiness += 1;
      if (trained && (rating < 3 || timesPlayed === 0)) trainingCount += 1;
    });
    
    return {
      happiness: maxHappiness > 0 ? Math.round((happinessScore / maxHappiness) * 100) : 0,
      strength: maxStrength > 0 ? Math.round((strengthScore / maxStrength) * 100) : 0,
      training: trainingCount,
      filled: Object.keys(lineup.assignments).length,
      bench: lineup.bench?.length || 0,
    };
  };

  const getAssignedInHalf = (playdayId, matchId, half) => {
    const key = `${playdayId}-${matchId}-${half}`;
    const lineup = lineups[key] || { assignments: {}, bench: [] };
    const assigned = new Set(Object.values(lineup.assignments).filter(Boolean));
    (lineup.bench || []).forEach(id => assigned.add(id));
    return assigned;
  };

  const getCandidates = (playdayId, matchId, half, positionId, forBench = false) => {
    const assignedInHalf = getAssignedInHalf(playdayId, matchId, half);
    const key = `${playdayId}-${matchId}-${half}`;
    const lineup = lineups[key] || { assignments: {}, bench: [] };
    
    return availablePlayers.map(p => {
      const trainingKey = `${p.id}-${positionId}`;
      const trained = training[trainingKey] || false;
      const rating = trained ? (ratings[trainingKey] || 0) : 0;
      const isPreferred = isFavoritePosition(p.id, positionId);
      const benchCount = benchHistory[p.id] || 0;
      const fieldCount = fieldHistory[p.id] || 0;
      const timesAtPosition = playerPositionCounts[p.id]?.[positionId] || 0;
      const isAssignedElsewhereInHalf = assignedInHalf.has(p.id) && 
        (forBench ? !lineup.bench?.includes(p.id) : lineup.assignments[positionId] !== p.id);
      const isCurrentlyHere = forBench ? lineup.bench?.includes(p.id) : lineup.assignments[positionId] === p.id;
      
      let score = 1000;
      if (forBench) score = benchCount * 100 - fieldCount * 10;
      else if (trained) score = 100 - (rating * 10) - (isPreferred ? 50 : 0);
      
      return { ...p, trained, rating, isPreferred, benchCount, fieldCount, timesAtPosition, isAssignedElsewhereInHalf, isCurrentlyHere, score };
    }).sort((a, b) => {
      if (a.isCurrentlyHere !== b.isCurrentlyHere) return a.isCurrentlyHere ? -1 : 1;
      if (a.isAssignedElsewhereInHalf !== b.isAssignedElsewhereInHalf) return a.isAssignedElsewhereInHalf ? 1 : -1;
      if (!forBench && a.trained !== b.trained) return a.trained ? -1 : 1;
      return a.score - b.score;
    });
  };

  const splitCandidates = (candidates, forBench) => {
    if (forBench) return { best: candidates, alternatives: [] };
    const trained = candidates.filter(c => c.trained && !c.isAssignedElsewhereInHalf);
    return {
      best: trained.filter(c => c.rating >= 3 || c.timesAtPosition > 0),
      alternatives: trained.filter(c => c.rating < 3 && c.timesAtPosition === 0),
    };
  };

  const updateLineup = (playdayId, matchId, half, fn) => {
    const key = `${playdayId}-${matchId}-${half}`;
    setLineups(prev => ({ ...prev, [key]: fn(prev[key] || { assignments: {}, bench: [] }) }));
  };

  const copyPreviousLineup = (playdayId, matchId, half) => {
    const currentIndex = allHalves.findIndex(h => h.matchId === matchId && h.half === half);
    if (currentIndex <= 0) return;
    const prevHalf = allHalves[currentIndex - 1];
    const prevKey = `${playdayId}-${prevHalf.matchId}-${prevHalf.half}`;
    const prevLineup = lineups[prevKey];
    if (prevLineup) {
      const key = `${playdayId}-${matchId}-${half}`;
      setLineups(prev => ({ ...prev, [key]: { assignments: { ...prevLineup.assignments }, bench: [...(prevLineup.bench || [])] } }));
    }
  };

  const proposeLineup = (playdayId, matchId, half) => {
    const assigned = new Set();
    const newAssignments = {};
    const newBench = [];
    
    const sortedByFairness = [...availablePlayers].sort((a, b) => (fieldHistory[a.id] || 0) - (fieldHistory[b.id] || 0));
    
    positions.forEach(pos => {
      const candidates = sortedByFairness
        .filter(p => !assigned.has(p.id) && training[`${p.id}-${pos.id}`])
        .sort((a, b) => {
          const aScore = (ratings[`${a.id}-${pos.id}`] || 0) + (isFavoritePosition(a.id, pos.id) ? 10 : 0);
          const bScore = (ratings[`${b.id}-${pos.id}`] || 0) + (isFavoritePosition(b.id, pos.id) ? 10 : 0);
          return bScore - aScore;
        });
      if (candidates.length > 0) {
        newAssignments[pos.id] = candidates[0].id;
        assigned.add(candidates[0].id);
      }
    });
    
    sortedByFairness.filter(p => !assigned.has(p.id)).slice(0, BENCH_SIZE).forEach(p => {
      newBench.push(p.id);
      assigned.add(p.id);
    });
    
    const key = `${playdayId}-${matchId}-${half}`;
    setLineups(prev => ({ ...prev, [key]: { assignments: newAssignments, bench: newBench } }));
  };

  const handleAssignPlayer = (playerId) => {
    if (!selectedPosition) return;
    const { playdayId, matchId, half, posId, isBench } = selectedPosition;
    const assignedInHalf = getAssignedInHalf(playdayId, matchId, half);
    const key = `${playdayId}-${matchId}-${half}`;
    const lineup = lineups[key] || { assignments: {}, bench: [] };
    const isCurrentlyHere = isBench ? lineup.bench?.includes(playerId) : lineup.assignments[posId] === playerId;
    
    if (assignedInHalf.has(playerId) && !isCurrentlyHere) {
      alert('⚠️ This player is already assigned in this half!');
      return;
    }
    
    updateLineup(playdayId, matchId, half, (prev) => {
      const newAssignments = { ...prev.assignments };
      let newBench = [...(prev.bench || [])];
      Object.keys(newAssignments).forEach(k => { if (newAssignments[k] === playerId) delete newAssignments[k]; });
      newBench = newBench.filter(id => id !== playerId);
      if (isBench) { if (newBench.length < BENCH_SIZE) newBench.push(playerId); }
      else newAssignments[posId] = playerId;
      return { ...prev, assignments: newAssignments, bench: newBench };
    });
  };

  const handleClearPosition = () => {
    if (!selectedPosition) return;
    const { playdayId, matchId, half, posId, isBench, benchIndex } = selectedPosition;
    updateLineup(playdayId, matchId, half, (prev) => {
      if (isBench) {
        const newBench = [...(prev.bench || [])];
        newBench.splice(benchIndex, 1);
        return { ...prev, bench: newBench };
      } else {
        const newAssignments = { ...prev.assignments };
        delete newAssignments[posId];
        return { ...prev, assignments: newAssignments };
      }
    });
  };

  const handleTrainingToggle = (playerId, positionId) => {
    const key = `${playerId}-${positionId}`;
    setTraining(t => {
      const newT = { ...t };
      if (newT[key]) { delete newT[key]; setRatings(r => { const nr = {...r}; delete nr[key]; return nr; }); }
      else newT[key] = true;
      return newT;
    });
  };

  const handleRatingChange = (playerId, positionId, value) => {
    const key = `${playerId}-${positionId}`;
    if (!training[key]) return;
    setRatings(r => ({ ...r, [key]: value }));
  };

  const handleAvailabilityChange = (playerId, status) => setAvailability(a => ({ ...a, [playerId]: status }));

  const addPlayday = () => {
    if (!newPlayday.date || !newPlayday.name) return;
    const id = Math.max(0, ...playdays.map(p => p.id)) + 1;
    setPlaydays([...playdays, { id, date: newPlayday.date, name: newPlayday.name, matches: [] }]);
    setNewPlayday({ date: '', name: '' });
    setShowAddPlayday(false);
  };

  const deletePlayday = (id) => {
    if (playdays.length <= 1) return;
    setPlaydays(playdays.filter(p => p.id !== id));
    if (selectedPlaydayId === id) setSelectedPlaydayId(playdays.find(p => p.id !== id)?.id || 1);
  };

  const addMatch = () => {
    if (!newMatch.opponent || !newMatch.time) return;
    setPlaydays(playdays.map(p => {
      if (p.id !== selectedPlaydayId) return p;
      const matchId = Math.max(0, ...p.matches.map(m => m.id)) + 1;
      return { ...p, matches: [...p.matches, { id: matchId, opponent: newMatch.opponent, time: newMatch.time }] };
    }));
    setNewMatch({ opponent: '', time: '' });
    setShowAddMatch(false);
  };

  const deleteMatch = (matchId) => {
    setPlaydays(playdays.map(p => p.id !== selectedPlaydayId ? p : { ...p, matches: p.matches.filter(m => m.id !== matchId) }));
  };

  const getPositionHistoryText = (playerId) => {
    const counts = playerPositionCounts[playerId];
    if (!counts || Object.keys(counts).length === 0) return 'No match history';
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([posId, count]) => {
      const pos = positions.find(p => p.id === parseInt(posId));
      return `${count}× ${pos?.name || '#' + posId}`;
    }).join(', ');
  };

  const ScoreBadge = ({ scores }) => (
    <div className="flex items-center gap-2 text-[10px]">
      <div className="flex items-center gap-0.5" title="Happiness"><span className="text-pink-500"><Icons.Heart /></span><span className="font-semibold text-gray-600">{scores.happiness}%</span></div>
      <div className="flex items-center gap-0.5" title="Strength"><span className="text-amber-500"><Icons.Zap /></span><span className="font-semibold text-gray-600">{scores.strength}%</span></div>
      <div className="flex items-center gap-0.5" title="Training"><span className="text-blue-500"><Icons.Target /></span><span className="font-semibold text-gray-600">{scores.training}</span></div>
    </div>
  );

  // ==================== SCHEDULE VIEW ====================
  const ScheduleView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-gray-900">Schedule</h2><p className="text-sm text-gray-500">{playdays.length} playday{playdays.length !== 1 ? 's' : ''}</p></div>
        <button onClick={() => setShowAddPlayday(true)} className="flex items-center gap-1.5 text-white px-3 py-2 rounded-xl font-semibold text-sm" style={{ backgroundColor: DIOK.blue }}><Icons.Plus /> Add Playday</button>
      </div>
      <div className="space-y-3">
        {playdays.map(playday => {
          const isSelected = playday.id === selectedPlaydayId;
          const totalHalves = playday.matches.length * 2;
          const filledHalves = playday.matches.reduce((acc, m) => {
            const h1 = lineups[`${playday.id}-${m.id}-1`];
            const h2 = lineups[`${playday.id}-${m.id}-2`];
            return acc + (h1?.assignments && Object.keys(h1.assignments).length === 12 ? 1 : 0) + (h2?.assignments && Object.keys(h2.assignments).length === 12 ? 1 : 0);
          }, 0);
          
          return (
            <div key={playday.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${isSelected ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200'}`}>
              <div className={`p-4 cursor-pointer ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`} onClick={() => setSelectedPlaydayId(playday.id)}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white font-bold shrink-0" style={{ backgroundColor: DIOK.blue }}>
                    <span className="text-lg">{new Date(playday.date).getDate()}</span>
                    <span className="text-[9px] opacity-80">{new Date(playday.date).toLocaleDateString('en', { month: 'short' })}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900">{playday.name}</div>
                    <div className="text-sm text-gray-500">{playday.date} · {playday.matches.length} match{playday.matches.length !== 1 ? 'es' : ''}</div>
                    <div className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${filledHalves === totalHalves && totalHalves > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{filledHalves}/{totalHalves} halves ready</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSelected && <span className="text-xs text-blue-600 font-medium">Selected</span>}
                    <button onClick={(e) => { e.stopPropagation(); deletePlayday(playday.id); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" disabled={playdays.length <= 1}><Icons.Trash /></button>
                    <Icons.ChevronRight />
                  </div>
                </div>
              </div>
              {isSelected && (
                <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between mt-3 mb-2">
                    <span className="text-sm font-semibold text-gray-700">Matches</span>
                    <button onClick={() => setShowAddMatch(true)} className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"><Icons.Plus /> Add Match</button>
                  </div>
                  {playday.matches.length === 0 ? <div className="text-sm text-gray-400 text-center py-4">No matches yet</div> : (
                    <div className="space-y-2">
                      {playday.matches.map((match, idx) => (
                        <div key={match.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-200">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: DIOK.blueLight }}>M{idx + 1}</div>
                          <div className="flex-1"><div className="font-medium text-gray-900">vs. {match.opponent}</div><div className="text-xs text-gray-500">{match.time}</div></div>
                          <button onClick={() => deleteMatch(match.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Icons.Trash /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => setActiveTab('lineup')} className="w-full mt-3 py-2 rounded-xl font-semibold text-white text-sm" style={{ backgroundColor: DIOK.blue }} disabled={playday.matches.length === 0}>Edit Lineups →</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ==================== SQUAD VIEW ====================
  const SquadView = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-gray-900">Squad</h2><p className="text-sm text-gray-500">{players.length} players · {availablePlayers.length} available</p></div>
        <button onClick={() => setShowAddPlayer(true)} className="flex items-center gap-1.5 text-white px-3 py-2 rounded-xl font-semibold text-sm" style={{ backgroundColor: DIOK.blue }}><Icons.Plus /> Add</button>
      </div>
      <div className="space-y-2">
        {players.map(player => {
          const playerAvail = availability[player.id] || 'available';
          const isExpanded = expandedPlayer === player.id;
          const favPositions = favoritePositions[player.id] || [];
          const benchCount = benchHistory[player.id] || 0;
          const fieldCount = fieldHistory[player.id] || 0;
          
          return (
            <div key={player.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedPlayer(isExpanded ? null : player.id)}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white" style={{ backgroundColor: DIOK.blue }}>{player.name.split(' ').map(n => n[0]).join('')}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{player.name}</span>
                    {favPositions.length > 0 && (
                      <div className="flex items-center gap-1">
                        {favPositions.map(posId => {
                          const pos = positions.find(p => p.id === posId);
                          return pos ? <span key={posId} className="flex items-center gap-0.5 text-xs text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded"><Icons.Star filled /> #{pos.code}</span> : null;
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-400">{player.miniYear}</span>
                    <span className="text-xs text-emerald-600">{fieldCount} halves</span>
                    <span className="text-xs text-orange-500">{benchCount}× bench</span>
                  </div>
                  <div className="text-[11px] text-gray-400 truncate">{getPositionHistoryText(player.id)}</div>
                </div>
                <div className="flex gap-1">
                  {availabilityOptions.map(opt => (
                    <button key={opt.value} onClick={(e) => { e.stopPropagation(); handleAvailabilityChange(player.id, opt.value); }}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all border ${playerAvail === opt.value ? 'ring-2 ring-offset-1' : 'opacity-40 hover:opacity-70'}`}
                      style={{ backgroundColor: opt.bg, color: opt.color, borderColor: playerAvail === opt.value ? opt.color : 'transparent' }} title={opt.label}>{opt.icon}</button>
                  ))}
                </div>
                <div className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}><Icons.ChevronDown /></div>
              </div>
              {isExpanded && (
                <div className="px-3 pb-3 border-t border-gray-100 bg-gray-50">
                  <div className="text-xs font-medium text-gray-500 mt-3 mb-1">Favorite Positions (select up to 2)</div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {positions.map(pos => {
                      const isFav = isFavoritePosition(player.id, pos.id);
                      const favIndex = favPositions.indexOf(pos.id);
                      return (
                        <button key={pos.id} onClick={() => toggleFavoritePosition(player.id, pos.id)}
                          className={`px-2 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${isFav ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'}`}>
                          {isFav && <span className="text-yellow-500">{favIndex === 0 ? '★' : '☆'}</span>}#{pos.code}
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-xs font-medium text-gray-500 mb-2">Position Training & Ratings</div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {positions.map(pos => {
                      const key = `${player.id}-${pos.id}`;
                      const trained = training[key];
                      const rating = ratings[key] || 0;
                      const isFav = isFavoritePosition(player.id, pos.id);
                      const timesPlayed = playerPositionCounts[player.id]?.[pos.id] || 0;
                      return (
                        <div key={pos.id} className={`rounded-xl p-2 text-center border ${trained ? 'bg-white border-gray-200' : 'bg-gray-100 border-gray-100'}`}>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <span className="text-xs font-bold" style={{ color: DIOK.blue }}>#{pos.code}</span>
                            {isFav && <Icons.Star filled />}
                          </div>
                          <div className="text-[10px] text-gray-500 mb-1">{pos.name}</div>
                          {timesPlayed > 0 && <div className="text-[10px] text-emerald-600 mb-1">{timesPlayed}× played</div>}
                          <button onClick={() => handleTrainingToggle(player.id, pos.id)} className={`text-[10px] px-2 py-1 rounded-full transition-all w-full mb-1.5 font-medium ${trained ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}>{trained ? '✓ Trained' : 'Not trained'}</button>
                          {trained && <div className="flex justify-center"><StarRating value={rating} onChange={(v) => handleRatingChange(player.id, pos.id, v)} /></div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ==================== LINEUP VIEW ====================
  const LineupView = () => {
    if (!selectedPlayday || selectedPlayday.matches.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="font-semibold text-gray-900 mb-2">No matches scheduled</h3>
          <p className="text-sm text-gray-500 mb-4">Add matches first</p>
          <button onClick={() => setActiveTab('schedule')} className="px-4 py-2 rounded-xl font-semibold text-white text-sm" style={{ backgroundColor: DIOK.blue }}>Go to Schedule</button>
        </div>
      );
    }

    const PositionBox = ({ pos, player, benchIndex }) => {
      const isPreferred = player ? isFavoritePosition(player.id, pos?.id) : false;
      const isBench = benchIndex !== undefined;
      return (
        <div className="flex flex-col items-center">
          <div className="text-[7px] text-gray-400 font-medium mb-0.5">{isBench ? `B${benchIndex + 1}` : `#${pos?.code}`}</div>
          <div className={`w-6 h-6 rounded text-[7px] flex flex-col items-center justify-center font-bold ${player ? (isBench ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700') : 'bg-gray-100 text-gray-400'}`}>
            {player ? player.name.split(' ').map(n => n[0]).join('') : '–'}
          </div>
          {isPreferred && !isBench && <span className="text-[6px] text-yellow-500 -mt-0.5">★</span>}
        </div>
      );
    };

    const renderCollapsedView = (matchId, half) => {
      const key = `${selectedPlayday.id}-${matchId}-${half}`;
      const lineup = lineups[key] || { assignments: {}, bench: [] };
      return (
        <div className="flex flex-wrap gap-0.5 items-end">
          {positions.map(pos => <PositionBox key={pos.id} pos={pos} player={players.find(p => p.id === lineup.assignments[pos.id])} />)}
          <div className="w-px h-6 bg-gray-300 mx-1 self-end mb-0.5" />
          {Array.from({ length: BENCH_SIZE }).map((_, idx) => <PositionBox key={`bench-${idx}`} player={players.find(p => p.id === lineup.bench?.[idx])} benchIndex={idx} />)}
        </div>
      );
    };

    const renderExpandedView = (matchId, half) => {
      const key = `${selectedPlayday.id}-${matchId}-${half}`;
      const lineup = lineups[key] || { assignments: {}, bench: [] };
      const halfIndex = allHalves.findIndex(h => h.matchId === matchId && h.half === half);
      const candidates = selectedPosition?.playdayId === selectedPlayday.id && selectedPosition?.matchId === matchId && selectedPosition?.half === half
        ? getCandidates(selectedPlayday.id, matchId, half, selectedPosition.posId, selectedPosition.isBench) : [];
      const { best, alternatives } = splitCandidates(candidates, selectedPosition?.isBench);

      const PosButton = ({ pos }) => {
        const assignedPlayer = players.find(p => p.id === lineup.assignments[pos.id]);
        const isSelected = selectedPosition?.playdayId === selectedPlayday.id && selectedPosition?.matchId === matchId && selectedPosition?.half === half && selectedPosition?.posId === pos.id && !selectedPosition?.isBench;
        const rating = assignedPlayer ? (ratings[`${assignedPlayer.id}-${pos.id}`] || 0) : 0;
        const isPreferred = assignedPlayer ? isFavoritePosition(assignedPlayer.id, pos.id) : false;
        return (
          <button onClick={() => setSelectedPosition(isSelected ? null : { playdayId: selectedPlayday.id, matchId, half, posId: pos.id, isBench: false })}
            className={`relative flex flex-col items-center justify-center rounded-xl transition-all ${isSelected ? 'ring-2 ring-yellow-400 scale-105 bg-white/30' : assignedPlayer ? 'bg-white/20 hover:bg-white/30' : 'bg-white/10 border border-dashed border-white/30 hover:bg-white/20'}`}
            style={{ width: '44px', height: '44px' }}>
            <span className="text-[10px] font-bold text-yellow-300">#{pos.code}</span>
            {assignedPlayer ? (
              <>
                <div className="w-5 h-5 rounded-full bg-white/90 flex items-center justify-center text-[8px] font-bold text-gray-800">{assignedPlayer.name.split(' ').map(n => n[0]).join('')}</div>
                <div className="flex items-center gap-0.5">{isPreferred && <span className="text-yellow-300 text-[7px]">★</span>}<span className="text-[6px] text-white/70">{'★'.repeat(Math.min(rating, 3))}</span></div>
              </>
            ) : <span className="text-[8px] text-white/50">tap</span>}
          </button>
        );
      };

      const BenchButton = ({ idx }) => {
        const playerId = lineup.bench?.[idx];
        const player = players.find(p => p.id === playerId);
        const isSelected = selectedPosition?.playdayId === selectedPlayday.id && selectedPosition?.matchId === matchId && selectedPosition?.half === half && selectedPosition?.isBench && selectedPosition?.benchIndex === idx;
        const benchCount = player ? benchHistory[player.id] : 0;
        return (
          <button onClick={() => setSelectedPosition(isSelected ? null : { playdayId: selectedPlayday.id, matchId, half, posId: null, isBench: true, benchIndex: idx })}
            className={`flex flex-col items-center justify-center rounded-xl transition-all ${isSelected ? 'ring-2 ring-yellow-400 scale-105 bg-white/30' : player ? 'bg-white/20 hover:bg-white/30' : 'bg-white/10 border border-dashed border-white/30 hover:bg-white/20'}`}
            style={{ width: '40px', height: '44px' }}>
            <span className="text-[9px] font-bold text-white/60">B{idx + 1}</span>
            {player ? (
              <>
                <div className="w-5 h-5 rounded-full bg-white/90 flex items-center justify-center text-[7px] font-bold text-gray-800">{player.name.split(' ').map(n => n[0]).join('')}</div>
                <div className="flex gap-0.5 mt-0.5">{[1,2,3].map(i => <div key={i} className={`w-1 h-1 rounded-full ${i <= benchCount ? 'bg-orange-400' : 'bg-white/30'}`} />)}</div>
              </>
            ) : <span className="text-[7px] text-white/40">tap</span>}
          </button>
        );
      };

      const PlayerRow = ({ p, onClick, isAlt, forBench }) => (
        <button onClick={onClick} disabled={p.isAssignedElsewhereInHalf}
          className={`w-full text-left p-1.5 rounded-lg transition-all border text-xs ${p.isCurrentlyHere ? 'bg-blue-50 border-blue-300' : p.isAssignedElsewhereInHalf ? 'bg-gray-100 border-gray-200 opacity-40 cursor-not-allowed' : isAlt ? 'bg-amber-50 border-amber-200 hover:bg-amber-100' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: DIOK.blue }}>{p.name.split(' ').map(n => n[0]).join('')}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1"><span className="font-medium text-gray-900 truncate">{p.name.split(' ')[0]}</span>{p.isPreferred && !forBench && <span className="text-yellow-500">★</span>}</div>
              {forBench ? <BenchIndicator count={p.benchCount} /> : <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <span key={s} className={`text-[9px] ${s <= p.rating ? 'text-yellow-500' : 'text-gray-300'}`}>★</span>)}{p.timesAtPosition > 0 && <span className="text-[9px] text-gray-400 ml-1">{p.timesAtPosition}×</span>}</div>}
            </div>
          </div>
          {p.isAssignedElsewhereInHalf && <div className="text-[9px] text-red-500 flex items-center gap-0.5 mt-0.5"><Icons.AlertTriangle /> Already assigned</div>}
        </button>
      );

      return (
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => copyPreviousLineup(selectedPlayday.id, matchId, half)} disabled={halfIndex === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${halfIndex === 0 ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
              <Icons.Copy /> Copy Previous
            </button>
            <button onClick={() => proposeLineup(selectedPlayday.id, matchId, half)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 transition-colors">
              <Icons.Wand /> Auto Propose
            </button>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 bg-gradient-to-b from-emerald-600 to-emerald-700 rounded-2xl p-4 shadow-lg">
              <div className="text-center text-[8px] text-white/50 mb-3 tracking-wider">▲ ATTACK</div>
              <div className="flex justify-center gap-2 mb-3">{positions.filter(p => p.row === 0).map(pos => <PosButton key={pos.id} pos={pos} />)}</div>
              <div className="flex justify-center gap-6 mb-3">{positions.filter(p => p.row === 1).map(pos => <PosButton key={pos.id} pos={pos} />)}</div>
              <div className="flex justify-center mb-2">{positions.filter(p => p.row === 2).map(pos => <PosButton key={pos.id} pos={pos} />)}</div>
              <div className="flex justify-center mb-3">{positions.filter(p => p.row === 3).map(pos => <PosButton key={pos.id} pos={pos} />)}</div>
              <div className="flex justify-center gap-1 mb-3">{positions.filter(p => p.row === 4).map(pos => <PosButton key={pos.id} pos={pos} />)}</div>
              <div className="flex justify-center mb-3">{positions.filter(p => p.row === 5).map(pos => <PosButton key={pos.id} pos={pos} />)}</div>
              <div className="border-t border-white/40 my-3 mx-4" />
              <div className="flex justify-center gap-1">{Array.from({ length: BENCH_SIZE }).map((_, idx) => <BenchButton key={idx} idx={idx} />)}</div>
            </div>
            <div className="w-44 bg-white rounded-2xl border border-gray-200 p-2 flex flex-col max-h-[480px] shadow-sm">
              {selectedPosition?.playdayId === selectedPlayday.id && selectedPosition?.matchId === matchId && selectedPosition?.half === half ? (
                <>
                  <div className="text-xs font-bold mb-1 px-1" style={{ color: DIOK.blue }}>{selectedPosition.isBench ? `Bench ${selectedPosition.benchIndex + 1}` : `#${positions.find(p => p.id === selectedPosition.posId)?.code} ${positions.find(p => p.id === selectedPosition.posId)?.name}`}</div>
                  {(selectedPosition.isBench ? lineup.bench?.[selectedPosition.benchIndex] : lineup.assignments[selectedPosition.posId]) && <button onClick={handleClearPosition} className="mb-2 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 border border-red-200">Clear</button>}
                  <div className="flex-1 overflow-auto">
                    {best.length > 0 && <div className="mb-2"><div className="text-[10px] font-semibold text-emerald-600 mb-1 px-1">✓ Best Matches</div><div className="space-y-1">{best.slice(0, 5).map(p => <PlayerRow key={p.id} p={p} onClick={() => handleAssignPlayer(p.id)} />)}</div></div>}
                    {alternatives.length > 0 && <div><div className="text-[10px] font-semibold text-amber-600 mb-1 px-1">◐ Alternatives</div><div className="space-y-1">{alternatives.map(p => <PlayerRow key={p.id} p={p} onClick={() => handleAssignPlayer(p.id)} isAlt />)}</div></div>}
                    {selectedPosition.isBench && best.filter(p => !p.isAssignedElsewhereInHalf).length > 0 && <div className="space-y-1">{best.filter(p => !p.isAssignedElsewhereInHalf).slice(0, 8).map(p => <PlayerRow key={p.id} p={p} onClick={() => handleAssignPlayer(p.id)} forBench />)}</div>}
                    {!selectedPosition.isBench && best.length === 0 && alternatives.length === 0 && <div className="text-xs text-gray-400 text-center p-4">No trained players</div>}
                  </div>
                </>
              ) : <div className="flex-1 flex items-center justify-center text-xs text-gray-400 text-center p-2">← Tap position</div>}
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-3">
        <div><h2 className="text-lg font-bold text-gray-900">{selectedPlayday.name}</h2><p className="text-xs text-gray-500">{selectedPlayday.date} · {selectedPlayday.matches.length} matches</p></div>
        <div className="space-y-2">
          {allHalves.map(({ matchId, half, opponent, time, key }) => {
            const isExpanded = expandedHalf === key;
            const scores = calculateScores(selectedPlayday.id, matchId, half);
            return (
              <div key={key} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${isExpanded ? 'border-blue-300' : 'border-gray-200'}`}>
                <div className={`p-3 cursor-pointer ${isExpanded ? 'bg-blue-50' : 'hover:bg-gray-50'}`} onClick={() => setExpandedHalf(isExpanded ? null : key)}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center text-white font-bold shrink-0 ${scores.filled === 12 ? 'bg-emerald-500' : ''}`} style={{ backgroundColor: scores.filled === 12 ? undefined : DIOK.blue }}>
                      <span className="text-sm">M{matchId}</span><span className="text-[9px] opacity-80">H{half}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div><div className="font-semibold text-gray-900 text-sm">vs. {opponent}</div><div className="text-xs text-gray-500">{time} · Half {half}</div></div>
                        <div className="flex flex-col items-end gap-0.5"><ScoreBadge scores={scores} /><span className="text-[9px] text-gray-400">{scores.filled}/12 + {scores.bench}B</span></div>
                      </div>
                    </div>
                    <div className={`transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}><Icons.ChevronDown /></div>
                  </div>
                  {!isExpanded && renderCollapsedView(matchId, half)}
                </div>
                {isExpanded && <div className="px-3 pb-3 border-t border-gray-100">{renderExpandedView(matchId, half)}</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ==================== OVERVIEW VIEW ====================
  const OverviewView = () => {
    if (!selectedPlayday) return null;
    const getPlayerAssignment = (playerId, matchId, half) => {
      const key = `${selectedPlayday.id}-${matchId}-${half}`;
      const lineup = lineups[key] || { assignments: {}, bench: [] };
      const posId = Object.entries(lineup.assignments).find(([k, v]) => v === playerId)?.[0];
      if (posId) return { type: 'field', pos: positions.find(p => p.id === parseInt(posId)) };
      if (lineup.bench?.includes(playerId)) return { type: 'bench' };
      return null;
    };

    return (
      <div className="space-y-4">
        <div><h2 className="text-xl font-bold text-gray-900">Planning Overview</h2><p className="text-sm text-gray-500">{selectedPlayday.name} · {selectedPlayday.matches.length} matches</p></div>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300" /><span>Field</span></div>
          <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-orange-100 border border-orange-300" /><span>Bench</span></div>
          <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-gray-100 border border-gray-200" /><span>Not assigned</span></div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left p-2 font-semibold text-gray-700 sticky left-0 bg-gray-50 min-w-[120px]">Player</th>
                  {allHalves.map(h => <th key={h.key} className="text-center p-2 font-semibold text-gray-700 min-w-[44px]">M{h.matchId}H{h.half}</th>)}
                  <th className="text-center p-2 font-semibold text-gray-700 min-w-[50px]">Total</th>
                </tr>
              </thead>
              <tbody>
                {players.map(player => {
                  let totalField = 0, totalBench = 0;
                  return (
                    <tr key={player.id} className="border-b border-gray-100">
                      <td className="p-2 sticky left-0 bg-white">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: DIOK.blue }}>{player.name.split(' ').map(n => n[0]).join('')}</div>
                          <span className="font-medium text-gray-900 truncate">{player.name}</span>
                        </div>
                      </td>
                      {allHalves.map(h => {
                        const assignment = getPlayerAssignment(player.id, h.matchId, h.half);
                        if (assignment?.type === 'field') totalField++;
                        if (assignment?.type === 'bench') totalBench++;
                        return (
                          <td key={h.key} className="text-center p-1">
                            {assignment ? <div className={`inline-flex items-center justify-center w-8 h-6 rounded text-[9px] font-semibold ${assignment.type === 'field' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>{assignment.type === 'field' ? `#${assignment.pos?.code}` : 'B'}</div>
                            : <div className="inline-flex items-center justify-center w-8 h-6 rounded bg-gray-50 text-gray-300">–</div>}
                          </td>
                        );
                      })}
                      <td className="text-center p-2"><span className="text-emerald-600 font-semibold">{totalField}</span><span className="text-gray-300 mx-0.5">/</span><span className="text-orange-500">{totalBench}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <div className="font-semibold text-gray-900 mb-3">Fairness Check</div>
          <div className="space-y-2">
            {players.map(player => {
              const field = fieldHistory[player.id] || 0;
              const bench = benchHistory[player.id] || 0;
              return (
                <div key={player.id} className="flex items-center gap-3">
                  <div className="w-20 text-xs font-medium text-gray-700 truncate">{player.name.split(' ')[0]}</div>
                  <div className="flex-1 flex items-center gap-0.5">{Array.from({ length: 6 }).map((_, i) => <div key={i} className={`h-3 flex-1 rounded-sm ${i < field ? 'bg-emerald-400' : i < field + bench ? 'bg-orange-400' : 'bg-gray-200'}`} />)}</div>
                  <div className="text-xs text-gray-500 w-12 text-right">{field}F+{bench}B</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: DIOK.gray }}>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl text-white font-bold" style={{ backgroundColor: DIOK.blue }}>🏉</div>
          <div><h1 className="font-bold text-gray-900">{settings.teamName}</h1><p className="text-xs text-gray-500">{settings.ageGroup} · {settings.coachName}</p></div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-4 pb-24">
        {activeTab === 'schedule' && <ScheduleView />}
        {activeTab === 'squad' && <SquadView />}
        {activeTab === 'lineup' && <LineupView />}
        {activeTab === 'overview' && <OverviewView />}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 shadow-lg">
        <div className="max-w-3xl mx-auto flex gap-1">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-colors ${activeTab === tab.id ? 'text-white' : 'text-gray-400 hover:text-gray-600'}`}
              style={{ backgroundColor: activeTab === tab.id ? DIOK.blue : 'transparent' }}>{tab.icon}<span className="text-[10px] font-medium">{tab.label}</span></button>
          ))}
        </div>
      </nav>
      <BottomSheet isOpen={showAddPlayer} onClose={() => setShowAddPlayer(false)} title="Add Player">
        <div className="space-y-4">
          <input type="text" value={newPlayer.name} onChange={(e) => setNewPlayer({...newPlayer, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900" placeholder="Player name" autoFocus />
          <div className="flex gap-2">{['1st year', '2nd year'].map(year => <button key={year} onClick={() => setNewPlayer({...newPlayer, miniYear: year})} className={`flex-1 py-3 rounded-xl font-semibold border ${newPlayer.miniYear === year ? 'text-white border-transparent' : 'bg-gray-50 text-gray-600 border-gray-200'}`} style={{ backgroundColor: newPlayer.miniYear === year ? DIOK.blue : undefined }}>{year}</button>)}</div>
          <button onClick={() => setShowAddPlayer(false)} disabled={!newPlayer.name.trim()} className={`w-full py-3 rounded-xl font-bold text-white ${newPlayer.name.trim() ? '' : 'opacity-50'}`} style={{ backgroundColor: DIOK.blue }}>Add Player</button>
        </div>
      </BottomSheet>
      <BottomSheet isOpen={showAddPlayday} onClose={() => setShowAddPlayday(false)} title="Add Playday">
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-gray-700 mb-1 block">Date</label><input type="date" value={newPlayday.date} onChange={(e) => setNewPlayday({...newPlayday, date: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900" /></div>
          <div><label className="text-sm font-medium text-gray-700 mb-1 block">Event Name</label><input type="text" value={newPlayday.name} onChange={(e) => setNewPlayday({...newPlayday, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900" placeholder="e.g. Spring Cup Day 1" /></div>
          <button onClick={addPlayday} disabled={!newPlayday.date || !newPlayday.name.trim()} className={`w-full py-3 rounded-xl font-bold text-white ${newPlayday.date && newPlayday.name.trim() ? '' : 'opacity-50'}`} style={{ backgroundColor: DIOK.blue }}>Add Playday</button>
        </div>
      </BottomSheet>
      <BottomSheet isOpen={showAddMatch} onClose={() => setShowAddMatch(false)} title="Add Match">
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-gray-700 mb-1 block">Opponent</label><input type="text" value={newMatch.opponent} onChange={(e) => setNewMatch({...newMatch, opponent: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900" placeholder="e.g. Blackrock RFC" autoFocus /></div>
          <div><label className="text-sm font-medium text-gray-700 mb-1 block">Time</label><input type="time" value={newMatch.time} onChange={(e) => setNewMatch({...newMatch, time: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900" /></div>
          <button onClick={addMatch} disabled={!newMatch.opponent.trim() || !newMatch.time} className={`w-full py-3 rounded-xl font-bold text-white ${newMatch.opponent.trim() && newMatch.time ? '' : 'opacity-50'}`} style={{ backgroundColor: DIOK.blue }}>Add Match</button>
        </div>
      </BottomSheet>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } } .animate-slideUp { animation: slideUp 0.3s ease-out; }`}</style>
    </div>
  );
}
