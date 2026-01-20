import React, { useState, useMemo, useEffect, useRef } from 'react';
import bullsLogo from './assets/bulls.svg';
import diokLogo from './assets/diok.svg';
import { supabase, supabaseConfig } from './supabaseClient';

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
  { value: 'unavailable', label: 'Unavailable', icon: '✕', color: '#dc2626', bg: '#fee2e2' },
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
  CheckCircle: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>,
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
  <div className="flex gap-0.5" title={`${count}× on bench this game day`}>
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
  const [activeTab, setActiveTab] = useState('squad');
  const [players, setPlayers] = useState(initialPlayers);
  
  const [playdays, setPlaydays] = useState([
    { id: 1, date: '2025-12-03', name: 'Training Week 1', type: 'training', matches: [
      { id: 1, opponent: 'Training Session', number: 1 },
    ]},
    { id: 2, date: '2025-12-06', name: 'Delft', type: 'game', matches: [
      { id: 1, opponent: 'RRC B', number: 1 },
      { id: 2, opponent: 'Delft A', number: 2 },
      { id: 3, opponent: 'RRC A', number: 3 },
    ]},
    { id: 3, date: '2025-12-10', name: 'Training Week 2', type: 'training', matches: [
      { id: 1, opponent: 'Training Session', number: 1 },
    ]},
    { id: 4, date: '2025-12-13', name: 'Stade France', type: 'game', matches: [
      { id: 1, opponent: 'Steenboks', number: 1 },
      { id: 2, opponent: 'All Blacks', number: 2 },
      { id: 3, opponent: 'Red Rose', number: 3 },
    ]},
  ]);
  
  const [selectedPlaydayId, setSelectedPlaydayId] = useState(1);
  const selectedPlayday = playdays.find(p => p.id === selectedPlaydayId) || playdays[0];
  
 // const [lineups, setLineups] = useState({});
  
  const initialLineups = ({
   // =====================
  // Match 1 — W1H1
  // key: playdayId-matchId-half
  // =====================
  '1-1-1': {
    assignments: {
      1: 18,  // Edward
      2: 4,   // Huib
      3: 9,   // Tobia
      4: 12,  // Rosa
      5: 10,  // Alexander
      9: 1,   // Eick
      10: 2,  // Janes
      11: 7,  // Francois
      12: 3,  // Esca
      13: 6,  // Liam
      14: 15, // Tjalle
      15: 5,  // Dries
    },
    bench: [16, 11, 14, 8], // Chris, Okke, Ot, Lewis
  },

  // Match 1 — W1H2
  '1-1-2': {
    assignments: {
      1: 18,  // Edward
      2: 14,  // Ot
      3: 16,  // Chris
      4: 12,  // Rosa
      5: 10,  // Alexander
      9: 1,   // Eick
      10: 2,  // Janes
      11: 8,  // Lewis
      12: 3,  // Esca
      13: 6,  // Liam
      14: 11, // Okke
      15: 5,  // Dries
    },
    bench: [9, 15, 4, 7], // Tobia, Tjalle, Huib, Francois
  },

  // =====================
  // Match 2 — W2H1
  // =====================
  '1-2-1': {
    assignments: {
      1: 18,  // Edward
      2: 9,   // Tobia
      3: 16,  // Chris
      4: 7,   // Francois
      5: 4,   // Huib
      9: 2,   // Janes
      10: 3,  // Esca
      11: 6,  // Liam
      12: 1,  // Eick
      13: 15, // Tjalle
      14: 11, // Okke
      15: 5,  // Dries
    },
    bench: [10, 12, 8, 14], // Alexander, Rosa, Lewis, Ot
  },

  // Match 2 — W2H2
  '1-2-2': {
    assignments: {
      1: 9,   // Tobia
      2: 14,  // Ot
      3: 16,  // Chris
      4: 4,   // Huib
      5: 10,  // Alexander
      9: 2,   // Janes
      10: 3,  // Esca
      11: 12, // Rosa
      12: 1,  // Eick
      13: 8,  // Lewis
      14: 11, // Okke
      15: 7,  // Francois
    },
    bench: [18, 6, 15, 5], // Edward, Liam, Tjalle, Dries
  },

  // =====================
  // Match 3 — W3H1
  // =====================
  '1-3-1': {
    assignments: {
      1: 18,  // Edward
      2: 16,  // Chris
      3: 14,  // Ot
      4: 7,   // Francois
      5: 10,  // Alexander
      9: 8,   // Lewis
      10: 9,  // Tobia
      11: 6,  // Liam
      12: 1,  // Eick
      13: 12, // Rosa
      14: 15, // Tjalle
      15: 5,  // Dries
    },
    bench: [2, 3, 4, 11], // Janes, Esca, Huib, Okke
  },

  // Match 3 — W3H2
  '1-3-2': {
    assignments: {
      1: 18,  // Edward
      2: 4,   // Huib
      3: 14,  // Ot
      4: 3,   // Esca
      5: 10,  // Alexander
      9: 15,  // Tjalle
      10: 2,  // Janes
      11: 11, // Okke
      12: 16, // Chris
      13: 12, // Rosa
      14: 6,  // Liam
      15: 8,  // Lewis
    },
    bench: [9, 1, 7, 5], // Tobia, Eick, Francois, Dries
  },
});

