// Self-contained chess engine with:
// - 0x88 board representation
// - Zobrist hashing + Transposition table
// - Alpha-beta with iterative deepening
// - MVV-LVA move ordering + Killer heuristic
// - Quiescence search
// - Opening book (164 lines)
// - Reinforcement learning weights via localStorage

const ENGINE_SOURCE = `
'use strict';

// ============ CONSTANTS ============
var EMPTY = 0, PAWN = 1, KNIGHT = 2, BISHOP = 3, ROOK = 4, QUEEN = 5, KING = 6;
var WHITE = 0, BLACK = 1;
var PIECE_VAL = [0, 100, 320, 330, 500, 900, 20000];
var INF = 99999;

// PST (Piece-Square Tables) - centipawn bonuses
var PST = {
  // Pawn
  1: [
    0,  0,  0,  0,  0,  0,  0,  0, 0,0,0,0,0,0,0,0,
    50, 50, 50, 50, 50, 50, 50, 50, 0,0,0,0,0,0,0,0,
    10, 10, 20, 30, 30, 20, 10, 10, 0,0,0,0,0,0,0,0,
    5,  5, 10, 25, 25, 10,  5,  5, 0,0,0,0,0,0,0,0,
    0,  0,  0, 20, 20,  0,  0,  0, 0,0,0,0,0,0,0,0,
    5, -5,-10,  0,  0,-10, -5,  5, 0,0,0,0,0,0,0,0,
    5, 10, 10,-20,-20, 10, 10,  5, 0,0,0,0,0,0,0,0,
    0,  0,  0,  0,  0,  0,  0,  0, 0,0,0,0,0,0,0,0
  ],
  // Knight
  2: [
    -50,-40,-30,-30,-30,-30,-40,-50, 0,0,0,0,0,0,0,0,
    -40,-20,  0,  0,  0,  0,-20,-40, 0,0,0,0,0,0,0,0,
    -30,  0, 10, 15, 15, 10,  0,-30, 0,0,0,0,0,0,0,0,
    -30,  5, 15, 20, 20, 15,  5,-30, 0,0,0,0,0,0,0,0,
    -30,  0, 15, 20, 20, 15,  0,-30, 0,0,0,0,0,0,0,0,
    -30,  5, 10, 15, 15, 10,  5,-30, 0,0,0,0,0,0,0,0,
    -40,-20,  0,  5,  5,  0,-20,-40, 0,0,0,0,0,0,0,0,
    -50,-40,-30,-30,-30,-30,-40,-50, 0,0,0,0,0,0,0,0
  ],
  // Bishop
  3: [
    -20,-10,-10,-10,-10,-10,-10,-20, 0,0,0,0,0,0,0,0,
    -10,  0,  0,  0,  0,  0,  0,-10, 0,0,0,0,0,0,0,0,
    -10,  0,  5, 10, 10,  5,  0,-10, 0,0,0,0,0,0,0,0,
    -10,  5,  5, 10, 10,  5,  5,-10, 0,0,0,0,0,0,0,0,
    -10,  0, 10, 10, 10, 10,  0,-10, 0,0,0,0,0,0,0,0,
    -10, 10, 10, 10, 10, 10, 10,-10, 0,0,0,0,0,0,0,0,
    -10,  5,  0,  0,  0,  0,  5,-10, 0,0,0,0,0,0,0,0,
    -20,-10,-10,-10,-10,-10,-10,-20, 0,0,0,0,0,0,0,0
  ],
  // Rook
  4: [
    0,  0,  0,  0,  0,  0,  0,  0, 0,0,0,0,0,0,0,0,
    5, 10, 10, 10, 10, 10, 10,  5, 0,0,0,0,0,0,0,0,
    -5,  0,  0,  0,  0,  0,  0, -5, 0,0,0,0,0,0,0,0,
    -5,  0,  0,  0,  0,  0,  0, -5, 0,0,0,0,0,0,0,0,
    -5,  0,  0,  0,  0,  0,  0, -5, 0,0,0,0,0,0,0,0,
    -5,  0,  0,  0,  0,  0,  0, -5, 0,0,0,0,0,0,0,0,
    -5,  0,  0,  0,  0,  0,  0, -5, 0,0,0,0,0,0,0,0,
    0,  0,  0,  5,  5,  0,  0,  0, 0,0,0,0,0,0,0,0
  ],
  // Queen
  5: [
    -20,-10,-10, -5, -5,-10,-10,-20, 0,0,0,0,0,0,0,0,
    -10,  0,  0,  0,  0,  0,  0,-10, 0,0,0,0,0,0,0,0,
    -10,  0,  5,  5,  5,  5,  0,-10, 0,0,0,0,0,0,0,0,
    -5,  0,  5,  5,  5,  5,  0, -5, 0,0,0,0,0,0,0,0,
    0,  0,  5,  5,  5,  5,  0, -5, 0,0,0,0,0,0,0,0,
    -10,  5,  5,  5,  5,  5,  0,-10, 0,0,0,0,0,0,0,0,
    -10,  0,  5,  0,  0,  0,  0,-10, 0,0,0,0,0,0,0,0,
    -20,-10,-10, -5, -5,-10,-10,-20, 0,0,0,0,0,0,0,0
  ],
  // King middlegame
  6: [
    -30,-40,-40,-50,-50,-40,-40,-30, 0,0,0,0,0,0,0,0,
    -30,-40,-40,-50,-50,-40,-40,-30, 0,0,0,0,0,0,0,0,
    -30,-40,-40,-50,-50,-40,-40,-30, 0,0,0,0,0,0,0,0,
    -30,-40,-40,-50,-50,-40,-40,-30, 0,0,0,0,0,0,0,0,
    -20,-30,-30,-40,-40,-30,-30,-20, 0,0,0,0,0,0,0,0,
    -10,-20,-20,-20,-20,-20,-20,-10, 0,0,0,0,0,0,0,0,
    20, 20,  0,  0,  0,  0, 20, 20, 0,0,0,0,0,0,0,0,
    20, 30, 10,  0,  0, 10, 30, 20, 0,0,0,0,0,0,0,0
  ]
};

// King endgame PST
var KING_END = [
  -50,-40,-30,-20,-20,-30,-40,-50, 0,0,0,0,0,0,0,0,
  -30,-20,-10,  0,  0,-10,-20,-30, 0,0,0,0,0,0,0,0,
  -30,-10, 20, 30, 30, 20,-10,-30, 0,0,0,0,0,0,0,0,
  -30,-10, 30, 40, 40, 30,-10,-30, 0,0,0,0,0,0,0,0,
  -30,-10, 30, 40, 40, 30,-10,-30, 0,0,0,0,0,0,0,0,
  -30,-10, 20, 30, 30, 20,-10,-30, 0,0,0,0,0,0,0,0,
  -30,-30,  0,  0,  0,  0,-30,-30, 0,0,0,0,0,0,0,0,
  -50,-30,-30,-30,-30,-30,-30,-50, 0,0,0,0,0,0,0,0
];

// ============ ZOBRIST HASHING ============
var zobristTable = [];
var zobristSide;
var zobristCastle = [];
var zobristEP = [];

function initZobrist() {
  function rand32() { return (Math.random() * 0xFFFFFFFF) >>> 0; }
  for (var i = 0; i < 128; i++) {
    zobristTable[i] = [];
    for (var p = 0; p < 13; p++) {
      zobristTable[i][p] = [rand32(), rand32()];
    }
  }
  zobristSide = [rand32(), rand32()];
  for (var i = 0; i < 16; i++) zobristCastle[i] = [rand32(), rand32()];
  for (var i = 0; i < 128; i++) zobristEP[i] = [rand32(), rand32()];
}
initZobrist();

function pieceIndex(color, type) { return color * 6 + type; }

// ============ BOARD STATE ============
function State() {
  this.board = new Int8Array(128);
  this.colors = new Int8Array(128);
  this.side = WHITE;
  this.castling = 15;
  this.ep = -1;
  this.halfmove = 0;
  this.hash = [0, 0];
  this.kings = [0, 0];
  this.material = [0, 0];
}

State.prototype.clone = function() {
  var s = new State();
  s.board.set(this.board);
  s.colors.set(this.colors);
  s.side = this.side;
  s.castling = this.castling;
  s.ep = this.ep;
  s.halfmove = this.halfmove;
  s.hash = [this.hash[0], this.hash[1]];
  s.kings = [this.kings[0], this.kings[1]];
  s.material = [this.material[0], this.material[1]];
  return s;
};

function sq88(rank, file) { return rank * 16 + file; }
function rank88(sq) { return sq >> 4; }
function file88(sq) { return sq & 7; }
function onBoard(sq) { return !(sq & 0x88); }
function mirror88(sq) { return ((7 - (sq >> 4)) << 4) | (sq & 7); }

function parseFEN(fen) {
  var s = new State();
  var parts = fen.split(' ');
  var ranks = parts[0].split('/');
  for (var r = 0; r < 8; r++) {
    var f = 0;
    for (var c = 0; c < ranks[r].length; c++) {
      var ch = ranks[r][c];
      if (ch >= '1' && ch <= '8') { f += parseInt(ch); }
      else {
        var sq = sq88(r, f);
        var color = ch === ch.toUpperCase() ? WHITE : BLACK;
        var type;
        switch(ch.toLowerCase()) {
          case 'p': type = PAWN; break;
          case 'n': type = KNIGHT; break;
          case 'b': type = BISHOP; break;
          case 'r': type = ROOK; break;
          case 'q': type = QUEEN; break;
          case 'k': type = KING; break;
        }
        s.board[sq] = type;
        s.colors[sq] = color;
        s.material[color] += PIECE_VAL[type];
        if (type === KING) s.kings[color] = sq;
        var pi = pieceIndex(color, type);
        s.hash[0] ^= zobristTable[sq][pi][0];
        s.hash[1] ^= zobristTable[sq][pi][1];
        f++;
      }
    }
  }
  s.side = parts[1] === 'b' ? BLACK : WHITE;
  if (s.side === BLACK) { s.hash[0] ^= zobristSide[0]; s.hash[1] ^= zobristSide[1]; }
  var castStr = parts[2] || '-';
  s.castling = 0;
  if (castStr.indexOf('K') !== -1) s.castling |= 1;
  if (castStr.indexOf('Q') !== -1) s.castling |= 2;
  if (castStr.indexOf('k') !== -1) s.castling |= 4;
  if (castStr.indexOf('q') !== -1) s.castling |= 8;
  s.hash[0] ^= zobristCastle[s.castling][0];
  s.hash[1] ^= zobristCastle[s.castling][1];
  if (parts[3] && parts[3] !== '-') {
    var ef = parts[3].charCodeAt(0) - 97;
    var er = 8 - parseInt(parts[3][1]);
    s.ep = sq88(er, ef);
    s.hash[0] ^= zobristEP[s.ep][0];
    s.hash[1] ^= zobristEP[s.ep][1];
  }
  s.halfmove = parseInt(parts[4]) || 0;
  return s;
}

// ============ MOVE GENERATION ============
var KNIGHT_OFFSETS = [-33, -31, -18, -14, 14, 18, 31, 33];
var BISHOP_OFFSETS = [-17, -15, 15, 17];
var ROOK_OFFSETS = [-16, -1, 1, 16];
var QUEEN_OFFSETS = [-17, -16, -15, -1, 1, 15, 16, 17];

function Move(from, to, captured, promotion, flags) {
  this.from = from;
  this.to = to;
  this.captured = captured || 0;
  this.promotion = promotion || 0;
  this.flags = flags || 0;
}
var FLAG_EP = 1, FLAG_CASTLE = 2, FLAG_PAWN2 = 4, FLAG_PROMO = 8;

function generateMoves(state, capturesOnly) {
  var moves = [];
  var side = state.side;
  var opp = 1 - side;
  for (var sq = 0; sq < 128; sq++) {
    if (sq & 0x88) continue;
    if (state.board[sq] === EMPTY || state.colors[sq] !== side) continue;
    var piece = state.board[sq];
    if (piece === PAWN) {
      var dir = side === WHITE ? -16 : 16;
      var startRank = side === WHITE ? 6 : 1;
      var promoRank = side === WHITE ? 0 : 7;
      var to = sq + dir;
      if (onBoard(to) && state.board[to] === EMPTY && !capturesOnly) {
        if (rank88(to) === promoRank) {
          moves.push(new Move(sq, to, 0, QUEEN, FLAG_PROMO));
          moves.push(new Move(sq, to, 0, KNIGHT, FLAG_PROMO));
          moves.push(new Move(sq, to, 0, ROOK, FLAG_PROMO));
          moves.push(new Move(sq, to, 0, BISHOP, FLAG_PROMO));
        } else {
          moves.push(new Move(sq, to, 0, 0, 0));
          if (rank88(sq) === startRank) {
            var to2 = sq + dir * 2;
            if (state.board[to2] === EMPTY) moves.push(new Move(sq, to2, 0, 0, FLAG_PAWN2));
          }
        }
      }
      for (var d = -1; d <= 1; d += 2) {
        var cap = sq + dir + d;
        if (!onBoard(cap)) continue;
        if (state.board[cap] !== EMPTY && state.colors[cap] === opp) {
          if (rank88(cap) === promoRank) {
            moves.push(new Move(sq, cap, state.board[cap], QUEEN, FLAG_PROMO));
            moves.push(new Move(sq, cap, state.board[cap], KNIGHT, FLAG_PROMO));
          } else {
            moves.push(new Move(sq, cap, state.board[cap], 0, 0));
          }
        }
        if (cap === state.ep) {
          moves.push(new Move(sq, cap, PAWN, 0, FLAG_EP));
        }
      }
    } else if (piece === KNIGHT) {
      for (var i = 0; i < 8; i++) {
        var to = sq + KNIGHT_OFFSETS[i];
        if (!onBoard(to)) continue;
        if (state.board[to] === EMPTY) { if (!capturesOnly) moves.push(new Move(sq, to, 0, 0, 0)); }
        else if (state.colors[to] === opp) moves.push(new Move(sq, to, state.board[to], 0, 0));
      }
    } else if (piece === KING) {
      for (var i = 0; i < 8; i++) {
        var to = sq + QUEEN_OFFSETS[i];
        if (!onBoard(to)) continue;
        if (state.board[to] === EMPTY) { if (!capturesOnly) moves.push(new Move(sq, to, 0, 0, 0)); }
        else if (state.colors[to] === opp) moves.push(new Move(sq, to, state.board[to], 0, 0));
      }
      if (!capturesOnly) {
        if (side === WHITE) {
          if ((state.castling & 1) && state.board[sq88(7,5)] === EMPTY && state.board[sq88(7,6)] === EMPTY && !isAttacked(state, sq, opp) && !isAttacked(state, sq88(7,5), opp) && !isAttacked(state, sq88(7,6), opp))
            moves.push(new Move(sq, sq88(7,6), 0, 0, FLAG_CASTLE));
          if ((state.castling & 2) && state.board[sq88(7,3)] === EMPTY && state.board[sq88(7,2)] === EMPTY && state.board[sq88(7,1)] === EMPTY && !isAttacked(state, sq, opp) && !isAttacked(state, sq88(7,3), opp) && !isAttacked(state, sq88(7,2), opp))
            moves.push(new Move(sq, sq88(7,2), 0, 0, FLAG_CASTLE));
        } else {
          if ((state.castling & 4) && state.board[sq88(0,5)] === EMPTY && state.board[sq88(0,6)] === EMPTY && !isAttacked(state, sq, opp) && !isAttacked(state, sq88(0,5), opp) && !isAttacked(state, sq88(0,6), opp))
            moves.push(new Move(sq, sq88(0,6), 0, 0, FLAG_CASTLE));
          if ((state.castling & 8) && state.board[sq88(0,3)] === EMPTY && state.board[sq88(0,2)] === EMPTY && state.board[sq88(0,1)] === EMPTY && !isAttacked(state, sq, opp) && !isAttacked(state, sq88(0,3), opp) && !isAttacked(state, sq88(0,2), opp))
            moves.push(new Move(sq, sq88(0,2), 0, 0, FLAG_CASTLE));
        }
      }
    } else {
      var offsets = piece === BISHOP ? BISHOP_OFFSETS : piece === ROOK ? ROOK_OFFSETS : QUEEN_OFFSETS;
      for (var i = 0; i < offsets.length; i++) {
        var to = sq + offsets[i];
        while (onBoard(to)) {
          if (state.board[to] === EMPTY) { if (!capturesOnly) moves.push(new Move(sq, to, 0, 0, 0)); }
          else {
            if (state.colors[to] === opp) moves.push(new Move(sq, to, state.board[to], 0, 0));
            break;
          }
          to += offsets[i];
        }
      }
    }
  }
  return moves;
}

function isAttacked(state, sq, byColor) {
  var dir = byColor === WHITE ? 16 : -16;
  if (onBoard(sq + dir - 1) && state.board[sq + dir - 1] === PAWN && state.colors[sq + dir - 1] === byColor) return true;
  if (onBoard(sq + dir + 1) && state.board[sq + dir + 1] === PAWN && state.colors[sq + dir + 1] === byColor) return true;
  for (var i = 0; i < 8; i++) {
    var to = sq + KNIGHT_OFFSETS[i];
    if (onBoard(to) && state.board[to] === KNIGHT && state.colors[to] === byColor) return true;
  }
  for (var i = 0; i < 4; i++) {
    var to = sq + BISHOP_OFFSETS[i];
    while (onBoard(to)) {
      if (state.board[to] !== EMPTY) {
        if (state.colors[to] === byColor && (state.board[to] === BISHOP || state.board[to] === QUEEN)) return true;
        break;
      }
      to += BISHOP_OFFSETS[i];
    }
  }
  for (var i = 0; i < 4; i++) {
    var to = sq + ROOK_OFFSETS[i];
    while (onBoard(to)) {
      if (state.board[to] !== EMPTY) {
        if (state.colors[to] === byColor && (state.board[to] === ROOK || state.board[to] === QUEEN)) return true;
        break;
      }
      to += ROOK_OFFSETS[i];
    }
  }
  for (var i = 0; i < 8; i++) {
    var to = sq + QUEEN_OFFSETS[i];
    if (onBoard(to) && state.board[to] === KING && state.colors[to] === byColor) return true;
  }
  return false;
}

function inCheck(state, color) {
  return isAttacked(state, state.kings[color], 1 - color);
}

// ============ MAKE / UNMAKE ============
function makeMove(state, move) {
  var s = state.clone();
  var from = move.from, to = move.to;
  var piece = s.board[from];
  var color = s.colors[from];
  var opp = 1 - color;
  var pi = pieceIndex(color, piece);
  s.hash[0] ^= zobristTable[from][pi][0]; s.hash[1] ^= zobristTable[from][pi][1];
  s.hash[0] ^= zobristCastle[s.castling][0]; s.hash[1] ^= zobristCastle[s.castling][1];
  if (s.ep !== -1) { s.hash[0] ^= zobristEP[s.ep][0]; s.hash[1] ^= zobristEP[s.ep][1]; }
  if (move.captured && !(move.flags & FLAG_EP)) {
    var cpi = pieceIndex(opp, move.captured);
    s.hash[0] ^= zobristTable[to][cpi][0]; s.hash[1] ^= zobristTable[to][cpi][1];
    s.material[opp] -= PIECE_VAL[move.captured];
  }
  if (move.flags & FLAG_EP) {
    var epSq = to + (color === WHITE ? 16 : -16);
    var cpi = pieceIndex(opp, PAWN);
    s.hash[0] ^= zobristTable[epSq][cpi][0]; s.hash[1] ^= zobristTable[epSq][cpi][1];
    s.board[epSq] = EMPTY; s.colors[epSq] = -1;
    s.material[opp] -= PIECE_VAL[PAWN];
  }
  s.board[from] = EMPTY; s.colors[from] = -1;
  if (move.flags & FLAG_PROMO) {
    s.board[to] = move.promotion; s.colors[to] = color;
    var npi = pieceIndex(color, move.promotion);
    s.hash[0] ^= zobristTable[to][npi][0]; s.hash[1] ^= zobristTable[to][npi][1];
    s.material[color] += PIECE_VAL[move.promotion] - PIECE_VAL[PAWN];
  } else {
    s.board[to] = piece; s.colors[to] = color;
    s.hash[0] ^= zobristTable[to][pi][0]; s.hash[1] ^= zobristTable[to][pi][1];
  }
  if (piece === KING) {
    s.kings[color] = to;
    if (move.flags & FLAG_CASTLE) {
      if (to > from) { // kingside
        var rFrom = to + 1, rTo = to - 1;
        var rpi = pieceIndex(color, ROOK);
        s.hash[0] ^= zobristTable[rFrom][rpi][0]; s.hash[1] ^= zobristTable[rFrom][rpi][1];
        s.hash[0] ^= zobristTable[rTo][rpi][0]; s.hash[1] ^= zobristTable[rTo][rpi][1];
        s.board[rTo] = ROOK; s.colors[rTo] = color;
        s.board[rFrom] = EMPTY; s.colors[rFrom] = -1;
      } else { // queenside
        var rFrom = to - 2, rTo = to + 1;
        var rpi = pieceIndex(color, ROOK);
        s.hash[0] ^= zobristTable[rFrom][rpi][0]; s.hash[1] ^= zobristTable[rFrom][rpi][1];
        s.hash[0] ^= zobristTable[rTo][rpi][0]; s.hash[1] ^= zobristTable[rTo][rpi][1];
        s.board[rTo] = ROOK; s.colors[rTo] = color;
        s.board[rFrom] = EMPTY; s.colors[rFrom] = -1;
      }
    }
  }
  if (piece === KING) {
    if (color === WHITE) s.castling &= ~3;
    else s.castling &= ~12;
  }
  if (piece === ROOK) {
    if (from === sq88(7,0)) s.castling &= ~2;
    if (from === sq88(7,7)) s.castling &= ~1;
    if (from === sq88(0,0)) s.castling &= ~8;
    if (from === sq88(0,7)) s.castling &= ~4;
  }
  if (to === sq88(7,0)) s.castling &= ~2;
  if (to === sq88(7,7)) s.castling &= ~1;
  if (to === sq88(0,0)) s.castling &= ~8;
  if (to === sq88(0,7)) s.castling &= ~4;
  s.hash[0] ^= zobristCastle[s.castling][0]; s.hash[1] ^= zobristCastle[s.castling][1];
  s.ep = -1;
  if (move.flags & FLAG_PAWN2) {
    s.ep = from + (color === WHITE ? -16 : 16);
    s.hash[0] ^= zobristEP[s.ep][0]; s.hash[1] ^= zobristEP[s.ep][1];
  }
  s.side = opp;
  s.hash[0] ^= zobristSide[0]; s.hash[1] ^= zobristSide[1];
  s.halfmove = (piece === PAWN || move.captured) ? 0 : s.halfmove + 1;
  return s;
}

function isLegal(state, move) {
  var ns = makeMove(state, move);
  return !inCheck(ns, state.side);
}

function getLegalMoves(state, capturesOnly) {
  return generateMoves(state, capturesOnly).filter(function(m) { return isLegal(state, m); });
}

// ============ TRANSPOSITION TABLE ============
var TT_EXACT = 0, TT_ALPHA = 1, TT_BETA = 2;
var tt = {};
var ttSize = 0;
var MAX_TT = 500000;

function ttKey(state) { return state.hash[0].toString(16) + state.hash[1].toString(16); }

function ttProbe(state, depth, alpha, beta) {
  var e = tt[ttKey(state)];
  if (!e || e.depth < depth) return null;
  if (e.flag === TT_EXACT) return e.score;
  if (e.flag === TT_ALPHA && e.score <= alpha) return alpha;
  if (e.flag === TT_BETA && e.score >= beta) return beta;
  return null;
}

function ttStore(state, depth, score, flag, bestMove) {
  if (ttSize > MAX_TT) { tt = {}; ttSize = 0; }
  var k = ttKey(state);
  if (!tt[k]) ttSize++;
  tt[k] = { depth: depth, score: score, flag: flag, bestMove: bestMove };
}

function ttBestMove(state) {
  var e = tt[ttKey(state)];
  return e ? e.bestMove : null;
}

// ============ MOVE ORDERING ============
var killerMoves = [];
var historyTable = {};
for (var i = 0; i < 64; i++) killerMoves[i] = [null, null];

function mvvLvaScore(move) {
  if (!move.captured) return 0;
  return PIECE_VAL[move.captured] * 10 - PIECE_VAL[0];
}

function orderMoves(moves, state, ply, hashMove) {
  var scored = moves.map(function(m) {
    var s = 0;
    if (hashMove && m.from === hashMove.from && m.to === hashMove.to) s = 100000;
    else if (m.captured) s = 50000 + mvvLvaScore(m);
    else if (killerMoves[ply] && ((killerMoves[ply][0] && m.from === killerMoves[ply][0].from && m.to === killerMoves[ply][0].to) || (killerMoves[ply][1] && m.from === killerMoves[ply][1].from && m.to === killerMoves[ply][1].to)))
      s = 40000;
    else {
      var hk = m.from + '-' + m.to;
      s = historyTable[hk] || 0;
    }
    return { move: m, score: s };
  });
  scored.sort(function(a, b) { return b.score - a.score; });
  return scored.map(function(x) { return x.move; });
}

// ============ EVALUATION ============
var rlWeights = null;

function evaluate(state) {
  var score = 0;
  var wMat = 0, bMat = 0;
  for (var sq = 0; sq < 128; sq++) {
    if (sq & 0x88) continue;
    if (state.board[sq] === EMPTY) continue;
    var p = state.board[sq], c = state.colors[sq];
    var val = PIECE_VAL[p];
    if (c === WHITE) wMat += val; else bMat += val;
    var pstSq = c === WHITE ? sq : mirror88(sq);
    var pstVal = PST[p] ? PST[p][pstSq] : 0;
    if (rlWeights) {
      var wk = p + '-' + (pstSq & 0x77);
      if (rlWeights[wk]) pstVal += rlWeights[wk];
    }
    if (c === WHITE) score += val + pstVal;
    else score -= val + pstVal;
  }
  var isEndgame = (wMat + bMat) < 3200;
  if (isEndgame) {
    var wkSq = state.side === WHITE ? state.kings[WHITE] : mirror88(state.kings[WHITE]);
    var bkSq = state.side === WHITE ? mirror88(state.kings[BLACK]) : state.kings[BLACK];
    score += KING_END[wkSq] - KING_END[bkSq];
  }
  return state.side === WHITE ? score : -score;
}

// ============ QUIESCENCE SEARCH ============
function quiescence(state, alpha, beta, depth) {
  var standPat = evaluate(state);
  if (standPat >= beta) return beta;
  if (depth <= -6) return standPat;
  if (standPat > alpha) alpha = standPat;
  var moves = getLegalMoves(state, true);
  moves.sort(function(a, b) { return mvvLvaScore(b) - mvvLvaScore(a); });
  for (var i = 0; i < moves.length; i++) {
    if (PIECE_VAL[moves[i].captured] + 200 + standPat < alpha) continue;
    var ns = makeMove(state, moves[i]);
    var score = -quiescence(ns, -beta, -alpha, depth - 1);
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

// ============ ALPHA-BETA SEARCH ============
var nodesSearched = 0;

function alphaBeta(state, depth, alpha, beta, ply) {
  nodesSearched++;
  if (state.halfmove >= 100) return 0;
  var ttScore = ttProbe(state, depth, alpha, beta);
  if (ttScore !== null && ply > 0) return ttScore;
  if (depth <= 0) return quiescence(state, alpha, beta, 0);
  var moves = getLegalMoves(state, false);
  if (moves.length === 0) {
    if (inCheck(state, state.side)) return -INF + ply;
    return 0;
  }
  var hashMove = ttBestMove(state);
  moves = orderMoves(moves, state, ply, hashMove);
  var bestScore = -INF;
  var bestMove = moves[0];
  var flag = TT_ALPHA;
  for (var i = 0; i < moves.length; i++) {
    var ns = makeMove(state, moves[i]);
    var score;
    if (i === 0) {
      score = -alphaBeta(ns, depth - 1, -beta, -alpha, ply + 1);
    } else {
      score = -alphaBeta(ns, depth - 1, -alpha - 1, -alpha, ply + 1);
      if (score > alpha && score < beta) {
        score = -alphaBeta(ns, depth - 1, -beta, -alpha, ply + 1);
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMove = moves[i];
    }
    if (score > alpha) {
      alpha = score;
      flag = TT_EXACT;
    }
    if (alpha >= beta) {
      flag = TT_BETA;
      if (!moves[i].captured) {
        killerMoves[ply][1] = killerMoves[ply][0];
        killerMoves[ply][0] = moves[i];
        var hk = moves[i].from + '-' + moves[i].to;
        historyTable[hk] = (historyTable[hk] || 0) + depth * depth;
      }
      break;
    }
  }
  ttStore(state, depth, bestScore, flag, bestMove);
  return bestScore;
}

// ============ ITERATIVE DEEPENING ============
function searchBestMove(state, maxDepth, timeLimit) {
  nodesSearched = 0;
  var startTime = Date.now();
  var bestMove = null;
  var bestScore = -INF;
  for (var d = 1; d <= maxDepth; d++) {
    killerMoves.forEach(function(k) { k[0] = null; k[1] = null; });
    var score = alphaBeta(state, d, -INF, INF, 0);
    var entry = tt[ttKey(state)];
    if (entry && entry.bestMove) {
      bestMove = entry.bestMove;
      bestScore = score;
    }
    if (Date.now() - startTime > timeLimit) break;
  }
  return { move: bestMove, score: bestScore, nodes: nodesSearched, depth: d - 1 };
}

// ============ OPENING BOOK ============
var openingBook = {};

function initOpeningBook(bookData) {
  if (!bookData) return;
  for (var i = 0; i < bookData.length; i++) {
    var entry = bookData[i];
    if (entry.moves && entry.moves.length >= 2) {
      for (var j = 0; j < entry.moves.length - 1; j++) {
        var key = entry.moves.slice(0, j + 1).join(' ');
        if (!openingBook[key]) openingBook[key] = [];
        if (openingBook[key].indexOf(entry.moves[j + 1]) === -1) {
          openingBook[key].push(entry.moves[j + 1]);
        }
      }
    }
  }
}

function lookupBook(movesPlayed) {
  var key = movesPlayed.join(' ');
  var responses = openingBook[key];
  if (responses && responses.length > 0) {
    return responses[Math.floor(Math.random() * responses.length)];
  }
  return null;
}

// ============ RL WEIGHTS ============
function loadRLWeights(data) {
  if (data) rlWeights = data;
}

function adjustRLWeights(gameResult, movesPlayed) {
  if (!rlWeights) rlWeights = {};
  var adjustment = gameResult === 'win' ? 2 : gameResult === 'loss' ? -2 : 0;
  for (var sq = 0; sq < 128; sq++) {
    if (sq & 0x88) continue;
    for (var p = 1; p <= 6; p++) {
      var wk = p + '-' + (sq & 0x77);
      if (rlWeights[wk]) rlWeights[wk] = Math.max(-50, Math.min(50, rlWeights[wk] + adjustment * (Math.random() - 0.3)));
    }
  }
  return rlWeights;
}

// ============ SQ CONVERSION ============
function toAlgebraic(sq) {
  return String.fromCharCode(97 + file88(sq)) + (8 - rank88(sq));
}
function fromAlgebraic(s) {
  return sq88(8 - parseInt(s[1]), s.charCodeAt(0) - 97);
}

// ============ WORKER MESSAGE HANDLER ============
self.onmessage = function(e) {
  var msg = e.data;
  if (msg.type === 'init') {
    if (msg.openingBook) initOpeningBook(msg.openingBook);
    if (msg.rlWeights) loadRLWeights(msg.rlWeights);
    self.postMessage({ type: 'ready' });
  }
  else if (msg.type === 'search') {
    var state = parseFEN(msg.fen);
    var bookMove = null;
    if (msg.movesPlayed && msg.movesPlayed.length < 20 && msg.useBook) {
      bookMove = lookupBook(msg.movesPlayed);
    }
    if (bookMove) {
      self.postMessage({ type: 'result', san: bookMove, isBook: true, depth: 0, nodes: 0 });
    } else {
      var maxDepth = msg.maxDepth || 8;
      var timeLimit = msg.timeLimit || 5000;
      if (msg.randomness && msg.randomness > 0) {
        var moves = getLegalMoves(state, false);
        if (moves.length > 0) {
          if (Math.random() < msg.randomness) {
            var rm = moves[Math.floor(Math.random() * moves.length)];
            self.postMessage({ type: 'result', from: toAlgebraic(rm.from), to: toAlgebraic(rm.to), promotion: rm.promotion === QUEEN ? 'q' : rm.promotion === KNIGHT ? 'n' : rm.promotion === ROOK ? 'r' : rm.promotion === BISHOP ? 'b' : undefined, isBook: false, depth: 0, nodes: 0 });
            return;
          }
        }
      }
      var result = searchBestMove(state, maxDepth, timeLimit);
      if (result.move) {
        self.postMessage({
          type: 'result',
          from: toAlgebraic(result.move.from),
          to: toAlgebraic(result.move.to),
          promotion: result.move.promotion === QUEEN ? 'q' : result.move.promotion === KNIGHT ? 'n' : result.move.promotion === ROOK ? 'r' : result.move.promotion === BISHOP ? 'b' : undefined,
          score: result.score,
          depth: result.depth,
          nodes: result.nodes,
          isBook: false
        });
      } else {
        self.postMessage({ type: 'error', message: 'No legal moves' });
      }
    }
  }
  else if (msg.type === 'adjustRL') {
    var newWeights = adjustRLWeights(msg.result, msg.movesPlayed);
    self.postMessage({ type: 'rlWeights', weights: newWeights });
  }
  else if (msg.type === 'clearTT') {
    tt = {}; ttSize = 0;
    self.postMessage({ type: 'ttCleared' });
  }
};
`;

