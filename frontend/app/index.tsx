import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal,
  ActivityIndicator, Alert, Dimensions, Platform,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Chess } from 'chess.js';
import ChessBoard from '../src/components/ChessBoard';
import { initEngine, searchMove, reportGameResult, clearTranspositionTable } from '../src/utils/chessEngineWorker';
import { getBestMove } from '../src/utils/chessAI';
import { ChessSounds } from '../src/utils/chessSounds';
import { PUZZLES } from '../src/data/puzzleData';
import { OPENINGS } from '../src/data/openingData';
import { useLocalStore } from '../src/store/localStore';

// ===== TYPES =====
type Screen = 'play' | 'puzzles' | 'learn' | 'profile' | 'game' | 'puzzle';
type GameMode = 'computer' | 'local';

// ===== MAIN APP =====
export default function App() {
  const [screen, setScreen] = useState<Screen>('play');
  const [gameMode, setGameMode] = useState<GameMode>('local');
  const [aiLevel, setAiLevel] = useState('beginner');
  const [puzzleDifficulty, setPuzzleDifficulty] = useState('easy');
  const { loadStats } = useLocalStore();

  useEffect(() => { loadStats(); }, []);

  const goToGame = (mode: GameMode, level?: string) => {
    setGameMode(mode);
    if (level) setAiLevel(level);
    setScreen('game');
  };

  const goToPuzzle = (diff: string) => {
    setPuzzleDifficulty(diff);
    setScreen('puzzle');
  };

  const goBack = () => setScreen('play');

  return (
    <SafeAreaProvider>
      <View style={styles.appContainer}>
        {screen === 'play' && <PlayScreen onStartGame={goToGame} />}
        {screen === 'puzzles' && <PuzzlesScreen onSelectDifficulty={goToPuzzle} />}
        {screen === 'learn' && <LearnScreen />}
        {screen === 'profile' && <ProfileScreen />}
        {screen === 'game' && <GameScreen mode={gameMode} aiLevel={aiLevel} onBack={goBack} />}
        {screen === 'puzzle' && <PuzzleScreen difficulty={puzzleDifficulty} onBack={() => setScreen('puzzles')} />}

        {/* Tab Bar - only show on main screens */}
        {['play', 'puzzles', 'learn', 'profile'].includes(screen) && (
          <View style={styles.tabBar}>
            <TabButton icon="game-controller" label="Play" active={screen === 'play'} onPress={() => setScreen('play')} />
            <TabButton icon="bulb" label="Puzzles" active={screen === 'puzzles'} onPress={() => setScreen('puzzles')} />
            <TabButton icon="book" label="Learn" active={screen === 'learn'} onPress={() => setScreen('learn')} />
            <TabButton icon="person" label="Profile" active={screen === 'profile'} onPress={() => setScreen('profile')} />
          </View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

// ===== TAB BUTTON =====
function TabButton({ icon, label, active, onPress }: { icon: string; label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.tabButton} onPress={onPress}>
      <Ionicons name={icon as any} size={24} color={active ? '#FFD700' : '#555'} />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ===== PLAY SCREEN =====
const AI_LEVELS = [
  { key: 'beginner', name: 'Beginner', desc: 'Makes random moves', icon: 'leaf' },
  { key: 'intermediate', name: 'Intermediate', desc: 'Basic strategy', icon: 'fitness' },
  { key: 'advanced', name: 'Advanced', desc: 'Smart play', icon: 'flash' },
  { key: 'master', name: 'Master', desc: 'Strongest AI', icon: 'trophy' },
];

function PlayScreen({ onStartGame }: { onStartGame: (mode: GameMode, level?: string) => void }) {
  const { stats } = useLocalStore();
  const [showAIModal, setShowAIModal] = useState(false);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.pad20}>
        <View style={styles.headerRow}>
          <Text style={styles.h1}>Chess Master</Text>
          <View style={styles.badge}><Ionicons name="star" size={14} color="#FFD700" /><Text style={styles.badgeText}>ALL ACCESS</Text></View>
        </View>

        <Text style={styles.h2}>Choose Game Mode</Text>

        <TouchableOpacity style={styles.card} onPress={() => setShowAIModal(true)}>
          <View style={[styles.cardIcon, { backgroundColor: 'rgba(0,217,255,0.1)' }]}><Ionicons name="hardware-chip" size={30} color="#00D9FF" /></View>
          <View style={styles.cardBody}><Text style={styles.cardTitle}>Play vs Computer</Text><Text style={styles.cardSub}>Challenge AI at various levels</Text></View>
          <Ionicons name="chevron-forward" size={22} color="#555" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => onStartGame('local')}>
          <View style={[styles.cardIcon, { backgroundColor: 'rgba(46,204,113,0.1)' }]}><Ionicons name="people" size={30} color="#2ECC71" /></View>
          <View style={styles.cardBody}><Text style={styles.cardTitle}>Local 2-Player</Text><Text style={styles.cardSub}>Play with a friend on same device</Text></View>
          <Ionicons name="chevron-forward" size={22} color="#555" />
        </TouchableOpacity>

        <Text style={[styles.h2, { marginTop: 24 }]}>Your Stats</Text>
        <View style={styles.statsRow}>
          <StatBox label="Games" value={stats.gamesPlayed} />
          <StatBox label="Wins" value={stats.gamesWon} />
          <StatBox label="Puzzles" value={stats.puzzlesSolved} />
          <StatBox label="Rating" value={stats.puzzleRating} />
        </View>
      </ScrollView>

      <Modal visible={showAIModal} transparent animationType="slide" onRequestClose={() => setShowAIModal(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Select AI Difficulty</Text>
            {AI_LEVELS.map((l) => (
              <TouchableOpacity key={l.key} style={styles.aiOpt} onPress={() => { setShowAIModal(false); onStartGame('computer', l.key); }}>
                <View style={styles.aiOptIcon}><Ionicons name={l.icon as any} size={22} color="#FFD700" /></View>
                <View style={{ flex: 1 }}><Text style={styles.aiOptName}>{l.name}</Text><Text style={styles.aiOptDesc}>{l.desc}</Text></View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowAIModal(false)}><Text style={{ color: '#888', fontSize: 16 }}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  );
}

// ===== PUZZLES SCREEN =====
const DIFFS = [
  { key: 'easy', name: 'Easy', color: '#2ECC71', icon: 'leaf', rating: '500-700' },
  { key: 'medium', name: 'Medium', color: '#F39C12', icon: 'fitness', rating: '900-1200' },
  { key: 'hard', name: 'Hard', color: '#E74C3C', icon: 'flame', rating: '1300-1700' },
  { key: 'impossible', name: 'Impossible', color: '#9B59B6', icon: 'skull', rating: '1800+' },
];

function PuzzlesScreen({ onSelectDifficulty }: { onSelectDifficulty: (d: string) => void }) {
  const { stats } = useLocalStore();
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.pad20}>
        <Text style={styles.h1}>Chess Puzzles</Text>
        <Text style={styles.sub}>Train your tactical skills</Text>

        <View style={styles.statsCard}>
          <View style={{ alignItems: 'center', flex: 1 }}><Text style={styles.statVal}>{stats.puzzleRating}</Text><Text style={styles.statLbl}>Rating</Text></View>
          <View style={{ width: 1, height: 40, backgroundColor: '#333' }} />
          <View style={{ alignItems: 'center', flex: 1 }}><Text style={styles.statVal}>{stats.puzzlesSolved}</Text><Text style={styles.statLbl}>Solved</Text></View>
        </View>

        <Text style={styles.h2}>Select Difficulty</Text>
        {DIFFS.map((d) => (
          <TouchableOpacity key={d.key} style={styles.card} onPress={() => onSelectDifficulty(d.key)}>
            <View style={[styles.cardIcon, { backgroundColor: `${d.color}20` }]}><Ionicons name={d.icon as any} size={28} color={d.color} /></View>
            <View style={styles.cardBody}><Text style={styles.cardTitle}>{d.name}</Text><Text style={styles.cardSub}>Rating: {d.rating}</Text></View>
            <Ionicons name="chevron-forward" size={22} color="#555" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ===== LEARN SCREEN =====
const CATS = [
  { key: 'all', name: 'All' }, { key: 'open_game', name: 'Open' }, { key: 'semi_open', name: 'Semi-Open' },
  { key: 'closed_game', name: 'Closed' }, { key: 'indian_defense', name: 'Indian' },
  { key: 'flank', name: 'Flank' }, { key: 'gambit', name: 'Gambits' },
];
const DC: Record<string, string> = { beginner: '#2ECC71', intermediate: '#F39C12', advanced: '#E74C3C' };

function LearnScreen() {
  const [cat, setCat] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const filtered = useMemo(() => cat === 'all' ? OPENINGS : OPENINGS.filter((o: any) => o.category === cat), [cat]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.pad20}>
        <Text style={styles.h1}>Opening Explorer</Text>
        <Text style={styles.sub}>{filtered.length} openings</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {CATS.map((c) => (
            <TouchableOpacity key={c.key} style={[styles.chip, cat === c.key && styles.chipActive]} onPress={() => setCat(c.key)}>
              <Text style={[styles.chipText, cat === c.key && styles.chipTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filtered.map((o: any) => (
          <TouchableOpacity key={o.opening_id} style={styles.openingCard} onPress={() => setExpanded(expanded === o.opening_id ? null : o.opening_id)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <View style={{ flex: 1 }}><Text style={styles.cardTitle}>{o.name}</Text><Text style={{ color: '#888', fontSize: 12, marginTop: 2 }}>ECO: {o.eco}</Text></View>
              <View style={[styles.diffBadge, { backgroundColor: `${DC[o.difficulty] || '#888'}20` }]}>
                <Text style={{ color: DC[o.difficulty] || '#888', fontSize: 10, fontWeight: 'bold' }}>{o.difficulty?.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={{ color: '#AAA', fontSize: 14, lineHeight: 20, marginBottom: 8 }} numberOfLines={expanded === o.opening_id ? undefined : 2}>{o.description}</Text>
            <View style={styles.movesBox}><Text style={{ color: '#888', fontSize: 12 }}>Moves: </Text><Text style={{ color: '#FFD700', fontSize: 12, fontWeight: '600', flex: 1 }}>{o.moves.join(' ')}</Text></View>
            {expanded === o.opening_id && (
              <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#333' }}>
                <Text style={{ color: '#FFD700', fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Key Ideas:</Text>
                {o.main_ideas?.map((idea: string, i: number) => <Text key={i} style={{ color: '#CCC', fontSize: 13, marginBottom: 3 }}>{'\u2022'} {idea}</Text>)}
                {o.famous_games?.[0] && <Text style={{ color: '#888', fontSize: 12, marginTop: 8, fontStyle: 'italic' }}>Notable: {o.famous_games[0]}</Text>}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ===== PROFILE SCREEN =====
function ProfileScreen() {
  const { stats, loadStats } = useLocalStore();
  const handleReset = () => {
    if (Platform.OS === 'web') {
      if (confirm('Reset all stats?')) {
        try { localStorage.removeItem('chess_stats'); } catch(e) {}
        loadStats();
      }
    } else {
      Alert.alert('Reset Stats', 'Clear all saved progress?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: async () => {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.removeItem('chess_stats');
          loadStats();
        }},
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.pad20}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFD700', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 50, color: '#1a1a2e' }}>{'\u2654'}</Text>
          </View>
          <Text style={[styles.h1, { marginTop: 12 }]}>Player</Text>
          <View style={[styles.badge, { marginTop: 12 }]}><Ionicons name="star" size={14} color="#FFD700" /><Text style={styles.badgeText}>ALL ACCESS</Text></View>
        </View>

        <View style={styles.statsRow}>
          <StatBox label="Games" value={stats.gamesPlayed} />
          <StatBox label="Wins" value={stats.gamesWon} />
          <StatBox label="Puzzles" value={stats.puzzlesSolved} />
          <StatBox label="Rating" value={stats.puzzleRating} />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,215,0,0.1)', borderRadius: 16, padding: 16, marginTop: 24, borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)' }}>
          <Ionicons name="information-circle" size={24} color="#FFD700" />
          <Text style={{ flex: 1, marginLeft: 12, fontSize: 14, color: '#CCC', lineHeight: 20 }}>All progress is saved locally in your browser. No account needed!</Text>
        </View>

        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(231,76,60,0.1)', borderRadius: 12, padding: 16, marginTop: 24 }} onPress={handleReset}>
          <Ionicons name="trash" size={20} color="#E74C3C" />
          <Text style={{ fontSize: 16, color: '#E74C3C', fontWeight: '600', marginLeft: 8 }}>Reset All Stats</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ===== GAME SCREEN =====
function GameScreen({ mode, aiLevel, onBack }: { mode: GameMode; aiLevel: string; onBack: () => void }) {
  const { incrementGames } = useLocalStore();
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(() => new Chess().fen());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameStatus, setGameStatus] = useState<'playing' | 'checkmate' | 'draw'>('playing');
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [resultMsg, setResultMsg] = useState('');
  const [searchInfo, setSearchInfo] = useState('');
  const movesPlayedRef = useRef<string[]>([]);
  const engineReady = useRef(false);

  useEffect(() => {
    ChessSounds.init(); ChessSounds.gameStart();
    if (Platform.OS === 'web') {
      initEngine().then(() => { engineReady.current = true; });
    }
    return () => { clearTranspositionTable(); };
  }, []);

  useEffect(() => {
    if (mode === 'computer' && !isPlayerTurn && gameStatus === 'playing') {
      let cancelled = false;
      const doAI = async () => {
        setSearchInfo('Thinking...');
        let moved = false;
        if (Platform.OS === 'web' && engineReady.current) {
          try {
            const result = await searchMove(chess.fen(), aiLevel, movesPlayedRef.current);
            if (cancelled) return;
            if (result.san) {
              const tp = chess.get(result.san as any);
              chess.move(result.san);
              moved = true;
              setSearchInfo(result.isBook ? 'Book move' : `Depth ${result.depth} | ${(result.nodes||0).toLocaleString()} nodes`);
            } else if (result.from && result.to) {
              const tp = chess.get(result.to as any);
              chess.move({ from: result.from as any, to: result.to as any, promotion: result.promotion as any });
              moved = true;
              setSearchInfo(result.isBook ? 'Book move' : `Depth ${result.depth} | ${(result.nodes||0).toLocaleString()} nodes`);
            }
          } catch {}
        }
        if (!moved) {
          const aiMove = getBestMove(chess, aiLevel as any);
          if (aiMove && !cancelled) {
            chess.move(aiMove);
            moved = true;
            setSearchInfo('');
          }
        }
        if (moved && !cancelled) {
          movesPlayedRef.current = chess.history();
          if (chess.isCheckmate()) ChessSounds.checkmate();
          else if (chess.isCheck()) ChessSounds.check();
          else ChessSounds.move();
          doUpdate();
          setIsPlayerTurn(true);
        }
      };
      const timer = setTimeout(doAI, 300);
      return () => { cancelled = true; clearTimeout(timer); };
    }
  }, [isPlayerTurn, gameStatus, mode]);

  const doUpdate = useCallback(() => {
    setFen(chess.fen());
    setSelectedSquare(null);
    setValidMoves([]);
    setMoveHistory(chess.history());
    if (chess.isCheckmate()) {
      setGameStatus('checkmate');
      const w = chess.turn() === 'w' ? 'Black' : 'White';
      const won = mode === 'computer' ? chess.turn() === 'b' : false;
      incrementGames(won);
      setResultMsg(`Checkmate! ${w} wins!`);
      if (mode === 'computer') reportGameResult(won ? 'loss' : 'win', chess.history());
    } else if (chess.isDraw() || chess.isStalemate()) {
      setGameStatus('draw');
      incrementGames(false);
      setResultMsg('Draw!');
      if (mode === 'computer') reportGameResult('draw', chess.history());
    }
  }, [chess, mode]);

  const handleSquarePress = useCallback((sq: string) => {
    if (gameStatus !== 'playing') return;
    if (mode === 'computer' && !isPlayerTurn) return;
    const piece = chess.get(sq as any);
    const turn = chess.turn();
    if (piece && piece.color === turn) {
      ChessSounds.select();
      const m = chess.moves({ square: sq as any, verbose: true });
      setSelectedSquare(sq);
      setValidMoves(m.map(x => x.to));
    } else if (selectedSquare && validMoves.includes(sq)) {
      const tp = chess.get(sq as any);
      const mp = chess.get(selectedSquare as any);
      let promo: string | undefined;
      if (mp?.type === 'p' && (sq[1] === '8' || sq[1] === '1')) promo = 'q';
      try {
        const mv = chess.move({ from: selectedSquare as any, to: sq as any, promotion: promo as any });
        if (mv) {
          movesPlayedRef.current = chess.history();
          if (chess.isCheckmate()) ChessSounds.checkmate();
          else if (chess.isDraw() || chess.isStalemate()) ChessSounds.draw();
          else if (chess.isCheck()) ChessSounds.check();
          else if (tp) ChessSounds.capture();
          else ChessSounds.move();
          doUpdate();
          if (mode === 'computer') setIsPlayerTurn(false);
        }
      } catch { ChessSounds.invalid(); }
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  }, [chess, selectedSquare, validMoves, gameStatus, mode, isPlayerTurn, doUpdate]);

  const handleNewGame = () => {
    chess.reset(); setFen(chess.fen()); setSelectedSquare(null); setValidMoves([]); setIsPlayerTurn(true); setGameStatus('playing'); setMoveHistory([]); setResultMsg(''); setSearchInfo('');
    movesPlayedRef.current = [];
    clearTranspositionTable();
    ChessSounds.gameStart();
  };

  const handleResign = () => {
    if (mode === 'computer') reportGameResult('loss', chess.history());
    incrementGames(false);
    onBack();
  };

  const turnText = gameStatus !== 'playing' ? resultMsg : mode === 'computer' ? (isPlayerTurn ? 'Your turn' : 'AI thinking...') : chess.turn() === 'w' ? "White's turn" : "Black's turn";
  const modeTitle = mode === 'computer' ? `vs Computer (${aiLevel})` : 'Local Game';

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={onBack} style={{ padding: 8 }}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}><Text style={styles.cardTitle}>{modeTitle}</Text><Text style={{ color: '#FFD700', fontSize: 13, marginTop: 2 }}>{turnText}</Text>{searchInfo ? <Text style={{ color: '#888', fontSize: 11, marginTop: 1 }}>{searchInfo}</Text> : null}</View>
        <TouchableOpacity onPress={handleResign} style={{ padding: 8 }}><Ionicons name="flag" size={24} color="#E74C3C" /></TouchableOpacity>
      </View>

      {chess.isCheck() && gameStatus === 'playing' && (
        <View style={styles.checkBanner}><Ionicons name="warning" size={16} color="#E74C3C" /><Text style={{ color: '#E74C3C', fontWeight: 'bold', marginLeft: 8 }}>Check!</Text></View>
      )}

      <View style={{ alignItems: 'center', paddingHorizontal: 16 }}>
        <ChessBoard chess={chess} selectedSquare={selectedSquare} validMoves={validMoves} onSquarePress={handleSquarePress} disabled={gameStatus !== 'playing' || (mode === 'computer' && !isPlayerTurn)} />
        {mode === 'computer' && !isPlayerTurn && gameStatus === 'playing' && (
          <View style={{ position: 'absolute', top: 10, right: 26 }}><ActivityIndicator size="small" color="#FFD700" /></View>
        )}
      </View>

      {resultMsg ? (
        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <Text style={{ color: '#FFD700', fontSize: 20, fontWeight: 'bold' }}>{resultMsg}</Text>
        </View>
      ) : null}

      <View style={{ flex: 1, marginHorizontal: 16, marginTop: 12, backgroundColor: '#16213e', borderRadius: 12, padding: 12 }}>
        <Text style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>Moves</Text>
        <ScrollView><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {moveHistory.map((m, i) => <Text key={i} style={{ fontSize: 14, color: '#FFF' }}>{i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ` : ''}{m}{i % 2 === 1 ? ' ' : ''}</Text>)}
        </View></ScrollView>
      </View>

      <View style={{ flexDirection: 'row', padding: 16, gap: 12 }}>
        <TouchableOpacity style={styles.btn} onPress={handleNewGame}><Ionicons name="refresh" size={20} color="#FFF" /><Text style={styles.btnTxt}>New Game</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: 'rgba(231,76,60,0.1)' }]} onPress={handleResign}><Ionicons name="flag" size={20} color="#E74C3C" /><Text style={[styles.btnTxt, { color: '#E74C3C' }]}>Resign</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ===== PUZZLE SCREEN =====
function PuzzleScreen({ difficulty, onBack }: { difficulty: string; onBack: () => void }) {
  const { incrementPuzzles } = useLocalStore();
  const [puzzle, setPuzzle] = useState<any>(null);
  const [chess, setChess] = useState<Chess | null>(null);
  const [fen, setFen] = useState('');
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [status, setStatus] = useState<'loading' | 'solving' | 'completed' | 'incorrect'>('loading');
  const [moveIndex, setMoveIndex] = useState(0);
  const [isOpponentMoving, setIsOpponentMoving] = useState(false);

  const loadPuzzle = useCallback(() => {
    const pool = PUZZLES.filter((p: any) => p.difficulty === difficulty);
    if (pool.length === 0) return;
    const p = pool[Math.floor(Math.random() * pool.length)];
    setPuzzle(p);
    const c = new Chess(p.fen);
    setChess(c); setFen(p.fen); setMoveIndex(0); setStatus('solving'); setSelectedSquare(null); setValidMoves([]);
  }, [difficulty]);

  useEffect(() => { loadPuzzle(); }, [difficulty]);

  const handleSquarePress = useCallback((sq: string) => {
    if (!chess || !puzzle || status !== 'solving' || isOpponentMoving) return;
    const piece = chess.get(sq as any);
    if (piece && piece.color === chess.turn()) {
      const m = chess.moves({ square: sq as any, verbose: true });
      setSelectedSquare(sq); setValidMoves(m.map(x => x.to));
    } else if (selectedSquare && validMoves.includes(sq)) {
      const mp = chess.get(selectedSquare as any);
      let promo: string | undefined;
      if (mp?.type === 'p' && (sq[1] === '8' || sq[1] === '1')) promo = 'q';
      try {
        const mv = chess.move({ from: selectedSquare as any, to: sq as any, promotion: promo as any });
        if (mv) {
          const exp = puzzle.solution[moveIndex];
          if (mv.san === exp || mv.lan === exp || `${mv.from}${mv.to}` === exp || mv.san.replace(/[+#]/g, '') === exp.replace(/[+#]/g, '')) {
            setFen(chess.fen()); setSelectedSquare(null); setValidMoves([]);
            const ni = moveIndex + 1; setMoveIndex(ni);
            if (ni >= puzzle.solution.length) { setStatus('completed'); incrementPuzzles(15); }
            else {
              setIsOpponentMoving(true);
              setTimeout(() => {
                try { chess.move(puzzle.solution[ni]); setFen(chess.fen()); setMoveIndex(ni + 1); } catch {}
                setIsOpponentMoving(false);
              }, 500);
            }
          } else {
            chess.undo(); setSelectedSquare(null); setValidMoves([]); setStatus('incorrect'); incrementPuzzles(-10);
          }
        }
      } catch {}
    } else { setSelectedSquare(null); setValidMoves([]); }
  }, [chess, puzzle, selectedSquare, validMoves, status, moveIndex, isOpponentMoving]);

  const diffColor = difficulty === 'easy' ? '#2ECC71' : difficulty === 'medium' ? '#F39C12' : difficulty === 'hard' ? '#E74C3C' : '#9B59B6';

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={onBack} style={{ padding: 8 }}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={styles.cardTitle}>Puzzle</Text>
          <View style={[styles.diffBadge, { backgroundColor: `${diffColor}20`, marginLeft: 8 }]}><Text style={{ color: diffColor, fontSize: 11, fontWeight: 'bold' }}>{difficulty.toUpperCase()}</Text></View>
        </View>
        <View style={{ backgroundColor: 'rgba(255,215,0,0.2)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 }}><Text style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 13 }}>{puzzle?.rating || '...'}</Text></View>
      </View>

      {puzzle && <View style={{ alignItems: 'center', paddingVertical: 6 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFF' }}>{chess?.turn() === 'w' ? 'White' : 'Black'} to move</Text>
        {puzzle.theme && <Text style={{ fontSize: 12, color: '#888', marginTop: 2, textTransform: 'capitalize' }}>Theme: {puzzle.theme.replace(/_/g, ' ')}</Text>}
      </View>}

      <View style={{ alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
        {status === 'loading' ? <View style={{ height: 300, justifyContent: 'center' }}><ActivityIndicator size="large" color="#FFD700" /></View>
        : chess && <ChessBoard chess={chess} selectedSquare={selectedSquare} validMoves={validMoves} onSquarePress={handleSquarePress} disabled={status !== 'solving' || isOpponentMoving} />}
        {isOpponentMoving && <View style={{ position: 'absolute', top: 20, right: 26 }}><ActivityIndicator size="small" color="#FFD700" /></View>}
      </View>

      {status === 'completed' && <View style={[styles.statusBanner, { backgroundColor: 'rgba(46,204,113,0.2)' }]}><Ionicons name="checkmark-circle" size={24} color="#2ECC71" /><Text style={{ color: '#2ECC71', fontSize: 18, fontWeight: 'bold', marginLeft: 8 }}>Puzzle Solved!</Text></View>}
      {status === 'incorrect' && <>
        <View style={[styles.statusBanner, { backgroundColor: 'rgba(231,76,60,0.2)' }]}><Ionicons name="close-circle" size={24} color="#E74C3C" /><Text style={{ color: '#E74C3C', fontSize: 18, fontWeight: 'bold', marginLeft: 8 }}>Incorrect!</Text></View>
        <View style={{ alignItems: 'center', marginBottom: 8 }}><Text style={{ color: '#888', fontSize: 12 }}>Solution starts with:</Text><Text style={{ color: '#FFD700', fontSize: 16, fontWeight: 'bold', marginTop: 4 }}>{puzzle?.solution[0]}</Text></View>
      </>}

      <View style={{ flexDirection: 'row', padding: 16, gap: 12, marginTop: 'auto' as any }}>
        {(status === 'completed' || status === 'incorrect') && <>
          <TouchableOpacity style={styles.btn} onPress={() => { if (!puzzle) return; const c = new Chess(puzzle.fen); setChess(c); setFen(puzzle.fen); setMoveIndex(0); setStatus('solving'); setSelectedSquare(null); setValidMoves([]); }}>
            <Ionicons name="refresh" size={20} color="#FFF" /><Text style={styles.btnTxt}>Retry</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#FFD700' }]} onPress={loadPuzzle}>
            <Ionicons name="arrow-forward" size={20} color="#1a1a2e" /><Text style={[styles.btnTxt, { color: '#1a1a2e' }]}>Next</Text></TouchableOpacity>
        </>}
        {status === 'solving' && <TouchableOpacity style={styles.btn} onPress={loadPuzzle}><Ionicons name="shuffle" size={20} color="#FFF" /><Text style={styles.btnTxt}>Skip</Text></TouchableOpacity>}
      </View>
    </SafeAreaView>
  );
}

// ===== STYLES =====
const styles = StyleSheet.create({
  appContainer: { flex: 1, backgroundColor: '#1a1a2e' },
  screen: { flex: 1, backgroundColor: '#1a1a2e' },
  pad20: { padding: 20 },
  h1: { fontSize: 26, fontWeight: 'bold', color: '#FFFFFF' },
  h2: { fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginBottom: 14 },
  sub: { fontSize: 14, color: '#888888', marginTop: 4, marginBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,215,0,0.1)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  badgeText: { color: '#FFD700', fontSize: 11, fontWeight: 'bold', marginLeft: 4 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213e', borderRadius: 16, padding: 16, marginBottom: 12 },
  cardIcon: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, marginLeft: 14 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: '#FFFFFF' },
  cardSub: { fontSize: 13, color: '#888888', marginTop: 3 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { flex: 1, alignItems: 'center', backgroundColor: '#16213e', padding: 14, borderRadius: 12, marginHorizontal: 3 },
  statVal: { fontSize: 22, fontWeight: 'bold', color: '#FFD700' },
  statLbl: { fontSize: 11, color: '#888888', marginTop: 4 },
  statsCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213e', borderRadius: 16, padding: 20, marginBottom: 24 },
  tabBar: { flexDirection: 'row', backgroundColor: '#16213e', borderTopWidth: 1, borderTopColor: '#222', paddingBottom: Platform.OS === 'ios' ? 20 : 8, paddingTop: 8 },
  tabButton: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  tabLabel: { fontSize: 11, color: '#555', marginTop: 3 },
  tabLabelActive: { color: '#FFD700' },
  gameHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  checkBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(231,76,60,0.2)', paddingVertical: 6, marginHorizontal: 16, borderRadius: 8, marginBottom: 6 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#16213e', paddingVertical: 14, borderRadius: 12 },
  btnTxt: { fontSize: 16, color: '#FFFFFF', marginLeft: 8 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modal: { backgroundColor: '#16213e', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF', textAlign: 'center', marginBottom: 20 },
  modalClose: { marginTop: 8, padding: 16, alignItems: 'center' },
  aiOpt: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 14, borderRadius: 12, marginBottom: 10 },
  aiOptIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,215,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  aiOptName: { fontSize: 16, fontWeight: '600', color: '#FFF', marginLeft: 12 },
  aiOptDesc: { fontSize: 12, color: '#888', marginLeft: 12, marginTop: 2 },
  chip: { backgroundColor: '#16213e', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, marginRight: 8 },
  chipActive: { backgroundColor: '#FFD700' },
  chipText: { color: '#888', fontSize: 13 },
  chipTextActive: { color: '#1a1a2e', fontWeight: '600' },
  openingCard: { backgroundColor: '#16213e', borderRadius: 16, padding: 16, marginBottom: 10 },
  diffBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
  movesBox: { flexDirection: 'row', backgroundColor: 'rgba(255,215,0,0.1)', padding: 8, borderRadius: 8 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, marginHorizontal: 16, borderRadius: 12, marginBottom: 10 },
});