const [lineups, setLineups] = useState({});
  
  
  
  
  
  const [availability, setAvailability] = useState({});
  const [training, setTraining] = useState({});
  
  
  const [ratings, setRatings] = useState({});
  
  // Two favorite positions per player
  const [favoritePositions, setFavoritePositions] = useState({});
  
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showAddPlayday, setShowAddPlayday] = useState(false);
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [newPlayer, setNewPlayer] = useState({ name: '', miniYear: '1st year' });
  const [newPlayday, setNewPlayday] = useState({ date: '', name: '', type: 'game' });
  const [newMatch, setNewMatch] = useState({ opponent: '', number: 1 });
  const [settings] = useState({ coachName: 'Coach Rassie Erasmus', teamName: 'Bulls Mini\'s', ageGroup: 'U10' });
  const [expandedPlayer, setExpandedPlayer] = useState(null);
  const [expandedHalf, setExpandedHalf] = useState(null);
  const [editingPlayday, setEditingPlayday] = useState(null);
  const [editingPlaydayDate, setEditingPlaydayDate] = useState(null);
  const [editingMatch, setEditingMatch] = useState(null);
  const [showWhySelected, setShowWhySelected] = useState(null); // Format: 'playdayId-matchId-half-posId'
  const [showPlayerInfo, setShowPlayerInfo] = useState(null); // Format: 'playdayId-matchId-half-posId'
  const [showSatisfactionExplanation, setShowSatisfactionExplanation] = useState(false);

  // Presence tracking
  const [currentUsername, setCurrentUsername] = useState(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [activeUsers, setActiveUsers] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [actionLog, setActionLog] = useState([]);
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);

  // Allocation Rules Configuration
  const [allocationMode, setAllocationMode] = useState('game'); // 'game' or 'training'
  const [allocationRules, setAllocationRules] = useState({
    game: [
      { id: 1, name: 'No Duplicate Assignments', type: 'HARD', enabled: true, locked: true, weight: 1.0, description: 'A player can only play ONE position per half' },
      { id: 7, name: 'Must Be Trained', type: 'HARD', enabled: true, locked: true, weight: 1.0, description: 'Player must have trained for this position (game mode only)' },
      { id: 2, name: 'Fair PlayTime', type: 'SOFT', enabled: true, locked: false, weight: 0.80, description: 'Each player should play the same amount of time within limits' },
      { id: 3, name: 'Learning Opportunities', type: 'SOFT', enabled: true, locked: false, weight: 0.30, description: 'Prefer less experienced players for growth opportunities', limit: 6 },
      { id: 4, name: 'Player Skill', type: 'SOFT', enabled: true, locked: false, weight: 0.60, description: 'Prefer higher-rated players in each position' },
      { id: 5, name: 'Position Variety', type: 'SOFT', enabled: false, locked: false, weight: 0.40, description: 'Encourage players to try different positions over time' },
      { id: 6, name: 'Player Fun', type: 'SOFT', enabled: true, locked: false, weight: 0.70, description: 'Assign players to their favorite positions' },
    ],
    training: [
      { id: 1, name: 'No Duplicate Assignments', type: 'HARD', enabled: true, locked: true, weight: 1.0, description: 'A player can only play ONE position per half' },
      { id: 2, name: 'Fair PlayTime', type: 'SOFT', enabled: true, locked: false, weight: 0.90, description: 'Each player should play the same amount of time within limits' },
      { id: 3, name: 'Learning Opportunities', type: 'SOFT', enabled: true, locked: false, weight: 0.70, description: 'Prefer less experienced players for growth opportunities', limit: 12 },
      { id: 4, name: 'Player Skill', type: 'SOFT', enabled: false, locked: false, weight: 0.30, description: 'Prefer higher-rated players in each position' },
      { id: 5, name: 'Position Variety', type: 'SOFT', enabled: true, locked: false, weight: 0.80, description: 'Encourage players to try different positions over time' },
      { id: 6, name: 'Player Fun', type: 'SOFT', enabled: true, locked: false, weight: 0.50, description: 'Assign players to their favorite positions' },
    ],
  });

  const [allocationExplanations, setAllocationExplanations] = useState({});
  const [learningPlayerConfig, setLearningPlayerConfig] = useState({
    maxStars: 2,  // Players with ≤ this many stars are considered learning
    maxGames: 5,  // Players with ≤ this many games at position are considered learning
  });
  const [satisfactionWeights, setSatisfactionWeights] = useState({
    fieldTime: 40,      // Weight for field time (default 40%)
    fun: 30,            // Weight for favorite positions (default 30%)
    learning: 20,       // Weight for learning opportunities (default 20%)
    benchFairness: 10,  // Weight for bench fairness (default 10%)
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [rugbyDataId, setRugbyDataId] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [remoteUpdatedAt, setRemoteUpdatedAt] = useState(null);
  const [hasRemoteChanges, setHasRemoteChanges] = useState(false);
  const [initialState, setInitialState] = useState(null);

  // Multi-team support state
  const [teams, setTeams] = useState([]);
  const [currentTeamId, setCurrentTeamId] = useState(null);
  const [showTeamManager, setShowTeamManager] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamLogo, setNewTeamLogo] = useState('🐂');

  // Load teams and data from Supabase on mount
  useEffect(() => {
    const loadFromSupabase = async () => {
      try {
        setIsSyncing(true);

        // Load all teams
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .order('created_at');

        // If teams table doesn't exist (migration not run), fall back to old single-team behavior
        if (teamsError && teamsError.code === '42P01') {
          console.log('Teams table does not exist - falling back to single team mode');

          // Load rugby_data without team filter (old behavior)
          const { data, error } = await supabase
            .from('rugby_data')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

          if (!error && data && data.data) {
            const rugbyData = data.data;
            setPlaydays(rugbyData.playdays || []);
            setLineups(rugbyData.lineups || {});
            setRatings(rugbyData.ratings || {});
            setTraining(rugbyData.training || {});
            setFavoritePositions(rugbyData.favoritePositions || {});
            setAllocationRules(rugbyData.allocationRules || allocationRules);
            setAvailability(rugbyData.availability || {});
            setRugbyDataId(data.id);
            setRemoteUpdatedAt(data.updated_at);
            setLastSyncTime(new Date());

            setInitialState({
              playdays: JSON.stringify(rugbyData.playdays || []),
              lineups: JSON.stringify(rugbyData.lineups || {}),
              ratings: JSON.stringify(rugbyData.ratings || {}),
              training: JSON.stringify(rugbyData.training || {}),
              favoritePositions: JSON.stringify(rugbyData.favoritePositions || {}),
              allocationRules: JSON.stringify(rugbyData.allocationRules || allocationRules),
              availability: JSON.stringify(rugbyData.availability || {}),
              learningPlayerConfig: JSON.stringify(learningPlayerConfig),
              satisfactionWeights: JSON.stringify(satisfactionWeights),
            });
          }

          setHasLoaded(true);
          return;
        }

        if (teamsError) {
          console.error('Error loading teams:', teamsError);
          setHasLoaded(true);
          return;
        }

        setTeams(teamsData || []);

        // Get last selected team from localStorage or default to first team
        const lastTeamId = localStorage.getItem('rugbyPlannerLastTeamId');
        const defaultTeam = lastTeamId
          ? teamsData.find(t => t.id === lastTeamId)
          : teamsData[0];

        if (!defaultTeam) {
          console.log('No teams found');
          setHasLoaded(true);
          return;
        }

        setCurrentTeamId(defaultTeam.id);

        // Load rugby_data for current team
        await loadTeamData(defaultTeam.id);

      } catch (error) {
        console.error('Error loading from Supabase:', error);
        setHasLoaded(true);
      } finally {
        setIsSyncing(false);
      }
    };

    loadFromSupabase();
  }, []);

  // Initialize username from localStorage or prompt
  useEffect(() => {
    const storedUsername = localStorage.getItem('rugbyPlannerUsername');
    if (storedUsername) {
      setCurrentUsername(storedUsername);
    } else {
      setShowUsernamePrompt(true);
    }
  }, []);

  // Presence system: register user and send heartbeats
  useEffect(() => {
    if (!currentUsername) return;

    const registerPresence = async () => {
      try {
        // First, clean up any stale sessions for this username (from previous crashed tabs, etc.)
        const fortySecondsAgo = new Date(Date.now() - 40 * 1000).toISOString();
        await supabase
          .from('active_users')
          .delete()
          .eq('username', currentUsername)
          .lt('last_seen', fortySecondsAgo);

        // Then register this session
        await supabase
          .from('active_users')
          .upsert({
            session_id: sessionId,
            username: currentUsername,
            last_seen: new Date().toISOString()
          }, { onConflict: 'session_id' });

        // Log the login activity
        await supabase
          .from('login_history')
          .insert({
            username: currentUsername,
            session_id: sessionId,
            logged_in_at: new Date().toISOString()
          });
      } catch (error) {
        console.error('Error registering presence:', error);
      }
    };

    const updateHeartbeat = async () => {
      try {
        await supabase
          .from('active_users')
          .update({ last_seen: new Date().toISOString() })
          .eq('session_id', sessionId);
      } catch (error) {
        console.error('Error updating heartbeat:', error);
      }
    };

    const cleanupStaleUsers = async () => {
      try {
        // Remove ALL users inactive for more than 60 seconds (3x heartbeat interval for buffer)
        const sixtySecondsAgo = new Date(Date.now() - 60 * 1000).toISOString();
        await supabase
          .from('active_users')
          .delete()
          .lt('last_seen', sixtySecondsAgo);
      } catch (error) {
        console.error('Error cleaning up stale users:', error);
      }
    };

    const removePresence = () => {
      // Use fetch with keepalive for more reliable cleanup on page unload
      const url = `${supabaseConfig.url}/rest/v1/active_users?session_id=eq.${sessionId}`;
      const headers = {
        'apikey': supabaseConfig.anonKey,
        'Authorization': `Bearer ${supabaseConfig.anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      };

      // Try to delete via fetch with keepalive
      fetch(url, {
        method: 'DELETE',
        headers: headers,
        keepalive: true
      }).catch(() => {
        // Fallback: just let it expire naturally via cleanup
      });
    };

    // Register immediately
    registerPresence();

    // Send heartbeat every 20 seconds
    const heartbeatInterval = setInterval(() => {
      updateHeartbeat();
      cleanupStaleUsers();
    }, 20000);

    // Handle page unload/refresh
    const handleBeforeUnload = () => {
      removePresence();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup on unmount
    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      removePresence();
    };
  }, [currentUsername, sessionId]);

  // Subscribe to active users updates
  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('active_users')
          .select('*')
          .order('last_seen', { ascending: false });

        if (!error && data) {
          // Filter out current user and stale sessions (60 seconds old)
          const sixtySecondsAgo = Date.now() - 60 * 1000;
          const active = data.filter(user =>
            user.session_id !== sessionId &&
            new Date(user.last_seen).getTime() > sixtySecondsAgo
          );
          setActiveUsers(active);
          console.log('Active users updated:', active.length, 'other users (excluding self)');
        }
      } catch (error) {
        console.error('Error fetching active users:', error);
      }
    };

    fetchActiveUsers();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('active_users_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'active_users' },
        () => {
          console.log('Active users change detected, refreshing...');
          fetchActiveUsers();
        }
      )
      .subscribe();

    // Also poll every 10 seconds to ensure consistency
    const pollInterval = setInterval(fetchActiveUsers, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [sessionId]);

  // Fetch login history for admin view
  useEffect(() => {
    const fetchLoginHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('login_history')
          .select('*')
          .order('logged_in_at', { ascending: false })
          .limit(100);

        if (!error && data) {
          setLoginHistory(data);
        }
      } catch (error) {
        console.error('Error fetching login history:', error);
      }
    };

    fetchLoginHistory();

    // Refresh every 30 seconds
    const interval = setInterval(fetchLoginHistory, 30000);

    return () => clearInterval(interval);
  }, []);

  // Helper function to log user actions
  const logAction = async (actionType, details = {}) => {
    if (!currentUsername) return;

    try {
      const actionEntry = {
        username: currentUsername,
        session_id: sessionId,
        action_type: actionType,
        details: {
          ...details,
          team_id: currentTeamId,
          team_name: getCurrentTeam()?.name
        },
        timestamp: new Date().toISOString()
      };

      // Add to Supabase
      await supabase
        .from('action_log')
        .insert(actionEntry);

      // Also update local state for immediate UI feedback
      setActionLog(prev => [actionEntry, ...prev].slice(0, 100)); // Keep last 100 actions
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  // Fetch action log for admin view
  useEffect(() => {
    const fetchActionLog = async () => {
      try {
        const { data, error } = await supabase
          .from('action_log')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(100);

        if (!error && data) {
          setActionLog(data);
        }
      } catch (error) {
        console.error('Error fetching action log:', error);
      }
    };

    fetchActionLog();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('action_log_changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'action_log' },
        () => fetchActionLog()
      )
      .subscribe();

    // Refresh every 30 seconds as fallback
    const interval = setInterval(fetchActionLog, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  // Track if we've done initial remote check
  const hasCheckedRemoteRef = useRef(false);

  // Check for remote changes periodically
  useEffect(() => {
    if (!rugbyDataId || !remoteUpdatedAt) return;

    const checkForRemoteChanges = async () => {
      try {
        const { data, error} = await supabase
          .from('rugby_data')
          .select('updated_at')
          .eq('id', rugbyDataId)
          .eq('team_id', currentTeamId)
          .single();

        if (!error && data) {
          console.log('Remote check:', {
            remote: data.updated_at,
            local: remoteUpdatedAt,
            hasChanges: data.updated_at !== remoteUpdatedAt
          });

          if (data.updated_at !== remoteUpdatedAt) {
            console.log('Remote changes detected!');
            setHasRemoteChanges(true);
          } else {
            // Reset if remote is now in sync
            setHasRemoteChanges(false);
          }
        }
      } catch (error) {
        console.error('Error checking for remote changes:', error);
      }
    };

    // Only check immediately on first mount, not every time remoteUpdatedAt changes
    if (!hasCheckedRemoteRef.current) {
      hasCheckedRemoteRef.current = true;
      checkForRemoteChanges();
    }

    // Then check every 10 seconds
    const interval = setInterval(checkForRemoteChanges, 10000);

    return () => clearInterval(interval);
  }, [rugbyDataId, remoteUpdatedAt]);

  // Manual refresh from Supabase
  const refreshFromSupabase = async () => {
    if (!rugbyDataId) return;

    // Warn user if they have unsaved changes with detailed list
    if (hasUnsavedChanges && initialState) {
      const currentState = {
        playdays: JSON.stringify(playdays),
        lineups: JSON.stringify(lineups),
        ratings: JSON.stringify(ratings),
        training: JSON.stringify(training),
        favoritePositions: JSON.stringify(favoritePositions),
        allocationRules: JSON.stringify(allocationRules),
        availability: JSON.stringify(availability),
        learningPlayerConfig: JSON.stringify(learningPlayerConfig),
        satisfactionWeights: JSON.stringify(satisfactionWeights),
      };

      const changedFields = Object.keys(currentState).filter(key => currentState[key] !== initialState[key]);

      const fieldLabels = {
        playdays: '📅 Schedule (game days/matches)',
        lineups: '👥 Lineups (player assignments)',
        ratings: '⭐ Player ratings',
        training: '📚 Training records',
        favoritePositions: '❤️ Favorite positions',
        allocationRules: '⚙️ Allocation rules',
        availability: '✓ Player availability',
        learningPlayerConfig: '🎓 Learning player definition',
        satisfactionWeights: '😊 Satisfaction formula weights',
      };

      const changesList = changedFields.map(field => `• ${fieldLabels[field] || field}`).join('\n');

      const confirmed = window.confirm(
        '⚠️ WARNING: You have unsaved changes!\n\n' +
        'Getting updates will discard the following changes:\n\n' +
        changesList + '\n\n' +
        'Are you sure you want to discard your changes and get updates?'
      );
      if (!confirmed) return;
    }

    try {
      setIsSyncing(true);
      const { data, error } = await supabase
        .from('rugby_data')
        .select('*')
        .eq('id', rugbyDataId)
        .eq('team_id', currentTeamId)
        .single();

      if (error) {
        console.error('Error refreshing from Supabase:', error);
        return;
      }

      if (data && data.data) {
        const rugbyData = data.data;
        const newPlaydays = rugbyData.playdays || [];
        const newLineups = rugbyData.lineups || {};
        const newRatings = rugbyData.ratings || {};
        const newTraining = rugbyData.training || {};
        const newFavoritePositions = rugbyData.favoritePositions || {};
        const newAllocationRules = rugbyData.allocationRules || allocationRules;
        const newAvailability = rugbyData.availability || {};

        setPlaydays(newPlaydays);
        setLineups(newLineups);
        setRatings(newRatings);
        setTraining(newTraining);
        setFavoritePositions(newFavoritePositions);
        setAllocationRules(newAllocationRules);
        setAvailability(newAvailability);
        setRemoteUpdatedAt(data.updated_at);
        setLastSyncTime(new Date());
        setHasUnsavedChanges(false);
        setHasRemoteChanges(false);

        // Log the refresh action
        logAction('get_updates', {
          playdaysCount: newPlaydays.length,
          lineupsCount: Object.keys(newLineups).length
        });

        // Reset initial state to new data
        setInitialState({
          playdays: JSON.stringify(newPlaydays),
          lineups: JSON.stringify(newLineups),
          ratings: JSON.stringify(newRatings),
          training: JSON.stringify(newTraining),
          favoritePositions: JSON.stringify(newFavoritePositions),
          allocationRules: JSON.stringify(newAllocationRules),
          availability: JSON.stringify(newAvailability),
          learningPlayerConfig: JSON.stringify(learningPlayerConfig),
          satisfactionWeights: JSON.stringify(satisfactionWeights),
        });
      }
    } catch (error) {
      console.error('Error refreshing from Supabase:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Manual save to Supabase
  const handleSave = async () => {
    if (!rugbyDataId) {
      console.error('Cannot save: rugbyDataId is not set');
      alert('Error: Database ID not found. Please refresh the page.');
      return;
    }

    // Check for conflicts before saving
    if (hasRemoteChanges) {
      const confirmed = window.confirm(
        '⚠️  CONFLICT DETECTED\n\n' +
        'Another coach has updated the data while you were making changes.\n\n' +
        '• Click OK to OVERWRITE their changes with yours\n' +
        '• Click Cancel to GET UPDATES first and review their changes\n\n' +
        'Recommended: Cancel and review their changes first.'
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      setIsSyncing(true);
      const data = { playdays, lineups, ratings, training, favoritePositions, allocationRules, availability };

      console.log('Saving to Supabase...', { rugbyDataId, dataKeys: Object.keys(data) });

      const { data: updatedData, error } = await supabase
        .from('rugby_data')
        .update({ data: data })
        .eq('id', rugbyDataId)
        .eq('team_id', currentTeamId)
        .select()
        .single();

      if (error) {
        console.error('Error saving to Supabase:', error);
        alert('Error saving data: ' + error.message);
      } else {
        console.log('Save successful');
        setRemoteUpdatedAt(updatedData.updated_at);
        setLastSyncTime(new Date());
        setHasUnsavedChanges(false);
        setHasRemoteChanges(false);

        // Log the save action
        logAction('save_data', {
          hasConflict: hasRemoteChanges,
          playdaysCount: playdays.length,
          lineupsCount: Object.keys(lineups).length
        });

        // Reset initial state to current data after successful save
        setInitialState({
          playdays: JSON.stringify(playdays),
          lineups: JSON.stringify(lineups),
          ratings: JSON.stringify(ratings),
          training: JSON.stringify(training),
          favoritePositions: JSON.stringify(favoritePositions),
          allocationRules: JSON.stringify(allocationRules),
          availability: JSON.stringify(availability),
          learningPlayerConfig: JSON.stringify(learningPlayerConfig),
          satisfactionWeights: JSON.stringify(satisfactionWeights),
        });
      }
    } catch (error) {
      console.error('Error saving to Supabase:', error);
      alert('Error saving data: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Mark as changed only when data actually differs from initial state
  useEffect(() => {
    if (!hasLoaded) {
      console.log('Change detection skipped: not loaded yet');
      return;
    }

    if (!initialState) {
      console.log('Change detection skipped: no initial state yet');
      // Set to false explicitly when we don't have initial state yet
      setHasUnsavedChanges(false);
      return;
    }

    const currentState = {
      playdays: JSON.stringify(playdays),
      lineups: JSON.stringify(lineups),
      ratings: JSON.stringify(ratings),
      training: JSON.stringify(training),
      favoritePositions: JSON.stringify(favoritePositions),
      allocationRules: JSON.stringify(allocationRules),
      availability: JSON.stringify(availability),
      learningPlayerConfig: JSON.stringify(learningPlayerConfig),
      satisfactionWeights: JSON.stringify(satisfactionWeights),
    };

    const hasChanges = Object.keys(currentState).some(key => currentState[key] !== initialState[key]);
    console.log('Change detection:', {
      hasChanges,
      changedKeys: Object.keys(currentState).filter(key => currentState[key] !== initialState[key])
    });
    setHasUnsavedChanges(hasChanges);
  }, [playdays, lineups, ratings, training, favoritePositions, allocationRules, availability, learningPlayerConfig, satisfactionWeights, hasLoaded, initialState]);

  // Helper function to get current team
  const getCurrentTeam = () => {
    return teams.find(t => t.id === currentTeamId);
  };

  // Team management functions
  const loadTeamData = async (teamId) => {
    try {
      setIsSyncing(true);

      const { data: rugbyData, error } = await supabase
        .from('rugby_data')
        .select('*')
        .eq('team_id', teamId)
        .single();

      if (error && error.code === 'PGRST116') {
        // No data for this team yet, create empty structure
        const initialData = {
          playdays: [],
          lineups: {},
          ratings: {},
          training: {},
          favoritePositions: {},
          allocationRules: {
            game: {
              enabled: true,
              minFieldTime: 3,
              maxFieldTime: 4,
              strictBenchFairness: true,
              enableLearning: true
            },
            training: {
              enabled: false,
              minFieldTime: 2,
              maxFieldTime: 3,
              strictBenchFairness: false,
              enableLearning: false
            }
          },
          availability: {}
        };

        const { data: newData, error: insertError } = await supabase
          .from('rugby_data')
          .insert({ team_id: teamId, team_name: getCurrentTeam()?.name || 'New Team', data: initialData })
          .select()
          .single();

        if (!insertError) {
          setRugbyDataId(newData.id);
          setPlaydays([]);
          setLineups({});
          setRatings({});
          setTraining({});
          setFavoritePositions({});
          setAllocationRules(initialData.allocationRules);
          setAvailability({});
          setRemoteUpdatedAt(newData.updated_at);

          // Set initial state for change detection
          setInitialState({
            playdays: JSON.stringify([]),
            lineups: JSON.stringify({}),
            ratings: JSON.stringify({}),
            training: JSON.stringify({}),
            favoritePositions: JSON.stringify({}),
            allocationRules: JSON.stringify(initialData.allocationRules),
            availability: JSON.stringify({}),
            learningPlayerConfig: JSON.stringify(learningPlayerConfig),
            satisfactionWeights: JSON.stringify(satisfactionWeights),
          });
        }
      } else if (!error) {
        // Load existing data into state
        setRugbyDataId(rugbyData.id);
        setPlaydays(rugbyData.data.playdays || []);
        setLineups(rugbyData.data.lineups || {});
        setRatings(rugbyData.data.ratings || {});
        setTraining(rugbyData.data.training || {});
        setFavoritePositions(rugbyData.data.favoritePositions || {});
        setAllocationRules(rugbyData.data.allocationRules || allocationRules);
        setAvailability(rugbyData.data.availability || {});
        setRemoteUpdatedAt(rugbyData.updated_at);

        // Set initial state for change detection
        setInitialState({
          playdays: JSON.stringify(rugbyData.data.playdays || []),
          lineups: JSON.stringify(rugbyData.data.lineups || {}),
          ratings: JSON.stringify(rugbyData.data.ratings || {}),
          training: JSON.stringify(rugbyData.data.training || {}),
          favoritePositions: JSON.stringify(rugbyData.data.favoritePositions || {}),
          allocationRules: JSON.stringify(rugbyData.data.allocationRules || allocationRules),
          availability: JSON.stringify(rugbyData.data.availability || {}),
          learningPlayerConfig: JSON.stringify(learningPlayerConfig),
          satisfactionWeights: JSON.stringify(satisfactionWeights),
        });
      }

      setHasLoaded(true);
      setLastSyncTime(new Date());
    } catch (err) {
      console.error('Error loading team data:', err);
      alert(`Error loading team data: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const switchTeam = async (teamId) => {
    // Check for unsaved changes
    if (hasUnsavedChanges) {
      const confirm = window.confirm(
        'You have unsaved changes. Switch teams anyway? Changes will be lost.'
      );
      if (!confirm) return;
    }

    // Save last team selection
    localStorage.setItem('rugbyPlannerLastTeamId', teamId);
    setCurrentTeamId(teamId);

    // Reset state
    setHasLoaded(false);
    setHasUnsavedChanges(false);

    // Load team's rugby_data
    await loadTeamData(teamId);
  };

  const createTeam = async (teamName, teamLogo) => {
    try {
      const { data: newTeam, error } = await supabase
        .from('teams')
        .insert({
          name: teamName,
          logo: teamLogo,
          created_by: username || 'anonymous'
        })
        .select()
        .single();

      if (error) throw error;

      setTeams([...teams, newTeam]);
      logAction('create_team', { team_name: teamName, team_logo: teamLogo });

      // Switch to new team
      await switchTeam(newTeam.id);
    } catch (err) {
      console.error('Error creating team:', err);
      alert(`Error creating team: ${err.message}`);
    }
  };

  const tabs = [
    { id: 'squad', label: 'Squad', icon: <Icons.Users /> },
    { id: 'schedule', label: 'Schedule', icon: <Icons.Calendar /> },
    { id: 'lineup', label: 'Lineup', icon: <Icons.Grid /> },
    { id: 'overview', label: 'Overview', icon: <Icons.Eye /> },
    { id: 'rules', label: 'Rules', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg> },
    { id: 'admin', label: 'Admin', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  ];

  const BENCH_SIZE = 8;

  const allHalves = useMemo(() => {
    if (!selectedPlayday) return [];
    return selectedPlayday.matches.flatMap(m => [
      { matchId: m.id, half: 1, opponent: m.opponent, number: m.number, key: `${selectedPlayday.id}-${m.id}-1` },
      { matchId: m.id, half: 2, opponent: m.opponent, number: m.number, key: `${selectedPlayday.id}-${m.id}-2` },
    ]);
  }, [selectedPlayday]);

  const isFavoritePosition = (playerId, positionId) => (favoritePositions[playerId] || []).includes(positionId);

  const toggleFavoritePosition = (playerId, positionId) => {
    setFavoritePositions(prev => {
      const current = prev[playerId] || [];
      if (current.includes(positionId)) {
        return { ...prev, [playerId]: current.filter(id => id !== positionId) };
      } else {
        return { ...prev, [playerId]: [...current, positionId] };
      }
    });
  };

  const removePlayer = (playerId) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const confirmMsg = `Remove ${player.name} from the team?\n\nThis will:\n- Remove them from the squad\n- Clear all their ratings and training data\n- Remove them from all lineups\n\nThis action cannot be undone.`;

    if (!window.confirm(confirmMsg)) return;

    // Remove player from squad
    setPlayers(prev => prev.filter(p => p.id !== playerId));

    // Remove from lineups
    setLineups(prev => {
      const updated = {};
      Object.keys(prev).forEach(key => {
        const lineup = prev[key];
        updated[key] = {
          assignments: Object.fromEntries(
            Object.entries(lineup.assignments || {}).filter(([_, pid]) => pid !== playerId)
          ),
          bench: (lineup.bench || []).filter(pid => pid !== playerId)
        };
      });
      return updated;
    });

    // Remove ratings
    setRatings(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        if (key.startsWith(`${playerId}-`)) delete updated[key];
      });
      return updated;
    });

    // Remove training
    setTraining(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        if (key.startsWith(`${playerId}-`)) delete updated[key];
      });
      return updated;
    });

    // Remove favorite positions
    setFavoritePositions(prev => {
      const updated = { ...prev };
      delete updated[playerId];
      return updated;
    });

    // Remove availability
    setAvailability(prev => {
      const updated = { ...prev };
      delete updated[playerId];
      return updated;
    });

    // Collapse if expanded
    if (expandedPlayer === playerId) {
      setExpandedPlayer(null);
    }

    logAction('remove_player', { player_name: player.name, player_id: playerId });
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
    let happinessScore = 0, strengthScore = 0, learningCount = 0, maxHappiness = 0, maxStrength = 0;
    let totalAllocationScore = 0;
    let positionCount = 0;

    const activeRules = allocationRules[allocationMode];
    const assigned = new Set();

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

      // Count as learning if:
      // 1. NOT trained (red position) = learning new position
      // 2. OR trained but rating <= maxStars AND timesPlayed <= maxGames
      if (!trained || (rating <= learningPlayerConfig.maxStars && timesPlayed <= learningPlayerConfig.maxGames)) {
        learningCount += 1;
      }

      // Calculate allocation score for this position
      const player = players.find(p => p.id === playerId);
      const position = positions.find(p => p.id === parseInt(posId));
      if (player && position) {
        const { score } = calculatePlayerPositionScore(player, position, assigned, activeRules, allocationMode);
        if (score > -Infinity) {
          totalAllocationScore += score;
          positionCount++;
        }
        assigned.add(playerId);
      }
    });

    const avgAllocationScore = positionCount > 0 ? totalAllocationScore / positionCount : 0;

    return {
      happiness: maxHappiness > 0 ? Math.round((happinessScore / maxHappiness) * 100) : 0,
      strength: maxStrength > 0 ? Math.round((strengthScore / maxStrength) * 100) : 0,
      learning: learningCount,
      filled: Object.keys(lineup.assignments).length,
      bench: lineup.bench?.length || 0,
      allocationScore: Math.round(avgAllocationScore * 10) / 10, // Round to 1 decimal
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

    // Calculate bench count for this specific playday
    const playday = playdays.find(pd => pd.id === playdayId);
    const playdayBenchCounts = {};
    if (playday) {
      playday.matches.forEach(m => {
        [1, 2].forEach(h => {
          const lineupKey = `${playdayId}-${m.id}-${h}`;
          const matchLineup = lineups[lineupKey] || { assignments: {}, bench: [] };
          (matchLineup.bench || []).forEach(playerId => {
            if (playerId) playdayBenchCounts[playerId] = (playdayBenchCounts[playerId] || 0) + 1;
          });
        });
      });
    }

    return availablePlayers.map(p => {
      const trainingKey = `${p.id}-${positionId}`;
      const trained = training[trainingKey] || false;
      const rating = trained ? (ratings[trainingKey] || 0) : 0;
      const isPreferred = isFavoritePosition(p.id, positionId);
      const benchCount = benchHistory[p.id] || 0; // Overall bench count
      const playdayBenchCount = playdayBenchCounts[p.id] || 0; // Bench count for this playday only
      const fieldCount = fieldHistory[p.id] || 0;
      const timesAtPosition = playerPositionCounts[p.id]?.[positionId] || 0;
      // Check if player is assigned elsewhere in this half
      // For field positions: only exclude if assigned to a DIFFERENT field position (bench players are OK to show)
      // For bench: exclude if on bench elsewhere or on field
      const isAssignedElsewhereInHalf = forBench
        ? (assignedInHalf.has(p.id) && !lineup.bench?.includes(p.id))
        : (lineup.assignments[positionId] !== p.id && Object.values(lineup.assignments).includes(p.id));

      const isCurrentlyHere = forBench ? lineup.bench?.includes(p.id) : lineup.assignments[positionId] === p.id;
      const isOnBench = lineup.bench?.includes(p.id);
      
      let score = 1000;
      if (forBench) score = benchCount * 100 - fieldCount * 10;
      else if (trained) score = 100 - (rating * 10) - (isPreferred ? 50 : 0);

      return { ...p, trained, rating, isPreferred, benchCount, playdayBenchCount, fieldCount, timesAtPosition, isAssignedElsewhereInHalf, isCurrentlyHere, isOnBench, score };
    }).sort((a, b) => {
      if (a.isCurrentlyHere !== b.isCurrentlyHere) return a.isCurrentlyHere ? -1 : 1;
      if (a.isAssignedElsewhereInHalf !== b.isAssignedElsewhereInHalf) return a.isAssignedElsewhereInHalf ? 1 : -1;
      if (!forBench && a.trained !== b.trained) return a.trained ? -1 : 1;
      return a.score - b.score;
    });
  };

  const splitCandidates = (candidates, forBench) => {
    if (forBench) return { skilled: candidates, learning: [], untrained: [] };

    const available = candidates.filter(c => !c.isAssignedElsewhereInHalf);
    const trained = available.filter(c => c.trained);
    const untrained = available.filter(c => !c.trained);

    // Split trained players into skilled and learning based on config
    const skilled = trained
      .filter(c => c.rating > learningPlayerConfig.maxStars || c.timesAtPosition > learningPlayerConfig.maxGames)
      .sort((a, b) => b.rating - a.rating); // Sort by rating descending

    const learning = trained
      .filter(c => c.rating <= learningPlayerConfig.maxStars && c.timesAtPosition <= learningPlayerConfig.maxGames)
      .sort((a, b) => b.rating - a.rating); // Sort by rating descending

    // Sort untrained by rating descending as well
    const untrainedSorted = untrained.sort((a, b) => b.rating - a.rating);

    return {
      skilled,
      learning,
      untrained: untrainedSorted,
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

  const clearLineup = (playdayId, matchId, half) => {
    const key = `${playdayId}-${matchId}-${half}`;
    setLineups(prev => ({ ...prev, [key]: { assignments: {}, bench: [] } }));

    // Log the clear action
    const playday = playdays.find(pd => pd.id === playdayId);
    const match = playday?.matches.find(m => m.id === matchId);
    logAction('clear_lineup', {
      playday: playday?.name,
      match: match?.opponent || 'Training',
      half: half
    });
  };

  // Clear all lineups for the entire day
  const clearFullDay = (playdayId) => {
    if (!selectedPlayday) return;

    const allHalvesForDay = selectedPlayday.matches.flatMap(m => [
      { matchId: m.id, half: 1 },
      { matchId: m.id, half: 2 },
    ]);

    const clearedLineups = {};
    allHalvesForDay.forEach(({ matchId, half }) => {
      const key = `${playdayId}-${matchId}-${half}`;
      clearedLineups[key] = { assignments: {}, bench: [] };
    });

    setLineups(prev => ({ ...prev, ...clearedLineups }));

    // Log the action
    const playday = playdays.find(pd => pd.id === playdayId);
    logAction('clear_full_day', {
      playday: playday?.name,
      halvesCount: allHalvesForDay.length,
      matchesCount: selectedPlayday.matches.length
    });
  };

  const calculatePlayerPositionScore = (player, position, assigned, rules, mode = allocationMode, customFieldHistory = null, customBenchHistory = null) => {
    let score = 0;
    const explanations = [];

    // Use custom history if provided, otherwise use component state
    const effectiveFieldHistory = customFieldHistory || fieldHistory;
    const effectiveBenchHistory = customBenchHistory || benchHistory;

    // HARD constraint: No duplicate assignments
    if (assigned.has(player.id)) return { score: -Infinity, explanations: ['Already assigned in this half'] };

    // HARD constraint: Must be trained for position (GAME mode only)
    const trainingKey = `${player.id}-${position.id}`;
    if (mode === 'game' && !training[trainingKey]) return { score: -Infinity, explanations: ['Not trained for this position (game mode)'] };

    // Apply SOFT rules - each normalized to 0-100 scale before weighting
    for (const rule of rules.filter(r => r.enabled && r.type === 'SOFT')) {
      switch(rule.id) {
        case 2: // Fair PlayTime (0-100 scale: fewer halves played = higher score)
          const maxField = Math.max(...Object.values(effectiveFieldHistory), 1);
          const minField = Math.min(...Object.values(effectiveFieldHistory), 0);
          const playerField = effectiveFieldHistory[player.id] || 0;
          // Inverse: players with fewer halves get higher scores
          const fairnessNormalized = maxField > minField ? ((maxField - playerField) / (maxField - minField)) * 100 : 100;
          const fairnessScore = (fairnessNormalized / 100) * rule.weight * 10;
          score += fairnessScore;
          explanations.push(`PlayTime (${playerField} halves): ${fairnessScore.toFixed(2)} pts`);
          break;

        case 3: // Learning Opportunities (0-100 scale: low rating or new to position = higher score)
          const rating3 = ratings[trainingKey] || 0;
          const timesPlayed3 = playerPositionCounts[player.id]?.[position.id] || 0;
          const isDevelopment = rating3 < 3 || timesPlayed3 === 0;
          const developmentNormalized = isDevelopment ? 100 : 0;
          const developmentScore = (developmentNormalized / 100) * rule.weight * 10;
          score += developmentScore;
          if (isDevelopment) {
            explanations.push(`Learning (${rating3 < 3 ? 'low rating' : 'new position'}): ${developmentScore.toFixed(2)} pts`);
          }
          break;

        case 4: // Player Skill (0-100 scale based on rating)
          const rating = ratings[trainingKey] || 0;
          const strengthNormalized = (rating / 5) * 100; // 0-5 stars -> 0-100
          const strengthScore = (strengthNormalized / 100) * rule.weight * 10;
          score += strengthScore;
          explanations.push(`Skill (${rating}★): ${strengthScore.toFixed(2)} pts`);
          break;

        case 5: // Position Variety (0-100 scale: never played = 100, played 5+ times = near 0)
          const timesPlayed = playerPositionCounts[player.id]?.[position.id] || 0;
          const varietyNormalized = Math.max(0, 100 - (timesPlayed * 20)); // 0 plays=100, 1=80, 2=60, 3=40, 4=20, 5+=0
          const varietyScore = (varietyNormalized / 100) * rule.weight * 10;
          score += varietyScore;
          explanations.push(`Variety (${timesPlayed}× before): ${varietyScore.toFixed(2)} pts`);
          break;

        case 6: // Player Fun (0-100 scale: favorite=100, not=0)
          const isFavorite = favoritePositions[player.id]?.includes(position.id);
          const preferenceNormalized = isFavorite ? 100 : 0;
          const preferenceScore = (preferenceNormalized / 100) * rule.weight * 10;
          score += preferenceScore;
          if (isFavorite) {
            explanations.push(`Fun (favorite ★): ${preferenceScore.toFixed(2)} pts`);
          }
          break;
      }
    }

    return { score, explanations };
  };

  const proposeLineup = (playdayId, matchId, half, mode = allocationMode) => {
    const assigned = new Set();
    const newAssignments = {};
    const newBench = [];
    const explanationsMap = {};

    const activeRules = allocationRules[mode];

    // Phase 1: Assign field positions
    const unfilledPositions = [];
    positions.forEach(pos => {
      const candidateScores = availablePlayers
        .filter(p => !assigned.has(p.id))
        .map(p => {
          const { score, explanations } = calculatePlayerPositionScore(p, pos, assigned, activeRules, mode);
          return { player: p, score, explanations };
        })
        .filter(c => c.score > -Infinity)
        .sort((a, b) => b.score - a.score);

      if (candidateScores.length > 0) {
        const best = candidateScores[0];
        newAssignments[pos.id] = best.player.id;
        assigned.add(best.player.id);
        explanationsMap[`${pos.id}-${best.player.id}`] = {
          position: pos,
          player: best.player,
          score: best.score,
          explanations: best.explanations,
        };
      } else {
        unfilledPositions.push(pos);
      }
    });

    // Phase 2: Assign bench (balance both field time AND bench fairness)
    // Calculate actual bench size based on available players
    const actualBenchSize = Math.max(0, availablePlayers.length - positions.length);

    // Get Fair PlayTime weight to determine prioritization
    const fairPlayRule = activeRules.find(r => r.id === 2 && r.enabled);
    const fairPlayWeight = fairPlayRule ? fairPlayRule.weight : 0.8;

    const benchCandidates = availablePlayers
      .filter(p => !assigned.has(p.id))
      .sort((a, b) => {
        const aFieldTime = fieldHistory[a.id] || 0;
        const bFieldTime = fieldHistory[b.id] || 0;
        const aBenchTime = benchHistory[a.id] || 0;
        const bBenchTime = benchHistory[b.id] || 0;
        const aTotalTime = aFieldTime + aBenchTime;
        const bTotalTime = bFieldTime + bBenchTime;

        // Calculate total playtime difference (field + bench)
        const totalTimeDiff = aTotalTime - bTotalTime;

        // If Fair PlayTime weight is high (>0.7), prioritize bench fairness
        if (fairPlayWeight > 0.7) {
          // Primary: Assign bench to players with FEWER bench times (to balance bench distribution)
          const benchDiff = aBenchTime - bBenchTime;
          if (benchDiff !== 0) {
            return benchDiff; // Ascending: fewer bench times = higher priority for bench
          }
          // Secondary: Among equal bench time, assign to those with MORE field time (they need rest)
          return bFieldTime - aFieldTime; // Descending: more field time = higher priority for bench
        } else {
          // Original logic: prioritize field time rest
          const fieldTimeDiff = bFieldTime - aFieldTime;
          if (Math.abs(fieldTimeDiff) > 1) {
            return fieldTimeDiff;
          }
          return aBenchTime - bBenchTime;
        }
      })
      .slice(0, actualBenchSize);

    benchCandidates.forEach(p => {
      newBench.push(p.id);
      assigned.add(p.id);
    });

    // Phase 3: Try to fill any unfilled positions by swapping with bench players
    if (unfilledPositions.length > 0 && newBench.length > 0) {
      unfilledPositions.forEach(pos => {
        const benchScores = newBench
          .map(benchPlayerId => {
            const player = players.find(p => p.id === benchPlayerId);
            if (!player) return null;
            const { score, explanations } = calculatePlayerPositionScore(player, pos, new Set(), activeRules, mode);
            return { player, score, explanations };
          })
          .filter(c => c && c.score > -Infinity)
          .sort((a, b) => b.score - a.score);

        if (benchScores.length > 0) {
          const best = benchScores[0];
          newAssignments[pos.id] = best.player.id;
          // Remove from bench
          const benchIndex = newBench.indexOf(best.player.id);
          if (benchIndex > -1) {
            newBench.splice(benchIndex, 1);
          }
          explanationsMap[`${pos.id}-${best.player.id}`] = {
            position: pos,
            player: best.player,
            score: best.score,
            explanations: best.explanations,
          };
        }
      });
    }

    // Phase 4: Add any remaining unassigned players to bench
    const assignedPlayerIds = new Set([...Object.values(newAssignments), ...newBench]);
    const remainingPlayers = availablePlayers.filter(p => !assignedPlayerIds.has(p.id));
    remainingPlayers.forEach(p => {
      newBench.push(p.id);
    });

    const key = `${playdayId}-${matchId}-${half}`;
    setLineups(prev => ({ ...prev, [key]: { assignments: newAssignments, bench: newBench } }));
    setAllocationExplanations(prev => ({ ...prev, [key]: explanationsMap }));

    // Log the auto-propose action
    const playday = playdays.find(pd => pd.id === playdayId);
    const match = playday?.matches.find(m => m.id === matchId);
    logAction('auto_propose_lineup', {
      playday: playday?.name,
      match: match?.opponent || 'Training',
      half: half,
      mode: mode,
      assignedCount: Object.keys(newAssignments).length,
      benchCount: newBench.length
    });
  };

  // Auto-propose all halves for the entire game day - FAIRNESS-FIRST APPROACH V2
  const proposeFullDay = (playdayId, mode = allocationMode) => {
    if (!selectedPlayday) {
      return;
    }

    const allHalvesForDay = selectedPlayday.matches.flatMap(m => [
      { matchId: m.id, half: 1 },
      { matchId: m.id, half: 2 },
    ]);

    const availablePlayers = players.filter(p => {
      const avail = availability[p.id];
      return !avail || avail === 'available';
    });

    if (availablePlayers.length === 0) {
      return;
    }

    const activeRules = allocationRules[mode];
    const fairPlayRule = activeRules.find(r => r.id === 2 && r.enabled);
    const fairPlayWeight = fairPlayRule ? fairPlayRule.weight : 0.8;

    // Calculate ideal field time per player
    const totalHalves = allHalvesForDay.length;
    const totalFieldSlots = totalHalves * positions.length;
    const idealFieldTimePerPlayer = totalFieldSlots / availablePlayers.length;

    // Track field counts for each player during allocation
    const fieldCounts = {};
    availablePlayers.forEach(p => fieldCounts[p.id] = 0);

    // Allocate halves iteratively, maintaining fairness at each step
    const newLineupsForDay = {};
    const newExplanationsForDay = {};

    allHalvesForDay.forEach(({ matchId, half }, halfIdx) => {
      const key = `${playdayId}-${matchId}-${half}`;

      // Calculate fairness scores for this half (how much each player needs field time)
      const fairnessScores = {};
      availablePlayers.forEach(p => {
        const currentRatio = fieldCounts[p.id] / (halfIdx + 1);
        const targetRatio = idealFieldTimePerPlayer / totalHalves;
        fairnessScores[p.id] = targetRatio - currentRatio; // Positive = needs more field time
      });

      // Build candidate assignments for all position-player combinations
      const candidateAssignments = [];

      positions.forEach(pos => {
        availablePlayers.forEach(player => {
          // Calculate score for this player-position pair
          const { score: baseScore, explanations } = calculatePlayerPositionScore(
            player, pos, new Set(), activeRules, mode, {}, {}
          );

          // Skip if not trained (score will be -Infinity)
          if (baseScore === -Infinity) {
            return;
          }

          // Add fairness component (scaled significantly to prioritize fairness)
          const fairnessComponent = fairnessScores[player.id] * fairPlayWeight * 50;
          const totalScore = baseScore + fairnessComponent;

          candidateAssignments.push({
            player: player,
            playerId: player.id,
            pos: pos,
            posId: pos.id,
            score: totalScore,
            baseScore: baseScore,
            fairnessComponent: fairnessComponent,
            explanations: explanations
          });
        });
      });

      // Sort by total score (descending)
      candidateAssignments.sort((a, b) => b.score - a.score);

      // Greedy assignment: pick best pairs without conflicts
      const newAssignments = {};
      const explanationsMap = {};
      const assignedPlayers = new Set();
      const assignedPositions = new Set();

      candidateAssignments.forEach(candidate => {
        if (!assignedPlayers.has(candidate.playerId) && !assignedPositions.has(candidate.posId)) {
          newAssignments[candidate.posId] = candidate.playerId;
          assignedPlayers.add(candidate.playerId);
          assignedPositions.add(candidate.posId);
          explanationsMap[`${candidate.posId}-${candidate.playerId}`] = {
            position: candidate.pos,
            player: candidate.player,
            score: candidate.baseScore,
            explanations: candidate.explanations
          };

          // Update field count for this player
          fieldCounts[candidate.playerId]++;
        }
      });

      // Add unassigned players to bench
      const finalBench = [];
      availablePlayers.forEach(p => {
        if (!assignedPlayers.has(p.id)) {
          finalBench.push(p.id);
        }
      });

      // Store lineup
      newLineupsForDay[key] = { assignments: newAssignments, bench: finalBench };
      newExplanationsForDay[key] = explanationsMap;
    });

    // Apply all lineups at once
    setLineups(prev => ({ ...prev, ...newLineupsForDay }));
    setAllocationExplanations(prev => ({ ...prev, ...newExplanationsForDay }));

    // Log the action
    const playday = playdays.find(pd => pd.id === playdayId);
    logAction('auto_propose_full_day', {
      playday: playday?.name,
      mode: mode,
      halvesCount: allHalvesForDay.length,
      matchesCount: selectedPlayday.matches.length
    });
  };

  const handleAssignPlayer = (playerId) => {
    if (!selectedPosition) return;
    const { playdayId, matchId, half, posId, isBench } = selectedPosition;
    const assignedInHalf = getAssignedInHalf(playdayId, matchId, half);
    const key = `${playdayId}-${matchId}-${half}`;
    const lineup = lineups[key] || { assignments: {}, bench: [] };
    const isCurrentlyHere = isBench ? lineup.bench?.includes(playerId) : lineup.assignments[posId] === playerId;

    // If clicking a field position, only block if player is on a DIFFERENT field position (bench is OK)
    // If clicking bench, block if player is anywhere else
    if (!isBench) {
      // Clicking field position - check if assigned to another field position
      const isOnDifferentFieldPosition = Object.entries(lineup.assignments).some(([pid, pId]) => pid !== posId && pId === playerId);
      if (isOnDifferentFieldPosition) {
        alert('⚠️ This player is already assigned to another field position in this half!');
        return;
      }
    } else {
      // Clicking bench - check if assigned anywhere else
      if (assignedInHalf.has(playerId) && !isCurrentlyHere) {
        alert('⚠️ This player is already assigned in this half!');
        return;
      }
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

  const toggleRule = (ruleId) => {
    setAllocationRules(prev => ({
      ...prev,
      [allocationMode]: prev[allocationMode].map(r =>
        r.id === ruleId && !r.locked ? { ...r, enabled: !r.enabled } : r
      ),
    }));
  };

  const updateRuleWeight = (ruleId, weight) => {
    setAllocationRules(prev => ({
      ...prev,
      [allocationMode]: prev[allocationMode].map(r =>
        r.id === ruleId ? { ...r, weight: weight / 100 } : r
      ),
    }));
  };

  const handleSwapPositions = (playdayId, matchId, half, player1Id, player2Id) => {
    const key = `${playdayId}-${matchId}-${half}`;
    updateLineup(playdayId, matchId, half, (prev) => {
      const newAssignments = { ...prev.assignments };

      // Find positions of both players
      let pos1 = null, pos2 = null;
      Object.entries(newAssignments).forEach(([posId, playerId]) => {
        if (playerId === player1Id) pos1 = posId;
        if (playerId === player2Id) pos2 = posId;
      });

      // Swap them
      if (pos1 && pos2) {
        newAssignments[pos1] = player2Id;
        newAssignments[pos2] = player1Id;
      }

      return { ...prev, assignments: newAssignments };
    });
  };

  const addPlayday = () => {
    if (!newPlayday.date || !newPlayday.name) return;
    const id = Math.max(0, ...playdays.map(p => p.id)) + 1;
    setPlaydays([...playdays, { id, date: newPlayday.date, name: newPlayday.name, type: newPlayday.type, matches: [] }]);
    setNewPlayday({ date: '', name: '', type: 'game' });
    setShowAddPlayday(false);
  };

  const deletePlayday = (id) => {
    if (playdays.length <= 1) return;
    setPlaydays(playdays.filter(p => p.id !== id));
    if (selectedPlaydayId === id) setSelectedPlaydayId(playdays.find(p => p.id !== id)?.id || 1);
  };

  const addMatch = () => {
    if (!newMatch.opponent) return;
    setPlaydays(playdays.map(p => {
      if (p.id !== selectedPlaydayId) return p;
      const matchId = Math.max(0, ...p.matches.map(m => m.id)) + 1;
      const nextNumber = Math.max(0, ...p.matches.map(m => m.number || 0)) + 1;
      return { ...p, matches: [...p.matches, { id: matchId, opponent: newMatch.opponent, number: nextNumber }] };
    }));
    setNewMatch({ opponent: '', number: 1 });
    setShowAddMatch(false);
  };

  const deleteMatch = (matchId) => {
    setPlaydays(playdays.map(p => p.id !== selectedPlaydayId ? p : { ...p, matches: p.matches.filter(m => m.id !== matchId) }));
  };

  const updatePlaydayName = (playdayId, newName) => {
    setPlaydays(playdays.map(p => p.id === playdayId ? { ...p, name: newName } : p));
  };

  const updateMatchOpponent = (playdayId, matchId, newOpponent) => {
    setPlaydays(playdays.map(p => p.id === playdayId ? {
      ...p,
      matches: p.matches.map(m => m.id === matchId ? { ...m, opponent: newOpponent } : m)
    } : p));
  };

  const getNextDayOfWeek = (dayOfWeek, fromDate = new Date()) => {
    // dayOfWeek: 0 = Sunday, 3 = Wednesday, 6 = Saturday
    const resultDate = new Date(fromDate);
    resultDate.setDate(fromDate.getDate() + ((dayOfWeek + 7 - fromDate.getDay()) % 7 || 7));
    return resultDate.toISOString().split('T')[0];
  };

  const getNextAvailableDate = (dayOfWeek, type) => {
    const existingDates = playdays.map(p => p.date);
    let candidateDate = getNextDayOfWeek(dayOfWeek);

    // Keep finding next date until we find one that doesn't exist
    while (existingDates.includes(candidateDate)) {
      const nextWeek = new Date(candidateDate);
      nextWeek.setDate(nextWeek.getDate() + 1); // Move to next day to avoid same date
      candidateDate = getNextDayOfWeek(dayOfWeek, nextWeek);
    }

    return candidateDate;
  };

  const addNextGameDay = () => {
    const nextSaturday = getNextAvailableDate(6, 'game');
    const id = Math.max(0, ...playdays.map(p => p.id)) + 1;
    const gameMatches = [
      { id: 1, opponent: 'TBD', number: 1 },
      { id: 2, opponent: 'TBD', number: 2 },
      { id: 3, opponent: 'TBD', number: 3 },
    ];
    const newPlaydays = [...playdays, {
      id,
      date: nextSaturday,
      name: `Game Day ${nextSaturday}`,
      type: 'game',
      matches: gameMatches
    }];
    // Sort by date descending
    newPlaydays.sort((a, b) => new Date(b.date) - new Date(a.date));
    setPlaydays(newPlaydays);
    setSelectedPlaydayId(id);
  };

  const addNextTrainingDay = () => {
    const nextWednesday = getNextAvailableDate(3, 'training');
    const id = Math.max(0, ...playdays.map(p => p.id)) + 1;
    const trainingMatch = [
      { id: 1, opponent: 'Training Session', number: 1 },
    ];
    const newPlaydays = [...playdays, {
      id,
      date: nextWednesday,
      name: `Training ${nextWednesday}`,
      type: 'training',
      matches: trainingMatch
    }];
    // Sort by date descending
    newPlaydays.sort((a, b) => new Date(b.date) - new Date(a.date));
    setPlaydays(newPlaydays);
    setSelectedPlaydayId(id);
  };

  const updatePlaydayDate = (playdayId, newDate) => {
    const updated = playdays.map(p => p.id === playdayId ? { ...p, date: newDate } : p);
    setPlaydays(updated);
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
      <div className="flex items-center gap-0.5" title="Fun (Favorite positions assigned)"><span className="text-pink-500"><Icons.Heart /></span><span className="font-semibold text-gray-600">{scores.happiness}%</span></div>
      <div className="flex items-center gap-0.5" title="Skill (Player ratings)"><span className="text-amber-500"><Icons.Zap /></span><span className="font-semibold text-gray-600">{scores.strength}%</span></div>
      <div className="flex items-center gap-0.5" title="Learning opportunities (Untrained positions + low rating/experience)"><span className="text-blue-500"><Icons.Target /></span><span className="font-semibold text-gray-600">{scores.learning}/{scores.filled}</span></div>
      <div className="flex items-center gap-0.5" title={`Allocation Score (based on ${allocationMode === 'game' ? 'Game' : 'Training'} rules)`}><span className="text-emerald-500"><Icons.CheckCircle /></span><span className="font-semibold text-gray-600">{scores.allocationScore}</span></div>
    </div>
  );

  // ==================== SCHEDULE VIEW ====================
  const ScheduleView = () => {
    const sortedPlaydays = [...playdays].sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div><h2 className="text-xl font-bold text-gray-900">Schedule</h2><p className="text-sm text-gray-500">{playdays.length} playday{playdays.length !== 1 ? 's' : ''}</p></div>
          <div className="flex gap-2">
            <button onClick={addNextGameDay} className="flex items-center gap-1.5 text-white px-3 py-2 rounded-xl font-semibold text-sm" style={{ backgroundColor: DIOK.blue }}><Icons.Plus /> Game Day</button>
            <button onClick={addNextTrainingDay} className="flex items-center gap-1.5 text-white px-3 py-2 rounded-xl font-semibold text-sm bg-amber-600 hover:bg-amber-700"><Icons.Plus /> Training</button>
          </div>
        </div>
        <div className="space-y-3">
          {sortedPlaydays.map(playday => {
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
                  <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white font-bold shrink-0 ${playday.type === 'game' ? '' : 'bg-amber-600'}`} style={{ backgroundColor: playday.type === 'game' ? DIOK.blue : undefined }}>
                    <span className="text-lg">{new Date(playday.date).getDate()}</span>
                    <span className="text-[9px] opacity-80">{new Date(playday.date).toLocaleDateString('en', { month: 'short' })}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingPlayday === playday.id ? (
                      <input
                        type="text"
                        defaultValue={playday.name}
                        autoFocus
                        onBlur={(e) => {
                          updatePlaydayName(playday.id, e.target.value);
                          setEditingPlayday(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updatePlaydayName(playday.id, e.target.value);
                            setEditingPlayday(null);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold text-gray-900 bg-white border border-blue-300 rounded px-2 py-1 w-full"
                      />
                    ) : (
                      <div className="font-semibold text-gray-900 hover:text-blue-600 cursor-text" onClick={(e) => { e.stopPropagation(); setEditingPlayday(playday.id); }}>{playday.name}</div>
                    )}
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      {editingPlaydayDate === playday.id ? (
                        <input
                          type="date"
                          defaultValue={playday.date}
                          autoFocus
                          onBlur={(e) => {
                            if (e.target.value) updatePlaydayDate(playday.id, e.target.value);
                            setEditingPlaydayDate(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (e.target.value) updatePlaydayDate(playday.id, e.target.value);
                              setEditingPlaydayDate(null);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm text-gray-700 bg-white border border-blue-300 rounded px-2 py-1"
                        />
                      ) : (
                        <span
                          className="hover:text-blue-600 cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); setEditingPlaydayDate(playday.id); }}
                        >
                          {playday.date}
                        </span>
                      )}
                      <span>· {playday.matches.length} match{playday.matches.length !== 1 ? 'es' : ''}</span>
                    </div>
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
                          <div className="flex-1">
                            {editingMatch === `${playday.id}-${match.id}` ? (
                              <input
                                type="text"
                                defaultValue={match.opponent}
                                autoFocus
                                onBlur={(e) => {
                                  updateMatchOpponent(playday.id, match.id, e.target.value);
                                  setEditingMatch(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    updateMatchOpponent(playday.id, match.id, e.target.value);
                                    setEditingMatch(null);
                                  }
                                }}
                                className="font-medium text-gray-900 bg-white border border-blue-300 rounded px-2 py-1 w-full"
                              />
                            ) : (
                              <div className="font-medium text-gray-900 hover:text-blue-600 cursor-text" onClick={() => setEditingMatch(`${playday.id}-${match.id}`)}>{playday.type === 'game' ? `vs. ${match.opponent}` : match.opponent}</div>
                            )}
                            <div className="text-xs text-gray-500">{playday.type === 'game' ? `Game ${match.number}` : `Training ${match.number}`}</div>
                          </div>
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
  };

  // ==================== SQUAD VIEW ====================
  const SquadView = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-gray-900">Squad</h2><p className="text-sm text-gray-500">{players.length} players · {availablePlayers.length} available</p></div>
        <button onClick={() => setShowAddPlayer(true)} className="flex items-center gap-1.5 text-white px-3 py-2 rounded-xl font-semibold text-sm" style={{ backgroundColor: DIOK.blue }}><Icons.Plus /> Add</button>
      </div>
      <div className="space-y-2">
        {[...players].sort((a, b) => a.name.localeCompare(b.name)).map(player => {
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
                  <div className="text-xs font-medium text-gray-500 mt-3 mb-1">Favorite Positions</div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {positions.map(pos => {
                      const isFav = isFavoritePosition(player.id, pos.id);
                      return (
                        <button key={pos.id} onClick={() => toggleFavoritePosition(player.id, pos.id)}
                          className={`px-2 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${isFav ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'}`}>
                          {isFav && <span className="text-yellow-500">★</span>}#{pos.code}
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

                  {/* Remove Player Button */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => removePlayer(player.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-red-600 font-semibold text-sm transition-colors"
                    >
                      <Icons.Trash />
                      <span>Remove from Team</span>
                    </button>
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
      const { skilled, learning, untrained } = splitCandidates(candidates, selectedPosition?.isBench);

      const PosButton = ({ pos }) => {
        const assignedPlayer = players.find(p => p.id === lineup.assignments[pos.id]);
        const isSelected = selectedPosition?.playdayId === selectedPlayday.id && selectedPosition?.matchId === matchId && selectedPosition?.half === half && selectedPosition?.posId === pos.id && !selectedPosition?.isBench;
        const rating = assignedPlayer ? (ratings[`${assignedPlayer.id}-${pos.id}`] || 0) : 0;
        const isPreferred = assignedPlayer ? isFavoritePosition(assignedPlayer.id, pos.id) : false;

        // Calculate playtime for this player in current playday
        let playdayPlaytime = 0;
        if (assignedPlayer) {
          selectedPlayday.matches.forEach(m => {
            [1, 2].forEach(h => {
              const lineupKey = `${selectedPlayday.id}-${m.id}-${h}`;
              const matchLineup = lineups[lineupKey] || { assignments: {}, bench: [] };
              // Check if player is assigned to any field position (not on bench)
              if (Object.values(matchLineup.assignments).includes(assignedPlayer.id)) {
                playdayPlaytime++;
              }
            });
          });
        }

        const handleDragStart = (e) => {
          if (!assignedPlayer) return;
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('application/json', JSON.stringify({
            playdayId: selectedPlayday.id,
            matchId,
            half,
            posId: pos.id,
            playerId: assignedPlayer.id,
            isBench: false
          }));
        };

        const handleDragOver = (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        };

        const handleDrop = (e) => {
          e.preventDefault();
          const dragData = JSON.parse(e.dataTransfer.getData('application/json'));

          // Only allow drops within the same half
          if (dragData.playdayId !== selectedPlayday.id || dragData.matchId !== matchId || dragData.half !== half) return;

          // Swap the two players
          if (dragData.isBench) {
            // Bench to field: swap bench player with field player
            const key = `${selectedPlayday.id}-${matchId}-${half}`;
            updateLineup(selectedPlayday.id, matchId, half, (prev) => {
              const newAssignments = { ...prev.assignments };
              const newBench = [...(prev.bench || [])];

              // Put field player on bench
              if (assignedPlayer) {
                newBench[dragData.benchIndex] = assignedPlayer.id;
              } else {
                newBench.splice(dragData.benchIndex, 1);
              }

              // Put bench player on field
              newAssignments[pos.id] = dragData.playerId;

              return { ...prev, assignments: newAssignments, bench: newBench };
            });
          } else {
            // Field to field: swap two field positions
            handleSwapPositions(selectedPlayday.id, matchId, half, dragData.playerId, assignedPlayer?.id);
          }
        };

        const handleClick = (e) => {
          // If player is assigned, toggle player info on right-click
          if (assignedPlayer && e.type === 'contextmenu') {
            e.preventDefault();
            const infoKey = `${selectedPlayday.id}-${matchId}-${half}-${pos.id}`;
            setShowPlayerInfo(showPlayerInfo === infoKey ? null : infoKey);
            setShowWhySelected(null); // Close why selected if open
            return;
          }
          setSelectedPosition(isSelected ? null : { playdayId: selectedPlayday.id, matchId, half, posId: pos.id, isBench: false });
        };

        const key = `${selectedPlayday.id}-${matchId}-${half}`;
        const whyKey = `${selectedPlayday.id}-${matchId}-${half}-${pos.id}`;
        const explanation = assignedPlayer && allocationExplanations[key]?.[`${pos.id}-${assignedPlayer.id}`];
        const isTrainedForPosition = assignedPlayer && training[`${assignedPlayer.id}-${pos.id}`];

        return (
          <div className="relative">
            <button
              onClick={handleClick}
              onContextMenu={handleClick}
              draggable={!!assignedPlayer}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center rounded-xl transition-all ${
                isSelected ? 'ring-2 ring-yellow-400 scale-105 bg-white/30' :
                assignedPlayer ? (isTrainedForPosition ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500/60 ring-2 ring-red-400') + ' cursor-move' :
                'bg-white/10 border border-dashed border-white/30 hover:bg-white/20'
              }`}
              style={{ width: '44px', height: '44px' }}>
              <span className="text-[10px] font-bold text-yellow-300">#{pos.code}</span>
              {assignedPlayer ? (
                <>
                  <div className="w-5 h-5 rounded-full bg-white/90 flex items-center justify-center text-[8px] font-bold text-gray-800">{assignedPlayer.name.split(' ').map(n => n[0]).join('')}</div>
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(s => <span key={s} className={`text-[6px] ${s <= rating ? 'text-yellow-300' : 'text-white/30'}`}>★</span>)}
                  </div>
                  <div className="flex items-center gap-0.5">
                    {(playerPositionCounts[assignedPlayer.id]?.[pos.id] || 0) > 0 && (
                      <span className="text-[6px] font-semibold text-blue-200">{playerPositionCounts[assignedPlayer.id][pos.id]}×</span>
                    )}
                    {isPreferred && <span className="text-[7px] text-pink-300">♥</span>}
                  </div>
                </>
            ) : <span className="text-[8px] text-white/50">tap</span>}
          </button>
          {/* Why Selected Popup */}
          {showWhySelected === whyKey && explanation && (
            <div className="absolute z-50 top-full left-0 mt-1 w-48 p-2 bg-blue-50 border-2 border-blue-300 rounded-lg shadow-lg">
              <div className="text-[9px] font-semibold text-blue-800 mb-1">Why selected:</div>
              <div className="space-y-0.5">
                {explanation.explanations.map((exp, idx) => (
                  <div key={idx} className="text-[8px] text-blue-700">• {exp}</div>
                ))}
              </div>
              <div className="text-[8px] text-blue-600 font-semibold mt-1">
                Total: {explanation.score.toFixed(2)} pts
              </div>
              <button
                onClick={() => setShowWhySelected(null)}
                className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center bg-blue-200 hover:bg-blue-300 rounded text-blue-800 text-[10px] font-bold"
              >×</button>
            </div>
          )}

          {/* Player Info Popup (on right-click) */}
          {showPlayerInfo === whyKey && assignedPlayer && (
            <div className="absolute z-50 top-full left-0 mt-1 w-52 p-2 bg-emerald-50 border-2 border-emerald-300 rounded-lg shadow-lg">
              <div className="text-[10px] font-bold text-emerald-800 mb-1">{assignedPlayer.name}</div>
              <div className="space-y-1 text-[9px] text-emerald-700">
                <div className="flex justify-between">
                  <span>Rating at #{pos.code}:</span>
                  <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <span key={s} className={s <= rating ? 'text-yellow-500' : 'text-gray-300'}>★</span>)}</div>
                </div>
                <div className="flex justify-between">
                  <span>Times at #{pos.code}:</span>
                  <span className="font-semibold">{playerPositionCounts[assignedPlayer.id]?.[pos.id] || 0}×</span>
                </div>
                <div className="flex justify-between">
                  <span>Playtime today:</span>
                  <span className="font-semibold">{playdayPlaytime} / {selectedPlayday.matches.length * 2} halves</span>
                </div>
                <div className="flex justify-between">
                  <span>Total playtime:</span>
                  <span className="font-semibold">{fieldHistory[assignedPlayer.id] || 0} halves</span>
                </div>
                {isPreferred && (
                  <div className="text-[8px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <span>★</span><span>Favorite position</span>
                  </div>
                )}
                {!isTrainedForPosition && (
                  <div className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <span>⚠️</span><span>Not trained for this position</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowPlayerInfo(null)}
                className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center bg-emerald-200 hover:bg-emerald-300 rounded text-emerald-800 text-[10px] font-bold"
              >×</button>
            </div>
          )}
        </div>
        );
      };

      const BenchButton = ({ idx }) => {
        const playerId = lineup.bench?.[idx];
        const player = players.find(p => p.id === playerId);
        const isSelected = selectedPosition?.playdayId === selectedPlayday.id && selectedPosition?.matchId === matchId && selectedPosition?.half === half && selectedPosition?.isBench && selectedPosition?.benchIndex === idx;

        // Calculate bench count for this playday only
        let playdayBenchCount = 0;
        if (player) {
          selectedPlayday.matches.forEach(m => {
            [1, 2].forEach(h => {
              const lineupKey = `${selectedPlayday.id}-${m.id}-${h}`;
              const matchLineup = lineups[lineupKey] || { assignments: {}, bench: [] };
              if (matchLineup.bench?.includes(player.id)) playdayBenchCount++;
            });
          });
        }

        const handleDragStart = (e) => {
          if (!player) return;
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('application/json', JSON.stringify({
            playdayId: selectedPlayday.id,
            matchId,
            half,
            benchIndex: idx,
            playerId: player.id,
            isBench: true
          }));
        };

        const handleDragOver = (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        };

        const handleDrop = (e) => {
          e.preventDefault();
          const dragData = JSON.parse(e.dataTransfer.getData('application/json'));

          // Only allow drops within the same half
          if (dragData.playdayId !== selectedPlayday.id || dragData.matchId !== matchId || dragData.half !== half) return;

          if (dragData.isBench) {
            // Bench to bench: swap bench positions
            updateLineup(selectedPlayday.id, matchId, half, (prev) => {
              const newBench = [...(prev.bench || [])];
              const temp = newBench[idx];
              newBench[idx] = dragData.playerId;
              newBench[dragData.benchIndex] = temp;
              return { ...prev, bench: newBench };
            });
          } else {
            // Field to bench: swap field player with bench player
            updateLineup(selectedPlayday.id, matchId, half, (prev) => {
              const newAssignments = { ...prev.assignments };
              const newBench = [...(prev.bench || [])];

              // Put bench player on field
              if (player) {
                newAssignments[dragData.posId] = player.id;
              } else {
                delete newAssignments[dragData.posId];
              }

              // Put field player on bench
              newBench[idx] = dragData.playerId;

              return { ...prev, assignments: newAssignments, bench: newBench };
            });
          }
        };

        return (
          <button
            onClick={() => setSelectedPosition(isSelected ? null : { playdayId: selectedPlayday.id, matchId, half, posId: null, isBench: true, benchIndex: idx })}
            draggable={!!player}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center rounded-xl transition-all ${isSelected ? 'ring-2 ring-yellow-400 scale-105 bg-white/30' : player ? 'bg-white/20 hover:bg-white/30 cursor-move' : 'bg-white/10 border border-dashed border-white/30 hover:bg-white/20'}`}
            style={{ width: '40px', height: '44px' }}>
            <span className="text-[9px] font-bold text-white/60">B{idx + 1}</span>
            {player ? (
              <>
                <div className="w-5 h-5 rounded-full bg-white/90 flex items-center justify-center text-[7px] font-bold text-gray-800">{player.name.split(' ').map(n => n[0]).join('')}</div>
                <div className="flex gap-0.5 mt-0.5">{[1,2,3].map(i => <div key={i} className={`w-1 h-1 rounded-full ${i <= playdayBenchCount ? 'bg-orange-400' : 'bg-white/30'}`} />)}</div>
              </>
            ) : <span className="text-[7px] text-white/40">tap</span>}
          </button>
        );
      };

      const PlayerRow = ({ p, onClick, isAlt, forBench, isUntrained, gameMode }) => (
        <button onClick={onClick} disabled={p.isAssignedElsewhereInHalf}
          className={`w-full text-left p-1.5 rounded-lg transition-all border text-xs ${
            p.isCurrentlyHere ? 'bg-blue-50 border-blue-300' :
            p.isAssignedElsewhereInHalf ? 'bg-gray-100 border-gray-200 opacity-40 cursor-not-allowed' :
            p.isOnBench && !forBench ? 'bg-purple-50 border-purple-200 hover:bg-purple-100' :
            isUntrained ? (gameMode ? 'bg-red-50 border-red-300 hover:bg-red-100' : 'bg-orange-50 border-orange-200 hover:bg-orange-100') :
            isAlt ? 'bg-amber-50 border-amber-200 hover:bg-amber-100' :
            'bg-white border-gray-200 hover:bg-gray-50'
          }`}>
          <div className="flex items-center gap-1.5">
            {p.isOnBench && !forBench && <span className="text-[9px] font-semibold text-purple-600 bg-purple-100 px-1 rounded">BENCH</span>}
            <div className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: DIOK.blue }}>{p.name.split(' ').map(n => n[0]).join('')}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-medium text-gray-900 truncate">{p.name.split(' ')[0]}</span>
                {isUntrained && <span className="text-red-500 text-[10px]">⚠️</span>}
                {p.isPreferred && !forBench && !isUntrained && <span className="text-yellow-500">★</span>}
                {!forBench && p.timesAtPosition > 0 && <span className="text-[9px] font-semibold text-blue-600 bg-blue-50 px-1 rounded">{p.timesAtPosition}×</span>}
              </div>
              {forBench ? <BenchIndicator count={p.playdayBenchCount || 0} /> : isUntrained ? <div className="text-[9px] text-red-600 font-medium">Not trained</div> : <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <span key={s} className={`text-[9px] ${s <= p.rating ? 'text-yellow-500' : 'text-gray-300'}`}>★</span>)}</div>}
            </div>
          </div>
          {p.isAssignedElsewhereInHalf && <div className="text-[9px] text-red-500 flex items-center gap-0.5 mt-0.5"><Icons.AlertTriangle /> Already assigned</div>}
        </button>
      );

      return (
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <button onClick={() => copyPreviousLineup(selectedPlayday.id, matchId, half)} disabled={halfIndex === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${halfIndex === 0 ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
              <Icons.Copy /> Copy Previous
            </button>
            <div className="flex items-center gap-0 border border-amber-200 rounded-lg overflow-hidden">
              <button onClick={() => proposeLineup(selectedPlayday.id, matchId, half, 'game')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors border-r border-amber-200">
                <Icons.Wand /> 🏆 Game
              </button>
              <button onClick={() => proposeLineup(selectedPlayday.id, matchId, half, 'training')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">
                <Icons.Wand /> 📚 Training
              </button>
            </div>
            <button onClick={() => clearLineup(selectedPlayday.id, matchId, half)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 transition-colors">
              <Icons.Trash /> Clear
            </button>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              💡 Drag & drop to swap positions
            </div>
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

                  {/* Show allocation explanation if available */}
                  {!selectedPosition.isBench && allocationExplanations[key]?.[`${selectedPosition.posId}-${lineup.assignments[selectedPosition.posId]}`] && (
                    <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-[9px] font-semibold text-blue-800 mb-1">Why selected:</div>
                      <div className="space-y-0.5">
                        {allocationExplanations[key][`${selectedPosition.posId}-${lineup.assignments[selectedPosition.posId]}`].explanations.map((exp, idx) => (
                          <div key={idx} className="text-[8px] text-blue-700">• {exp}</div>
                        ))}
                      </div>
                      <div className="text-[8px] text-blue-600 font-semibold mt-1">
                        Total: {allocationExplanations[key][`${selectedPosition.posId}-${lineup.assignments[selectedPosition.posId]}`].score.toFixed(2)} pts
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-auto">
                    {!selectedPosition.isBench && skilled.length > 0 && <div className="mb-2"><div className="text-[10px] font-semibold text-emerald-600 mb-1 px-1" title={`Players with >${learningPlayerConfig.maxStars} stars or >${learningPlayerConfig.maxGames} games at this position`}>✓ Skilled Players</div><div className="space-y-1">{skilled.map(p => <PlayerRow key={p.id} p={p} onClick={() => handleAssignPlayer(p.id)} />)}</div></div>}
                    {!selectedPosition.isBench && learning.length > 0 && <div className="mb-2"><div className="text-[10px] font-semibold text-amber-600 mb-1 px-1" title={`Players with ≤${learningPlayerConfig.maxStars} stars and ≤${learningPlayerConfig.maxGames} games at this position`}>◐ Learning Players</div><div className="space-y-1">{learning.map(p => <PlayerRow key={p.id} p={p} onClick={() => handleAssignPlayer(p.id)} isAlt />)}</div></div>}
                    {!selectedPosition.isBench && untrained.length > 0 && <div className="mb-2"><div className="text-[10px] font-semibold text-gray-600 mb-1 px-1 flex items-center gap-1" title="Players not trained for this position"><span>📝</span><span>Untrained Players</span></div><div className="space-y-1">{untrained.map(p => <PlayerRow key={p.id} p={p} onClick={() => handleAssignPlayer(p.id)} isUntrained gameMode={selectedPlayday.type === 'game'} />)}</div></div>}
                    {selectedPosition.isBench && candidates.filter(p => !p.isAssignedElsewhereInHalf).length > 0 && <div className="mb-1"><div className="text-[10px] font-semibold text-gray-600 mb-1 px-1" title="Dots show how many times on bench this game day">Available Players</div><div className="space-y-1">{candidates.filter(p => !p.isAssignedElsewhereInHalf).map(p => <PlayerRow key={p.id} p={p} onClick={() => handleAssignPlayer(p.id)} forBench />)}</div></div>}
                    {!selectedPosition.isBench && skilled.length === 0 && learning.length === 0 && untrained.length === 0 && <div className="text-xs text-gray-400 text-center p-4">No available players</div>}
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

        {/* Full Day Auto-Propose Buttons */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <div className="text-sm font-semibold text-purple-900 mb-0.5">⚡ Auto-Propose Full Day</div>
              <p className="text-xs text-purple-700">Optimize all {selectedPlayday.matches.length} matches ({allHalves.length} halves) at once for better overall balance</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => proposeFullDay(selectedPlayday.id, 'game')}
                className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                title="Auto-propose all halves (Game mode)">
                <span className="text-xs">🏆</span>
              </button>
              <button
                onClick={() => proposeFullDay(selectedPlayday.id, 'training')}
                className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                title="Auto-propose all halves (Training mode)">
                <span className="text-xs">📚</span>
              </button>
              <button
                onClick={() => clearFullDay(selectedPlayday.id)}
                className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                title="Clear all lineups for this day">
                <Icons.Trash />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {allHalves.map(({ matchId, half, opponent, number, key }) => {
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
                        <div><div className="font-semibold text-gray-900 text-sm">{selectedPlayday.type === 'game' ? `vs. ${opponent}` : opponent}</div><div className="text-xs text-gray-500">{selectedPlayday.type === 'game' ? `Game ${number}` : `Training ${number}`} · Half {half}</div></div>
                        <div className="flex flex-col items-end gap-0.5"><ScoreBadge scores={scores} /><span className="text-[9px] text-gray-400">{scores.filled}/12 + {scores.bench}B</span></div>
                      </div>
                    </div>
                    <div className={`transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}><Icons.ChevronDown /></div>
                  </div>
                  {!isExpanded && (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {renderCollapsedView(matchId, half)}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => proposeLineup(selectedPlayday.id, matchId, half, 'game')}
                          className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                          title="Auto-propose (Game mode)">
                          <span className="text-xs">🏆</span>
                        </button>
                        <button
                          onClick={() => proposeLineup(selectedPlayday.id, matchId, half, 'training')}
                          className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                          title="Auto-propose (Training mode)">
                          <span className="text-xs">📚</span>
                        </button>
                        <button
                          onClick={() => clearLineup(selectedPlayday.id, matchId, half)}
                          className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                          title="Clear lineup">
                          <Icons.Trash />
                        </button>
                      </div>
                    </div>
                  )}
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

    // Get all halves for this playday
    const playdayHalves = selectedPlayday.matches.flatMap(m => [
      { matchId: m.id, half: 1, opponent: m.opponent, number: m.number, key: `${selectedPlayday.id}-${m.id}-1` },
      { matchId: m.id, half: 2, opponent: m.opponent, number: m.number, key: `${selectedPlayday.id}-${m.id}-2` },
    ]);

    const getPlayerAssignment = (playerId, matchId, half) => {
      const key = `${selectedPlayday.id}-${matchId}-${half}`;
      const lineup = lineups[key] || { assignments: {}, bench: [] };
      const posId = Object.entries(lineup.assignments).find(([k, v]) => v === playerId)?.[0];
      if (posId) return { type: 'field', pos: positions.find(p => p.id === parseInt(posId)) };
      if (lineup.bench?.includes(playerId)) return { type: 'bench' };
      return null;
    };

    // Calculate overall statistics across all halves
    const calculateOverallStats = () => {
      let totalStrength = 0;
      let totalHappiness = 0;
      let totalLearning = 0;
      let assignmentCount = 0;

      playdayHalves.forEach(({ matchId, half }) => {
        const key = `${selectedPlayday.id}-${matchId}-${half}`;
        const lineup = lineups[key] || { assignments: {}, bench: [] };

        // Only count field assignments (not bench)
        Object.entries(lineup.assignments).forEach(([posId, playerId]) => {
          const player = players.find(p => p.id === playerId);
          if (!player) return;

          const posIdNum = parseInt(posId);
          const ratingKey = `${playerId}-${posIdNum}`;
          const rating = ratings[ratingKey] || 1;

          // Strength: player skill rating (1-5 stars)
          totalStrength += rating;

          // Happiness: favorite position gives 5 points, otherwise 1
          const isFavoritePos = (favoritePositions[playerId] || []).includes(posIdNum);
          totalHappiness += isFavoritePos ? 5 : 1;

          // Learning: lower ratings indicate learning opportunities
          totalLearning += rating <= 2 ? 5 : rating === 3 ? 3 : 1;

          assignmentCount++;
        });
      });

      // Calculate averages and percentages
      const avgStrength = assignmentCount > 0 ? (totalStrength / assignmentCount) : 0;
      const avgHappiness = assignmentCount > 0 ? (totalHappiness / assignmentCount) : 0;
      const avgLearning = assignmentCount > 0 ? (totalLearning / assignmentCount) : 0;

      // Convert to percentages (max values: strength=5, happiness=5, learning=5)
      const strengthPct = (avgStrength / 5) * 100;
      const happinessPct = (avgHappiness / 5) * 100;
      const learningPct = (avgLearning / 5) * 100;

      return { strengthPct, happinessPct, learningPct, assignmentCount };
    };

    const overallStats = calculateOverallStats();

    return (
      <div className="space-y-4">
        <div><h2 className="text-xl font-bold text-gray-900">Planning Overview</h2><p className="text-sm text-gray-500">{selectedPlayday.name} · {selectedPlayday.matches.length} matches</p></div>

        {/* Overall Statistics */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <div className="font-semibold text-gray-900 mb-3">Overall Statistics</div>
          <div className="grid grid-cols-3 gap-4">
            {/* Strength */}
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
              <div className="text-xs font-semibold text-blue-800 mb-2 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                Strength
              </div>
              <div className="text-2xl font-bold text-blue-600">{Math.round(overallStats.strengthPct)}%</div>
              <div className="mt-2 h-2 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${overallStats.strengthPct}%` }} />
              </div>
              <div className="text-[10px] text-blue-600 mt-1">Player skill utilization</div>
            </div>

            {/* Satisfaction */}
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
              <div className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1">
                <span className="text-sm">😊</span>
                Satisfaction
              </div>
              <div className="text-2xl font-bold text-amber-600">{Math.round(overallStats.happinessPct)}%</div>
              <div className="mt-2 h-2 bg-amber-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${overallStats.happinessPct}%` }} />
              </div>
              <div className="text-[10px] text-amber-600 mt-1">Preferred position matches</div>
            </div>

            {/* Learning */}
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
              <div className="text-xs font-semibold text-emerald-800 mb-2 flex items-center gap-1">
                <span className="text-sm">📚</span>
                Learning
              </div>
              <div className="text-2xl font-bold text-emerald-600">{Math.round(overallStats.learningPct)}%</div>
              <div className="mt-2 h-2 bg-emerald-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${overallStats.learningPct}%` }} />
              </div>
              <div className="text-[10px] text-emerald-600 mt-1">Development opportunities</div>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-3 text-center">
            Based on {overallStats.assignmentCount} field assignments across {playdayHalves.length} halves
          </div>
        </div>
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
                  <th className="text-center p-2 font-semibold text-gray-700 min-w-[50px]">Field/Bench</th>
                  <th className="text-center p-2 font-semibold text-gray-700 min-w-[60px]">😊 Fun</th>
                  <th className="text-center p-2 font-semibold text-gray-700 min-w-[60px]">📚 Learning</th>
                  <th className="text-center p-2 font-semibold text-gray-700 min-w-[80px]">Satisfaction</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Calculate player stats - only for available players
                  const availablePlayers = players.filter(p => {
                    const avail = availability[p.id];
                    return !avail || avail === 'available';
                  });

                  const playerStats = availablePlayers.map(player => {
                    let totalField = 0, totalBench = 0, funCount = 0, learningCount = 0;

                    playdayHalves.forEach(h => {
                      const assignment = getPlayerAssignment(player.id, h.matchId, h.half);
                      if (assignment?.type === 'field') {
                        totalField++;
                        // Check if it's a favorite position
                        const isFav = (favoritePositions[player.id] || []).includes(assignment.pos?.id);
                        if (isFav) funCount++;

                        // Check if it's a learning opportunity (rating <= 2)
                        const ratingKey = `${player.id}-${assignment.pos?.id}`;
                        const rating = ratings[ratingKey] || 1;
                        if (rating <= 2) learningCount++;
                      }
                      if (assignment?.type === 'bench') totalBench++;
                    });

                    // Calculate satisfaction score (0-100) using configured weights
                    const fieldScore = (totalField / playdayHalves.length) * satisfactionWeights.fieldTime;
                    const funScore = totalField > 0 ? (funCount / totalField) * satisfactionWeights.fun : 0;
                    const learningScore = totalField > 0 ? Math.min((learningCount / totalField) * satisfactionWeights.learning, satisfactionWeights.learning) : 0;
                    const benchScore = totalBench <= 2 ? satisfactionWeights.benchFairness : Math.max(0, satisfactionWeights.benchFairness - (totalBench - 2) * 3);
                    const satisfaction = Math.min(100, fieldScore + funScore + learningScore + benchScore); // Cap at 100

                    // Build detailed breakdown for tooltip
                    const halfDetails = playdayHalves.map(h => {
                      const assignment = getPlayerAssignment(player.id, h.matchId, h.half);
                      if (!assignment) return null;

                      if (assignment.type === 'bench') {
                        return `Match ${h.matchId} H${h.half}: Bench`;
                      } else {
                        const posName = assignment.pos?.name || assignment.pos?.id || '?';
                        const isFav = (favoritePositions[player.id] || []).includes(assignment.pos?.id);
                        const ratingKey = `${player.id}-${assignment.pos?.id}`;
                        const rating = ratings[ratingKey] || 1;
                        const isLearning = rating <= 2;
                        const favMarker = isFav ? ' ⭐' : '';
                        const learningMarker = isLearning ? ' 📚' : '';
                        return `Match ${h.matchId} H${h.half}: ${posName}${favMarker}${learningMarker}`;
                      }
                    }).filter(Boolean).join('\n');

                    return {
                      player,
                      totalField,
                      totalBench,
                      funCount,
                      learningCount,
                      satisfaction,
                      halfDetails
                    };
                  }).sort((a, b) => a.satisfaction - b.satisfaction); // Sort by satisfaction ascending (lowest first)

                  // Calculate mean and standard deviation for satisfaction
                  const satisfactions = playerStats.map(s => s.satisfaction);
                  const meanSatisfaction = satisfactions.reduce((a, b) => a + b, 0) / satisfactions.length;
                  const variance = satisfactions.reduce((sum, val) => sum + Math.pow(val - meanSatisfaction, 2), 0) / satisfactions.length;
                  const stdDev = Math.sqrt(variance);

                  return playerStats.map(({ player, totalField, totalBench, funCount, learningCount, satisfaction, halfDetails }) => {
                    // Determine if outlier (more than 1 std dev from mean)
                    const isLowOutlier = satisfaction < (meanSatisfaction - stdDev);
                    const isHighOutlier = satisfaction > (meanSatisfaction + stdDev);

                    const satisfactionColor = isLowOutlier ? 'bg-red-100 text-red-700 border-red-300' :
                                             isHighOutlier ? 'bg-green-100 text-green-700 border-green-300' :
                                             'bg-gray-100 text-gray-700 border-gray-300';

                    return (
                      <tr key={player.id} className="border-b border-gray-100">
                        <td className="p-2 sticky left-0 bg-white">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: DIOK.blue }}>{player.name.split(' ').map(n => n[0]).join('')}</div>
                            <span className="font-medium text-gray-900 truncate">{player.name}</span>
                          </div>
                        </td>
                        <td className="text-center p-2">
                          <span className="text-emerald-600 font-semibold">{totalField}</span>
                          <span className="text-gray-300 mx-0.5">/</span>
                          <span className="text-orange-500">{totalBench}</span>
                        </td>
                        <td className="text-center p-2">
                          <div className="inline-flex items-center gap-1">
                            <span className="font-semibold text-amber-600">{funCount}</span>
                            <span className="text-gray-400 text-[10px]">/ {totalField}</span>
                          </div>
                        </td>
                        <td className="text-center p-2">
                          <div className="inline-flex items-center gap-1">
                            <span className="font-semibold text-emerald-600">{learningCount}</span>
                            <span className="text-gray-400 text-[10px]">/ {totalField}</span>
                          </div>
                        </td>
                        <td className="text-center p-2">
                          <div
                            className={`inline-flex items-center justify-center px-2 py-1 rounded-lg border font-semibold ${satisfactionColor} cursor-help`}
                            title={`${player.name} - Satisfaction: ${Math.round(satisfaction)}%\n\nAssignments:\n${halfDetails}\n\nSummary:\n- Field: ${totalField} halves\n- Bench: ${totalBench} halves\n- Favorite positions: ${funCount}/${totalField}\n- Learning opportunities: ${learningCount}/${totalField}`}
                          >
                            {Math.round(satisfaction)}%
                            {isLowOutlier && <span className="ml-1 text-[10px]">⚠️</span>}
                            {isHighOutlier && <span className="ml-1 text-[10px]">⭐</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {/* Satisfaction Formula Explanation Modal */}
        {showSatisfactionExplanation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSatisfactionExplanation(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between rounded-t-2xl">
                <h3 className="text-lg font-bold text-gray-900">📊 Satisfaction Score Formula</h3>
                <button
                  onClick={() => setShowSatisfactionExplanation(false)}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 font-bold transition-colors"
                >×</button>
              </div>

              <div className="p-6 space-y-6">
                {/* Overview */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">What is Satisfaction Score?</h4>
                  <p className="text-sm text-blue-800">
                    The satisfaction score (0-100%) measures how well each player's experience balances playing time,
                    enjoyment (favorite positions), development (learning opportunities), and fairness (bench rotation).
                  </p>
                </div>

                {/* Formula Breakdown */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Formula Components</h4>
                  <div className="space-y-3">
                    {/* Field Time */}
                    <div className="border border-gray-200 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-emerald-700">⚽ Field Time</span>
                        <span className="text-sm font-bold text-emerald-600">40%</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">How much actual playing time the player gets.</p>
                      <div className="bg-gray-50 rounded p-2 font-mono text-xs">
                        Score = (Field Appearances ÷ Total Halves) × 40
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Example: 4 field appearances in 6 halves = (4/6) × 40 = 26.7 points
                      </p>
                    </div>

                    {/* Fun Factor */}
                    <div className="border border-gray-200 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-amber-700">😊 Fun Factor</span>
                        <span className="text-sm font-bold text-amber-600">30%</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">How often the player plays in their favorite positions.</p>
                      <div className="bg-gray-50 rounded p-2 font-mono text-xs">
                        Score = (Favorite Position Plays ÷ Field Appearances) × 30
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Example: 2 favorite position plays in 4 field appearances = (2/4) × 30 = 15 points
                      </p>
                    </div>

                    {/* Learning */}
                    <div className="border border-gray-200 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-emerald-700">📚 Learning Opportunities</span>
                        <span className="text-sm font-bold text-emerald-600">20%</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">Balanced development through new/challenging positions (≤2 stars).</p>
                      <div className="bg-gray-50 rounded p-2 font-mono text-xs">
                        Score = min((Learning Plays ÷ Field Appearances) × 20, 20)
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Example: 1 learning play in 4 field appearances = (1/4) × 20 = 5 points<br/>
                        Note: Capped at 20 to balance learning with competence
                      </p>
                    </div>

                    {/* Bench Fairness */}
                    <div className="border border-gray-200 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-orange-700">🪑 Bench Fairness</span>
                        <span className="text-sm font-bold text-orange-600">10%</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">Fair distribution of bench time across all players.</p>
                      <div className="bg-gray-50 rounded p-2 font-mono text-xs">
                        If bench ≤ 2: Score = 10<br/>
                        If bench > 2: Score = max(0, 10 - (bench - 2) × 3)
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Example: 1 bench = 10 points | 3 bench = 7 points | 5 bench = 1 point
                      </p>
                    </div>
                  </div>
                </div>

                {/* Total Formula */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Total Satisfaction Score</h4>
                  <div className="bg-white rounded-lg p-3 font-mono text-sm">
                    Satisfaction = Field Time + Fun + Learning + Bench Fairness
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Maximum possible score: 100% (40 + 30 + 20 + 10)
                  </p>
                </div>

                {/* Color Coding */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Color Indicators</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1 rounded-lg bg-red-100 text-red-700 border border-red-300 font-semibold text-xs">
                        45% ⚠️
                      </div>
                      <span className="text-sm text-gray-700">
                        <strong>Red:</strong> Below average (more than 1 standard deviation below mean) - needs attention
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 border border-gray-300 font-semibold text-xs">
                        58%
                      </div>
                      <span className="text-sm text-gray-700">
                        <strong>Gray:</strong> Average satisfaction (within 1 standard deviation of mean)
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1 rounded-lg bg-green-100 text-green-700 border border-green-300 font-semibold text-xs">
                        78% ⭐
                      </div>
                      <span className="text-sm text-gray-700">
                        <strong>Green:</strong> Above average (more than 1 standard deviation above mean) - thriving
                      </span>
                    </div>
                  </div>
                </div>

                {/* Statistical Analysis */}
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <h4 className="font-semibold text-purple-900 mb-2">📈 Statistical Analysis</h4>
                  <p className="text-xs text-purple-800">
                    Outlier detection uses standard deviation to identify players whose satisfaction significantly differs
                    from the team average. This helps coaches quickly spot players who may need schedule adjustments
                    or additional attention to improve their experience.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setShowSatisfactionExplanation(false)}
                    className="px-4 py-2 rounded-lg font-semibold text-white transition-colors"
                    style={{ backgroundColor: DIOK.blue }}
                  >
                    Got it!
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==================== RULES VIEW ====================
  // ==================== ADMIN VIEW ====================
  const AdminView = () => {
    const groupedHistory = loginHistory.reduce((acc, log) => {
      const date = new Date(log.logged_in_at).toLocaleDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(log);
      return acc;
    }, {});

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="text-sm text-gray-500">Login activity and system overview</p>
        </div>


        {/* Currently Online */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Currently Online ({activeUsers.length + 1})</h3>
          {/* Show current user */}
          <div className="mb-2">
            <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{currentUsername || 'You'} <span className="text-xs text-blue-600">(you)</span></div>
                <div className="text-xs text-gray-500">Current session</div>
              </div>
            </div>
          </div>
          {activeUsers.length === 0 ? (
            <p className="text-sm text-gray-400">No other users online</p>
          ) : (
            <div className="space-y-2">
              {activeUsers.map(user => (
                <div key={user.session_id} className="flex items-center gap-3 p-2 bg-emerald-50 rounded-lg">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{user.username}</div>
                    <div className="text-xs text-gray-500">Last seen: {new Date(user.last_seen).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Login History */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Login History</h3>
            <p className="text-xs text-gray-500">Last 100 logins</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {Object.keys(groupedHistory).length === 0 ? (
              <p className="text-sm text-gray-400 p-4">No login history yet</p>
            ) : (
              Object.entries(groupedHistory).map(([date, logs]) => (
                <div key={date} className="border-b border-gray-100 last:border-0">
                  <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-700">{date}</div>
                  <div className="divide-y divide-gray-100">
                    {logs.map((log, idx) => (
                      <div key={idx} className="px-4 py-2 flex items-center justify-between hover:bg-gray-50">
                        <div>
                          <div className="font-semibold text-sm text-gray-900">{log.username}</div>
                          <div className="text-xs text-gray-500">Session: {log.session_id.slice(0, 20)}...</div>
                        </div>
                        <div className="text-xs text-gray-500">{new Date(log.logged_in_at).toLocaleTimeString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Log */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Action Log</h3>
            <p className="text-xs text-gray-500">Recent user activities (last 100 actions)</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {actionLog.length === 0 ? (
              <p className="text-sm text-gray-400 p-4">No actions logged yet</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {actionLog.map((action, idx) => {
                  const actionIcon = {
                    'save_data': '💾',
                    'get_updates': '⟳',
                    'auto_propose_lineup': '🏆',
                    'auto_propose_full_day': '⚡',
                    'clear_lineup': '🗑️',
                  }[action.action_type] || '📝';

                  const actionLabel = {
                    'save_data': 'Saved changes',
                    'get_updates': 'Got updates',
                    'auto_propose_lineup': 'Auto-proposed lineup',
                    'auto_propose_full_day': 'Auto-proposed full day',
                    'clear_lineup': 'Cleared lineup',
                  }[action.action_type] || action.action_type;

                  return (
                    <div key={idx} className="px-4 py-3 hover:bg-gray-50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 flex-1">
                          <span className="text-lg">{actionIcon}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm text-gray-900">{action.username}</span>
                              <span className="text-xs text-gray-500">·</span>
                              <span className="text-xs text-gray-600">{actionLabel}</span>
                            </div>
                            {action.details && Object.keys(action.details).length > 0 && (
                              <div className="text-xs text-gray-500 space-y-0.5">
                                {action.details.playday && (
                                  <div>📅 {action.details.playday} {action.details.match && `vs ${action.details.match}`}</div>
                                )}
                                {action.details.half && <div>🕐 {action.details.half}</div>}
                                {action.details.mode && <div>⚙️ Mode: {action.details.mode}</div>}
                                {action.details.hasConflict && <div>⚠️ Overwrote remote changes</div>}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 whitespace-nowrap">
                          {new Date(action.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const RulesView = () => {
    const activeRules = allocationRules[allocationMode];

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Rules Configuration</h2>
          <p className="text-sm text-gray-500">Configure allocation rules and player satisfaction formula</p>
        </div>

        {/* Allocation Rules Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Allocation Rules</h3>
            <p className="text-xs text-gray-500">Configure validation and optimization for auto-propose</p>
          </div>

          {/* Allocation Formula */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <div className="text-xs font-semibold text-blue-800 mb-2">Allocation Formula</div>
            <div className="text-xs text-blue-700 mb-2">
              Player-Position Score = Σ (Rule Weight × Rule Contribution)
            </div>
            <div className="text-xs text-blue-600 font-mono bg-white/50 p-2 rounded">
              Score = {activeRules.filter(r => r.enabled && r.type === 'SOFT').map((r, i) =>
                `${i > 0 ? ' + ' : ''}(${Math.round(r.weight * 100)}% × ${r.name.split(' ')[0]})`
              ).join('')}
            </div>
          </div>

          {/* Rules Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th colSpan="5" className="py-3 px-3">
                    <div className="flex items-center justify-between">
                      <span className="text-left font-semibold text-gray-700">Mode Selection</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setAllocationMode('game')}
                          className={`py-1.5 px-3 rounded-lg font-semibold text-xs transition-all ${
                            allocationMode === 'game'
                              ? 'text-white shadow-md'
                              : 'bg-white text-gray-600 border border-gray-200'
                          }`}
                          style={{ backgroundColor: allocationMode === 'game' ? DIOK.blue : undefined }}
                        >
                          🏆 Game
                        </button>
                        <button
                          onClick={() => setAllocationMode('training')}
                          className={`py-1.5 px-3 rounded-lg font-semibold text-xs transition-all ${
                            allocationMode === 'training'
                              ? 'text-white shadow-md'
                              : 'bg-white text-gray-600 border border-gray-200'
                          }`}
                          style={{ backgroundColor: allocationMode === 'training' ? DIOK.blue : undefined }}
                        >
                          📚 Training
                        </button>
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-600 mt-1.5 text-left">
                      {allocationMode === 'game'
                        ? '🏆 Optimized for winning - emphasizes skill ratings and player preferences'
                        : '📚 Optimized for development - emphasizes fairness and position variety'}
                    </div>
                  </th>
                </tr>
                <tr>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Rule</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700">Config</th>
                  <th className="text-center py-2 px-2 font-semibold text-gray-700">Type</th>
                  <th className="text-center py-2 px-2 font-semibold text-gray-700">Enabled</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700">Weight</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-gray-100">
              {activeRules.map((rule) => (
                <tr key={rule.id} className={`${rule.enabled ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50/30 transition-colors`}>
                  {/* Rule */}
                  <td className="py-3 px-3">
                    <div className="flex items-start gap-2">
                      {rule.locked && <span className="text-[10px] mt-0.5">🔒</span>}
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-0.5">{rule.name}</div>
                        <div className="text-[11px] text-gray-500">{rule.description}</div>
                      </div>
                    </div>
                  </td>
                  {/* Config */}
                  <td className="py-3 px-3">
                    {rule.type === 'SOFT' && rule.enabled && rule.id === 3 ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={rule.limit || 6}
                          onChange={(e) => {
                            const newLimit = parseInt(e.target.value);
                            setAllocationRules(prev => ({
                              ...prev,
                              [allocationMode]: prev[allocationMode].map(r =>
                                r.id === rule.id ? { ...r, limit: newLimit } : r
                              ),
                            }));
                          }}
                          className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, ${DIOK.blue} 0%, ${DIOK.blue} ${((rule.limit || 6) / 20) * 100}%, #e5e7eb ${((rule.limit || 6) / 20) * 100}%, #e5e7eb 100%)`
                          }}
                        />
                        <span className="text-sm font-bold text-gray-900 w-8 text-right">{rule.limit || 6}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-center block">—</span>
                    )}
                  </td>
                  {/* Type */}
                  <td className="py-3 px-2 text-center">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                      rule.type === 'HARD' ? 'bg-red-100 text-red-700' :
                      rule.type === 'CONFIG' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {rule.type}
                    </span>
                  </td>
                  {/* Enabled */}
                  <td className="py-3 px-2 text-center">
                    <button
                      onClick={() => toggleRule(rule.id)}
                      disabled={rule.locked}
                      className={`relative w-10 h-5 rounded-full transition-colors inline-block ${
                        rule.enabled ? 'bg-emerald-500' : 'bg-gray-300'
                      } ${rule.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                        rule.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </td>
                  {/* Weight */}
                  <td className="py-3 px-3">
                    {rule.type === 'SOFT' && rule.enabled ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={Math.round(rule.weight * 100)}
                          onChange={(e) => updateRuleWeight(rule.id, parseInt(e.target.value))}
                          className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, ${DIOK.blue} 0%, ${DIOK.blue} ${rule.weight * 100}%, #e5e7eb ${rule.weight * 100}%, #e5e7eb 100%)`
                          }}
                        />
                        <span className="text-sm font-bold text-gray-900 w-10 text-right">{Math.round(rule.weight * 100)}%</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-center block">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* How Rules Work */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="text-sm font-semibold text-gray-900 mb-2">How Rules Work</div>
          <div className="space-y-2 text-xs text-gray-600">
            <div><strong>HARD:</strong> Constraints that must be satisfied (cannot be disabled)</div>
            <div><strong>SOFT:</strong> Optimization goals weighted by importance (higher weight = stronger influence)</div>
            <div><strong>CONFIG:</strong> Settings that filter or configure allocation behavior</div>
          </div>
        </div>
      </div>

      {/* Learning Player Definition Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Learning Player Definition</h3>
          <p className="text-xs text-gray-500">Define when a player is considered "learning" at a position</p>
        </div>

        <div className="space-y-3">
          {/* Blue explanation box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <div className="text-xs font-semibold text-blue-800 mb-2">📚 Learning Player Definition</div>
            <p className="text-xs text-blue-700">
              Define when a player is considered "learning" at a position. Learning players appear in the amber "Learning Players" section when selecting positions.
            </p>
            <div className="mt-2 text-xs text-blue-700">
              A player is a <span className="font-bold">Learning Player</span> at a position if they meet <span className="font-bold">BOTH</span> criteria below:
            </div>
          </div>

          {/* White controls box */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="space-y-4">
              {/* Max Stars Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-700">Maximum Star Rating</label>
                  <span className="text-sm font-bold" style={{ color: DIOK.blue }}>{learningPlayerConfig.maxStars} ★</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={learningPlayerConfig.maxStars}
                  onChange={(e) => setLearningPlayerConfig(prev => ({ ...prev, maxStars: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: DIOK.blue }}
                />
                <p className="text-xs text-gray-600 mt-1">
                  Players with ≤ {learningPlayerConfig.maxStars} {learningPlayerConfig.maxStars === 1 ? 'star' : 'stars'} at this position
                </p>
              </div>

              {/* Max Games Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-700">Maximum Games Played</label>
                  <span className="text-sm font-bold" style={{ color: DIOK.blue }}>{learningPlayerConfig.maxGames}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={learningPlayerConfig.maxGames}
                  onChange={(e) => setLearningPlayerConfig(prev => ({ ...prev, maxGames: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: DIOK.blue }}
                />
                <p className="text-xs text-gray-600 mt-1">
                  Players with ≤ {learningPlayerConfig.maxGames} {learningPlayerConfig.maxGames === 1 ? 'game' : 'games'} at this position
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Player Satisfaction Formula Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Player Satisfaction Formula</h3>
          <p className="text-xs text-gray-500">Configure how player satisfaction is calculated in Overview</p>
        </div>

        <div className="space-y-3">
          {/* Blue explanation box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <div className="text-xs font-semibold text-blue-800 mb-2">😊 Satisfaction Score Components</div>
            <p className="text-xs text-blue-700 mb-2">
              Configure how player satisfaction is calculated in the Overview screen. Satisfaction score measures how well each player's experience balances playing time, enjoyment, development, and fairness.
            </p>
            <div className="text-xs text-blue-700 font-mono bg-white/50 p-2 rounded">
              Satisfaction = (Field Time × {satisfactionWeights.fieldTime}%) + (Fun × {satisfactionWeights.fun}%) + (Learning × {satisfactionWeights.learning}%) + (Bench Fairness × {satisfactionWeights.benchFairness}%)
            </div>
            <div className="text-xs text-blue-700 mt-2">
              <strong>Total must equal 100%:</strong> Current = {satisfactionWeights.fieldTime + satisfactionWeights.fun + satisfactionWeights.learning + satisfactionWeights.benchFairness}%
            </div>
          </div>

          {/* White controls box */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="space-y-4">
              {/* Field Time Weight */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-700">⚽ Field Time Weight</label>
                  <span className="text-sm font-bold" style={{ color: DIOK.blue }}>{satisfactionWeights.fieldTime}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={satisfactionWeights.fieldTime}
                  onChange={(e) => setSatisfactionWeights(prev => ({ ...prev, fieldTime: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: DIOK.blue }}
                />
                <p className="text-xs text-gray-600 mt-1">
                  How much actual playing time affects satisfaction
                </p>
              </div>

              {/* Fun Weight */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-700">😊 Fun Factor Weight</label>
                  <span className="text-sm font-bold" style={{ color: DIOK.blue }}>{satisfactionWeights.fun}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={satisfactionWeights.fun}
                  onChange={(e) => setSatisfactionWeights(prev => ({ ...prev, fun: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: DIOK.blue }}
                />
                <p className="text-xs text-gray-600 mt-1">
                  Playing in favorite positions affects satisfaction
                </p>
              </div>

              {/* Learning Weight */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-700">📚 Learning Opportunities Weight</label>
                  <span className="text-sm font-bold" style={{ color: DIOK.blue }}>{satisfactionWeights.learning}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={satisfactionWeights.learning}
                  onChange={(e) => setSatisfactionWeights(prev => ({ ...prev, learning: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: DIOK.blue }}
                />
                <p className="text-xs text-gray-600 mt-1">
                  Development through challenging positions affects satisfaction
                </p>
              </div>

              {/* Bench Fairness Weight */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-700">🪑 Bench Fairness Weight</label>
                  <span className="text-sm font-bold" style={{ color: DIOK.blue }}>{satisfactionWeights.benchFairness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={satisfactionWeights.benchFairness}
                  onChange={(e) => setSatisfactionWeights(prev => ({ ...prev, benchFairness: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: DIOK.blue }}
                />
                <p className="text-xs text-gray-600 mt-1">
                  Fair distribution of bench time affects satisfaction
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How Optimization Works - At Bottom */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">How Auto-Propose Works</h3>
          <p className="text-xs text-gray-500">Detailed explanation of the optimization algorithm</p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="text-sm font-semibold text-purple-900 mb-3">🎯 Algorithm Explanation</div>

          <div className="space-y-3 text-xs text-purple-900">
            <div>
              <div className="font-semibold mb-1">Algorithm Overview</div>
              <div className="text-purple-800">
                The Auto-Propose feature uses a <strong>greedy optimization algorithm</strong> with constraint satisfaction to find the best lineup for each half.
              </div>
            </div>

            <div className="bg-white/50 rounded-lg p-3 space-y-2">
              <div className="font-semibold text-purple-900">Phase 1: Field Position Assignment</div>
              <div className="text-purple-800 space-y-1.5">
                <div><strong>1. For each position</strong> (in order: Prop, Hooker, Lock, etc.):</div>
                <div className="ml-4">
                  • <strong>Filter candidates:</strong> Only players who are available AND not already assigned in this half
                </div>
                <div className="ml-4">
                  • <strong>Score each candidate:</strong> Calculate player-position score using the formula above
                </div>
                <div className="ml-4 space-y-1">
                  <div>• <strong>Apply HARD constraints:</strong></div>
                  <div className="ml-4 text-[11px]">
                    ✗ Player already assigned → Score = -∞ (rejected in all modes)<br/>
                    ✗ Player not trained for position → Score = -∞ (rejected in GAME mode only)
                  </div>
                </div>
                <div className="ml-4 space-y-1">
                  <div>• <strong>Apply SOFT rules</strong> (if enabled, each normalized 0-100):</div>
                  <div className="ml-4 text-[11px] space-y-0.5">
                    <div><strong>PlayTime:</strong> Players with fewer halves played get higher scores</div>
                    <div className="ml-4 italic">Formula: ((maxField - playerField) / (maxField - minField)) × 100</div>

                    <div><strong>Learning:</strong> Low-rated or new-to-position players score 100, others 0</div>
                    <div className="ml-4 italic">Criteria: rating &lt; 3 OR never played this position</div>

                    <div><strong>Skill:</strong> Higher star ratings get higher scores</div>
                    <div className="ml-4 italic">Formula: (rating / 5) × 100</div>

                    <div><strong>Variety:</strong> Players new to position score higher</div>
                    <div className="ml-4 italic">Formula: max(0, 100 - timesPlayed × 20)</div>
                    <div className="ml-4 italic">0 times = 100, 1 time = 80, 2 = 60, ... 5+ = 0</div>

                    <div><strong>Fun:</strong> Favorite positions score 100, others 0</div>
                    <div className="ml-4 italic">Binary: isFavorite ? 100 : 0</div>
                  </div>
                </div>
                <div className="ml-4">
                  • <strong>Weight and sum:</strong> Each rule's normalized score is multiplied by its weight percentage
                </div>
                <div className="ml-4">
                  • <strong>Select best candidate:</strong> Player with highest total score gets assigned
                </div>
                <div className="ml-4">
                  • <strong>Mark as assigned:</strong> Player is now unavailable for other positions in this half
                </div>
                <div><strong>2. Repeat</strong> for all 15 positions</div>
              </div>
            </div>

            <div className="bg-white/50 rounded-lg p-3 space-y-2">
              <div className="font-semibold text-purple-900">Phase 2: Bench Assignment</div>
              <div className="text-purple-800 space-y-1.5">
                <div><strong>1. Filter remaining players:</strong> Only those not assigned to field positions</div>
                <div><strong>2. Sort strategy</strong> (depends on Fair PlayTime weight):</div>
                <div className="ml-4 space-y-1">
                  <div><strong>When Fair PlayTime &gt; 70%:</strong></div>
                  <div className="ml-4 text-[11px]">
                    • <strong>Primary:</strong> Players with FEWER bench appearances go first (balances bench time)<br/>
                    • <strong>Secondary:</strong> Among equal bench history, prioritize MORE field time (gives rest)
                  </div>
                  <div><strong>When Fair PlayTime ≤ 70%:</strong></div>
                  <div className="ml-4 text-[11px]">
                    • <strong>Primary:</strong> Players with MORE field time go first (prioritizes rest)<br/>
                    • <strong>Secondary:</strong> Among similar field time, assign fewer bench appearances
                  </div>
                </div>
                <div><strong>3. Take top 8:</strong> Fill all bench slots with sorted candidates</div>
              </div>
            </div>

            <div className="bg-white/50 rounded-lg p-3 space-y-2">
              <div className="font-semibold text-purple-900">Key Algorithm Properties</div>
              <div className="text-purple-800 space-y-1">
                <div><strong>✓ Greedy:</strong> Assigns positions one at a time, always picking best available candidate</div>
                <div><strong>✓ Order-dependent:</strong> Processes positions sequentially (may favor earlier positions)</div>
                <div><strong>✓ Constraint satisfaction:</strong> HARD rules eliminate invalid options (-∞ score)</div>
                <div><strong>✓ Multi-objective:</strong> SOFT rules balance competing goals (fairness vs skill vs fun)</div>
                <div><strong>⚠ Local optimum:</strong> May not find globally optimal solution, but fast and good enough</div>
                <div className="text-[11px] italic ml-4">
                  Why: Assigning best player to Position 1 might prevent a better overall lineup,<br/>
                  but trying all combinations would be too slow (15! = 1.3 trillion possibilities)
                </div>
              </div>
            </div>

            <div className="bg-white/50 rounded-lg p-3 space-y-2">
              <div className="font-semibold text-purple-900">Understanding the Weights</div>
              <div className="text-purple-800 space-y-1">
                <div>Rule weights (0-100%) determine relative importance:</div>
                <div className="ml-4 text-[11px]">
                  • <strong>40% PlayTime + 5% Skill</strong> → Strongly favors fairness over performance<br/>
                  • <strong>5% PlayTime + 40% Skill</strong> → Strongly favors strongest players<br/>
                  • <strong>Equal weights</strong> → Balanced consideration of all factors
                </div>
                <div className="mt-1">Each SOFT rule contributes: (normalized_0_to_100 / 100) × weight × 10 points</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: DIOK.gray }}>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          {/* Team Logo/Selector */}
          {teams.length > 0 ? (
            // Multi-team mode: Show team selector
            <div className="relative">
              <button
                onClick={() => setShowTeamManager(!showTeamManager)}
                className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-gray-300 rounded-xl hover:border-blue-500 transition-colors"
              >
                {getCurrentTeam()?.name?.includes('Bulls') ? (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden bg-blue-600">
                    <img src={bullsLogo} alt="Bulls" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <span className="text-2xl">{getCurrentTeam()?.logo || '🐂'}</span>
                )}
                <span className="font-bold text-gray-900 text-sm">{getCurrentTeam()?.name || 'Select Team'}</span>
                <span className="text-gray-400 text-xs">▼</span>
              </button>

            {/* Team Dropdown */}
            {showTeamManager && (
              <>
                <div className="fixed inset-0 z-50" onClick={() => setShowTeamManager(false)} />
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border-2 border-gray-200 overflow-hidden z-50">
                  {teams.map(team => (
                    <button
                      key={team.id}
                      onClick={() => {
                        switchTeam(team.id);
                        setShowTeamManager(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors ${
                        team.id === currentTeamId ? 'bg-blue-100' : ''
                      }`}
                    >
                      {team.name?.includes('Bulls') ? (
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden bg-blue-600">
                          <img src={bullsLogo} alt="Bulls" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <span className="text-2xl">{team.logo}</span>
                      )}
                      <span className="font-semibold text-gray-900 text-sm">{team.name}</span>
                      {team.id === currentTeamId && <span className="ml-auto text-blue-600">✓</span>}
                    </button>
                  ))}

                  {/* Create New Team */}
                  <button
                    onClick={() => {
                      setShowTeamManager(false);
                      setShowCreateTeam(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 border-t-2 border-gray-200 bg-gray-50 hover:bg-blue-50 text-blue-600 font-semibold text-sm"
                  >
                    <span className="text-2xl">➕</span>
                    <span>Create New Team</span>
                  </button>
                </div>
              </>
            )}
            </div>
          ) : (
            // Single-team mode (migration not run): Show Bulls logo image
            <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden bg-blue-600">
              <img src={bullsLogo} alt="Bulls" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-2">
              {/* Show team name in single-team mode */}
              {teams.length === 0 && (
                <h1 className="font-bold text-gray-900">{settings.teamName}</h1>
              )}
              {/* Active Users Indicator - includes current user */}
              {currentUsername && (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-medium text-green-700">
                    {activeUsers.length + 1} online
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500">
                {settings.ageGroup} · Coach <span className="text-green-600">{currentUsername || 'Coach'}</span>
              </p>
              {/* Show other active coaches on same line */}
              {activeUsers.length > 0 && (
                <span className="text-xs text-green-600">
                  👥 {activeUsers.map(u => u.username).join(', ')}
                </span>
              )}
            </div>
          </div>

          {/* Date Selector for Lineup/Overview */}
          {(activeTab === 'lineup' || activeTab === 'overview') && playdays.length > 0 && (
            <div className="flex-shrink-0" style={{ minWidth: '220px' }}>
              <select
                value={selectedPlaydayId?.toString() || ''}
                onChange={(e) => {
                  const playdayId = parseInt(e.target.value);
                  if (!isNaN(playdayId)) {
                    setSelectedPlaydayId(playdayId);
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[...playdays].sort((a, b) => new Date(b.date) - new Date(a.date)).map(pd => {
                  // Format date as DD/MM
                  const date = new Date(pd.date);
                  const day = String(date.getDate()).padStart(2, '0');
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const dateStr = `${day}/${month}`;

                  return (
                    <option key={pd.id} value={pd.id.toString()}>
                      {pd.name} ({pd.type === 'game' ? '🏆' : '📚'}) - {dateStr}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* DIOK Logo */}
          <div className="w-10 h-10 rounded flex items-center justify-center overflow-hidden bg-white border border-gray-200">
            <img src={diokLogo} alt="DIOK" className="w-full h-full object-contain" />
          </div>

          <div className="flex items-center gap-2">
            {/* Get Updates Button */}
            <button
              onClick={refreshFromSupabase}
              disabled={isSyncing || !hasRemoteChanges}
              className={`relative flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all ${
                hasRemoteChanges && !hasUnsavedChanges
                  ? 'bg-blue-600 hover:bg-blue-700 text-white ring-2 ring-blue-400 shadow-lg animate-pulse'
                  : hasRemoteChanges && hasUnsavedChanges
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white ring-2 ring-yellow-300 shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              title={
                hasRemoteChanges && hasUnsavedChanges
                  ? "⚠️ Warning: Getting updates will discard your unsaved changes! (Click to confirm)"
                  : hasRemoteChanges
                  ? "Click to get latest changes from other coaches"
                  : "No updates available"
              }
            >
              {hasRemoteChanges && hasUnsavedChanges && <span>⚠️</span>}
              <span className={isSyncing ? "animate-spin" : ""}>⟳</span>
              <span>{hasRemoteChanges ? "Get Updates" : "Get Updates"}</span>
              {hasRemoteChanges && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 border-2 border-white rounded-full animate-pulse" />
              )}
            </button>

            {/* Save Changes Button */}
            <button
              onClick={handleSave}
              disabled={isSyncing || !hasUnsavedChanges}
              className={`relative flex items-center gap-1.5 px-3 py-2 text-white text-xs font-semibold rounded-lg shadow-sm transition-all ${
                hasUnsavedChanges
                  ? hasRemoteChanges
                    ? 'bg-orange-600 hover:bg-orange-700 ring-2 ring-orange-400 shadow-lg'
                    : 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-400 shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={
                hasUnsavedChanges && hasRemoteChanges
                  ? "⚠️ Warning: Saving will overwrite others' changes"
                  : hasUnsavedChanges
                  ? "Click to save your changes"
                  : "No changes to save"
              }
            >
              {isSyncing ? (
                <><span className="animate-spin">⟳</span><span>Saving...</span></>
              ) : hasUnsavedChanges ? (
                <>
                  {hasRemoteChanges && <span>⚠️</span>}
                  <span>{hasRemoteChanges ? "Save Anyway" : "Save Changes"}</span>
                </>
              ) : (
                <><span>✓</span><span>Saved</span></>
              )}
              {hasUnsavedChanges && !hasRemoteChanges && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
              )}
              {hasUnsavedChanges && hasRemoteChanges && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 border-2 border-white rounded-full animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 pb-24">
        {activeTab === 'schedule' && <ScheduleView />}
        {activeTab === 'squad' && <SquadView />}
        {activeTab === 'lineup' && <LineupView />}
        {activeTab === 'overview' && <OverviewView />}
        {activeTab === 'rules' && <RulesView />}
        {activeTab === 'admin' && <AdminView />}
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
          <div><label className="text-sm font-medium text-gray-700 mb-1 block">Type</label><select value={newPlayday.type} onChange={(e) => setNewPlayday({...newPlayday, type: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"><option value="game">Game</option><option value="training">Training</option></select></div>
          <button onClick={addPlayday} disabled={!newPlayday.date || !newPlayday.name.trim()} className={`w-full py-3 rounded-xl font-bold text-white ${newPlayday.date && newPlayday.name.trim() ? '' : 'opacity-50'}`} style={{ backgroundColor: DIOK.blue }}>Add Playday</button>
        </div>
      </BottomSheet>
      <BottomSheet isOpen={showAddMatch} onClose={() => setShowAddMatch(false)} title="Add Match">
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-gray-700 mb-1 block">Opponent</label><input type="text" value={newMatch.opponent} onChange={(e) => setNewMatch({...newMatch, opponent: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900" placeholder="e.g. Blackrock RFC" autoFocus /></div>
          <button onClick={addMatch} disabled={!newMatch.opponent.trim()} className={`w-full py-3 rounded-xl font-bold text-white ${newMatch.opponent.trim() ? '' : 'opacity-50'}`} style={{ backgroundColor: DIOK.blue }}>Add Match</button>
        </div>
      </BottomSheet>

      {/* Username Prompt Modal */}
      {showUsernamePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">👋</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to Rugby Planner!</h2>
              <p className="text-sm text-gray-600">Enter your name to see who else is online</p>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Your name (e.g., Coach John)"
                autoFocus
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    const username = e.target.value.trim();
                    localStorage.setItem('rugbyPlannerUsername', username);
                    setCurrentUsername(username);
                    setShowUsernamePrompt(false);
                  }
                }}
                onChange={(e) => {
                  // Store temp value for button click
                  e.target.dataset.username = e.target.value;
                }}
              />
              <button
                onClick={(e) => {
                  const input = e.target.parentElement.querySelector('input');
                  const username = input.value.trim();
                  if (username) {
                    localStorage.setItem('rugbyPlannerUsername', username);
                    setCurrentUsername(username);
                    setShowUsernamePrompt(false);
                  }
                }}
                className="w-full py-3 rounded-xl font-bold text-white"
                style={{ backgroundColor: DIOK.blue }}
              >
                Continue
              </button>
              <p className="text-xs text-gray-500 text-center">
                Your name is stored locally and can be changed anytime
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowCreateTeam(false)}>
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Team</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Team Name</label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g., Lions Mini's"
                  className="w-full bg-gray-50 border-2 border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Team Logo (Emoji)</label>
                <div className="grid grid-cols-5 gap-2">
                  {['🐂', '🦈', '🦁', '🐆', '🐉', '🦅', '🐺', '🐻', '🦊', '🐯'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setNewTeamLogo(emoji)}
                      className={`text-3xl p-2 rounded-lg border-2 hover:bg-blue-50 transition-colors ${
                        newTeamLogo === emoji ? 'border-blue-500 bg-blue-100' : 'border-gray-300'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={async () => {
                    if (newTeamName.trim()) {
                      await createTeam(newTeamName, newTeamLogo);
                      setShowCreateTeam(false);
                      setNewTeamName('');
                      setNewTeamLogo('🐂');
                    }
                  }}
                  disabled={!newTeamName.trim()}
                  className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors ${
                    newTeamName.trim() ? 'hover:opacity-90' : 'opacity-50 cursor-not-allowed'
                  }`}
                  style={{ backgroundColor: DIOK.blue }}
                >
                  Create Team
                </button>
                <button
                  onClick={() => {
                    setShowCreateTeam(false);
                    setNewTeamName('');
                    setNewTeamLogo('🐂');
                  }}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } } .animate-slideUp { animation: slideUp 0.3s ease-out; }`}</style>
    </div>
  );
}