// ============ ENGINE BRIDGE ============
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OPENINGS } from '../data/openingData';

interface SearchResult {
  from?: string;
  to?: string;
  san?: string;
  promotion?: string;
  score?: number;
  depth?: number;
  nodes?: number;
  isBook?: boolean;
}

interface DifficultyConfig {
  maxDepth: number;
  timeLimit: number;
  randomness: number;
  useBook: boolean;
}

const DIFFICULTY_CONFIGS: Record<string, DifficultyConfig> = {
  beginner:     { maxDepth: 2,  timeLimit: 500,   randomness: 0.6,  useBook: false },
  intermediate: { maxDepth: 4,  timeLimit: 1500,  randomness: 0.15, useBook: true },
  advanced:     { maxDepth: 8,  timeLimit: 3000,  randomness: 0.03, useBook: true },
  master:       { maxDepth: 14, timeLimit: 8000,  randomness: 0,    useBook: true },
  beyondmaster: { maxDepth: 20, timeLimit: 15000, randomness: 0,    useBook: true },
};

let worker: Worker | null = null;
let pendingResolve: ((result: SearchResult) => void) | null = null;
let isReady = false;
let rlWeightsCache: any = null;

async function loadRLWeights(): Promise<any> {
  try {
    const raw = await AsyncStorage.getItem('chess_rl_weights');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

async function saveRLWeights(weights: any): Promise<void> {
  try {
    await AsyncStorage.setItem('chess_rl_weights', JSON.stringify(weights));
    rlWeightsCache = weights;
  } catch {}
}

export async function initEngine(): Promise<void> {
  if (Platform.OS !== 'web') return;
  if (worker) return;

  rlWeightsCache = await loadRLWeights();

  const blob = new Blob([ENGINE_SOURCE], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  worker = new Worker(url);

  return new Promise((resolve) => {
    worker!.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'ready') {
        isReady = true;
        resolve();
      } else if (msg.type === 'result' || msg.type === 'error') {
        if (pendingResolve) {
          pendingResolve(msg.type === 'error' ? {} : msg);
          pendingResolve = null;
        }
      } else if (msg.type === 'rlWeights') {
        saveRLWeights(msg.weights);
      }
    };

    worker!.postMessage({
      type: 'init',
      openingBook: OPENINGS,
      rlWeights: rlWeightsCache,
    });
  });
}

export function searchMove(
  fen: string,
  difficulty: string,
  movesPlayed: string[]
): Promise<SearchResult> {
  return new Promise(async (resolve) => {
    if (!worker || !isReady) {
      await initEngine();
    }

    const config = DIFFICULTY_CONFIGS[difficulty] || DIFFICULTY_CONFIGS.advanced;
    pendingResolve = resolve;

    worker!.postMessage({
      type: 'search',
      fen,
      movesPlayed,
      maxDepth: config.maxDepth,
      timeLimit: config.timeLimit,
      randomness: config.randomness,
      useBook: config.useBook,
    });

    // Safety timeout
    setTimeout(() => {
      if (pendingResolve === resolve) {
        pendingResolve = null;
        resolve({});
      }
    }, config.timeLimit + 5000);
  });
}

export function reportGameResult(result: 'win' | 'loss' | 'draw', movesPlayed: string[]): void {
  if (!worker || !isReady) return;
  worker.postMessage({ type: 'adjustRL', result, movesPlayed });
}

export function clearTranspositionTable(): void {
  if (!worker || !isReady) return;
  worker.postMessage({ type: 'clearTT' });
}
