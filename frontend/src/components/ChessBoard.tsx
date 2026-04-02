import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const FILES = ['a','b','c','d','e','f','g','h'];
const RANKS = ['8','7','6','5','4','3','2','1'];
const PIECE_SYMBOLS: Record<string, string> = {
  wp:'\u2659',wn:'\u2658',wb:'\u2657',wr:'\u2656',wq:'\u2655',wk:'\u2654',
  bp:'\u265F',bn:'\u265E',bb:'\u265D',br:'\u265C',bq:'\u265B',bk:'\u265A',
};

interface Props {
  chess: any;
  selectedSquare: string | null;
  validMoves: string[];
  onSquarePress: (sq: string) => void;
  disabled?: boolean;
  lastMove?: { from: string; to: string } | null;
  boardLight?: string;
  boardDark?: string;
}

export default function ChessBoard({ chess, selectedSquare, validMoves, onSquarePress, disabled, lastMove, boardLight, boardDark }: Props) {
  const w = Dimensions.get('window').width;
  const boardSize = Math.min(w - 32, 400);
  const sqSize = boardSize / 8;
  const isMobile = w < 500;
  const pieceSize = isMobile ? sqSize * 0.85 : sqSize * 0.68;
  const lt = boardLight || '#F0D9B5';
  const dk = boardDark || '#B58863';

  return (
    <View style={[styles.board, { width: boardSize, height: boardSize }]}>
      {RANKS.map((rank, ri) =>
        FILES.map((file, fi) => {
          const sq = file + rank;
          const isLight = (ri + fi) % 2 === 0;
          const piece = chess.get(sq as any);
          const isSelected = selectedSquare === sq;
          const isValid = validMoves.includes(sq);
          const isLastMove = lastMove && (lastMove.from === sq || lastMove.to === sq);
          const bgColor = isSelected ? '#FFFF44' : isLastMove ? (isLight ? '#F6F669' : '#BACA2B') : isLight ? lt : dk;

          return (
            <TouchableOpacity
              key={sq}
              activeOpacity={0.7}
              disabled={disabled}
              onPress={() => onSquarePress(sq)}
              style={[styles.square, { width: sqSize, height: sqSize, backgroundColor: bgColor }]}
            >
              {piece && (
                <Text style={[styles.piece, { fontSize: pieceSize, color: piece.color === 'w' ? '#FFFFFF' : '#111111', textShadowColor: piece.color === 'w' ? '#000' : '#888', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 }]}>
                  {PIECE_SYMBOLS[piece.color + piece.type]}
                </Text>
              )}
              {isValid && (
                <View style={[styles.validDot, piece ? styles.captureDot : null, { width: piece ? sqSize * 0.9 : sqSize * 0.3, height: piece ? sqSize * 0.9 : sqSize * 0.3, borderRadius: piece ? sqSize * 0.45 : sqSize * 0.15 }]} />
              )}
              {fi === 0 && <Text style={[styles.label, styles.rankLabel, { color: isLight ? dk : lt }]}>{rank}</Text>}
              {ri === 7 && <Text style={[styles.label, styles.fileLabel, { color: isLight ? dk : lt }]}>{file}</Text>}
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  board: { flexDirection: 'row', flexWrap: 'wrap', borderRadius: 4, overflow: 'hidden', borderWidth: 2, borderColor: '#333' },
  square: { alignItems: 'center', justifyContent: 'center' },
  piece: { textAlign: 'center' },
  validDot: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.25)' },
  captureDot: { backgroundColor: 'transparent', borderWidth: 3, borderColor: 'rgba(0,0,0,0.25)' },
  label: { position: 'absolute', fontSize: 9, fontWeight: '700', opacity: 0.7 },
  rankLabel: { top: 1, left: 2 },
  fileLabel: { bottom: 1, right: 2 },
});
