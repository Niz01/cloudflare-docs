import React, { useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Chess } from 'chess.js';
import { Ionicons } from '@expo/vector-icons';

const BOARD_SIZE = Math.min(Dimensions.get('window').width - 32, 400);
const SQUARE_SIZE = BOARD_SIZE / 8;

interface ChessBoardProps {
  chess: Chess;
  selectedSquare: string | null;
  validMoves: string[];
  onSquarePress: (square: string) => void;
  flipped?: boolean;
  disabled?: boolean;
}

const PIECE_ICONS: Record<string, string> = {
  'wp': '♙',
  'wn': '♘',
  'wb': '♗',
  'wr': '♖',
  'wq': '♕',
  'wk': '♔',
  'bp': '♟',
  'bn': '♞',
  'bb': '♝',
  'br': '♜',
  'bq': '♛',
  'bk': '♚',
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export default function ChessBoard({
  chess,
  selectedSquare,
  validMoves,
  onSquarePress,
  flipped = false,
  disabled = false,
}: ChessBoardProps) {
  const board = useMemo(() => chess.board(), [chess.fen()]);
  const isCheck = chess.isCheck();
  const turn = chess.turn();
  
  const files = flipped ? [...FILES].reverse() : FILES;
  const ranks = flipped ? [...RANKS].reverse() : RANKS;

  const renderSquare = (row: number, col: number) => {
    const file = files[col];
    const rank = ranks[row];
    const square = `${file}${rank}`;
    
    const boardRow = flipped ? 7 - row : row;
    const boardCol = flipped ? 7 - col : col;
    const piece = board[boardRow][boardCol];
    
    const isLight = (row + col) % 2 === 0;
    const isSelected = selectedSquare === square;
    const isValidMove = validMoves.includes(square);
    const isKingInCheck = isCheck && piece?.type === 'k' && piece?.color === turn;
    
    const pieceKey = piece ? `${piece.color}${piece.type}` : null;
    
    return (
      <TouchableOpacity
        key={square}
        style={[
          styles.square,
          isLight ? styles.lightSquare : styles.darkSquare,
          isSelected && styles.selectedSquare,
          isKingInCheck && styles.checkSquare,
        ]}
        onPress={() => !disabled && onSquarePress(square)}
        activeOpacity={disabled ? 1 : 0.7}
      >
        {isValidMove && (
          <View style={[
            styles.validMoveIndicator,
            piece && styles.captureIndicator,
          ]} />
        )}
        {pieceKey && (
          <Text style={[
            styles.piece,
            piece?.color === 'w' ? styles.whitePiece : styles.blackPiece,
          ]}>
            {PIECE_ICONS[pieceKey]}
          </Text>
        )}
        {/* File labels on bottom row */}
        {row === 7 && (
          <Text style={[styles.label, styles.fileLabel, isLight ? styles.darkLabel : styles.lightLabel]}>
            {file}
          </Text>
        )}
        {/* Rank labels on left column */}
        {col === 0 && (
          <Text style={[styles.label, styles.rankLabel, isLight ? styles.darkLabel : styles.lightLabel]}>
            {rank}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.board}>
        {Array(8).fill(null).map((_, row) => (
          <View key={row} style={styles.row}>
            {Array(8).fill(null).map((_, col) => renderSquare(row, col))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  board: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#5D4037',
  },
  row: {
    flexDirection: 'row',
  },
  square: {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightSquare: {
    backgroundColor: '#F0D9B5',
  },
  darkSquare: {
    backgroundColor: '#B58863',
  },
  selectedSquare: {
    backgroundColor: '#829769',
  },
  checkSquare: {
    backgroundColor: '#E74C3C',
  },
  validMoveIndicator: {
    position: 'absolute',
    width: SQUARE_SIZE * 0.3,
    height: SQUARE_SIZE * 0.3,
    borderRadius: SQUARE_SIZE * 0.15,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  captureIndicator: {
    width: SQUARE_SIZE * 0.9,
    height: SQUARE_SIZE * 0.9,
    borderRadius: SQUARE_SIZE * 0.45,
    backgroundColor: 'transparent',
    borderWidth: 4,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  piece: {
    fontSize: SQUARE_SIZE * 0.75,
    textAlign: 'center',
  },
  whitePiece: {
    color: '#FFFFFF',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  blackPiece: {
    color: '#000000',
    textShadowColor: '#FFFFFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1,
  },
  label: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: 'bold',
  },
  fileLabel: {
    bottom: 2,
    right: 2,
  },
  rankLabel: {
    top: 2,
    left: 2,
  },
  lightLabel: {
    color: '#F0D9B5',
  },
  darkLabel: {
    color: '#B58863',
  },
});
