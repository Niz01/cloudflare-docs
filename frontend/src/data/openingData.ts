export const OPENINGS = [
  {
    "opening_id": "italian_game",
    "name": "Italian Game",
    "eco": "C50-C54",
    "moves": [
      "e4",
      "e5",
      "Nf3",
      "Nc6",
      "Bc4"
    ],
    "fen": "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
    "description": "One of the oldest openings, aiming to control the center and attack f7.",
    "difficulty": "beginner",
    "category": "open_game",
    "main_ideas": [
      "Control d5 and f7",
      "Rapid development",
      "Castle kingside quickly"
    ],
    "famous_games": [
      "Evergreen Game - Anderssen vs Dufresne 1852"
    ]
  },
  {
    "opening_id": "ruy_lopez",
    "name": "Ruy Lopez (Spanish Game)",
    "eco": "C60-C99",
    "moves": [
      "e4",
      "e5",
      "Nf3",
      "Nc6",
      "Bb5"
    ],
    "fen": "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
    "description": "Named after Spanish priest Ruy L\u00f3pez de Segura. One of the most popular openings.",
    "difficulty": "intermediate",
    "category": "open_game",
    "main_ideas": [
      "Pressure on e5 pawn",
      "Long-term positional play",
      "Many strategic plans"
    ],
    "famous_games": [
      "Game of the Century - Fischer vs Byrne 1956"
    ]
  },
  {
    "opening_id": "sicilian_defense",
    "name": "Sicilian Defense",
    "eco": "B20-B99",
    "moves": [
      "e4",
      "c5"
    ],
    "fen": "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2",
    "description": "The most popular response to 1.e4. Leads to asymmetrical positions.",
    "difficulty": "intermediate",
    "category": "semi_open",
    "main_ideas": [
      "Fight for d4 square",
      "Counterattack on queenside",
      "Asymmetrical pawn structure"
    ],
    "famous_games": [
      "Kasparov vs Topalov 1999 - Najdorf Sicilian"
    ]
  },
  {
    "opening_id": "french_defense",
    "name": "French Defense",
    "eco": "C00-C19",
    "moves": [
      "e4",
      "e6"
    ],
    "fen": "rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
    "description": "Solid defense that leads to strategic, closed positions.",
    "difficulty": "intermediate",
    "category": "semi_open",
    "main_ideas": [
      "Solid pawn structure",
      "Counter in the center with d5",
      "Attack on the queenside"
    ],
    "famous_games": [
      "Alekhine vs Nimzowitsch 1930"
    ]
  },
  {
    "opening_id": "caro_kann",
    "name": "Caro-Kann Defense",
    "eco": "B10-B19",
    "moves": [
      "e4",
      "c6"
    ],
    "fen": "rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
    "description": "Solid defense preparing d5, similar to French but avoids bad bishop.",
    "difficulty": "intermediate",
    "category": "semi_open",
    "main_ideas": [
      "Solid pawn structure",
      "Good bishop development",
      "Less cramped than French"
    ],
    "famous_games": [
      "Karpov vs Kasparov 1984 World Championship"
    ]
  },
  {
    "opening_id": "scandinavian",
    "name": "Scandinavian Defense",
    "eco": "B01",
    "moves": [
      "e4",
      "d5"
    ],
    "fen": "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2",
    "description": "Immediately challenges White's e4 pawn. Simple and direct.",
    "difficulty": "beginner",
    "category": "semi_open",
    "main_ideas": [
      "Immediate central challenge",
      "Quick development",
      "Simple plans"
    ],
    "famous_games": [
      "Anand vs Leko 2000"
    ]
  },
  {
    "opening_id": "queens_gambit",
    "name": "Queen's Gambit",
    "eco": "D06-D69",
    "moves": [
      "d4",
      "d5",
      "c4"
    ],
    "fen": "rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq c3 0 2",
    "description": "Classic opening offering a pawn sacrifice for central control.",
    "difficulty": "intermediate",
    "category": "closed_game",
    "main_ideas": [
      "Central control",
      "Pressure on d5",
      "Minority attack on queenside"
    ],
    "famous_games": [
      "Kasparov vs Karpov 1985 World Championship"
    ]
  },
  {
    "opening_id": "kings_indian",
    "name": "King's Indian Defense",
    "eco": "E60-E99",
    "moves": [
      "d4",
      "Nf6",
      "c4",
      "g6"
    ],
    "fen": "rnbqkb1r/pppppp1p/5np1/8/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3",
    "description": "Hypermodern defense, allowing White to build center then attacking it.",
    "difficulty": "advanced",
    "category": "indian_defense",
    "main_ideas": [
      "Kingside attack",
      "e5 pawn break",
      "Dynamic counterplay"
    ],
    "famous_games": [
      "Kasparov vs Topalov 1999"
    ]
  },
  {
    "opening_id": "nimzo_indian",
    "name": "Nimzo-Indian Defense",
    "eco": "E20-E59",
    "moves": [
      "d4",
      "Nf6",
      "c4",
      "e6",
      "Nc3",
      "Bb4"
    ],
    "fen": "rnbqk2r/pppp1ppp/4pn2/8/1bPP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 4",
    "description": "Flexible defense pinning the knight and fighting for e4.",
    "difficulty": "advanced",
    "category": "indian_defense",
    "main_ideas": [
      "Control e4 square",
      "Double White's pawns",
      "Flexible pawn structure"
    ],
    "famous_games": [
      "Fischer vs Spassky 1972 Game 6"
    ]
  },
  {
    "opening_id": "grunfeld",
    "name": "Gr\u00fcnfeld Defense",
    "eco": "D70-D99",
    "moves": [
      "d4",
      "Nf6",
      "c4",
      "g6",
      "Nc3",
      "d5"
    ],
    "fen": "rnbqkb1r/ppp1pp1p/5np1/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq d6 0 4",
    "description": "Hypermodern opening attacking White's center with pieces.",
    "difficulty": "advanced",
    "category": "indian_defense",
    "main_ideas": [
      "Attack White's center",
      "Pressure on d4",
      "Active piece play"
    ],
    "famous_games": [
      "Kasparov vs Karpov 1987"
    ]
  },
  {
    "opening_id": "slav_defense",
    "name": "Slav Defense",
    "eco": "D10-D19",
    "moves": [
      "d4",
      "d5",
      "c4",
      "c6"
    ],
    "fen": "rnbqkbnr/pp2pppp/2p5/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3",
    "description": "Solid defense to Queen's Gambit, protecting d5 with c6.",
    "difficulty": "intermediate",
    "category": "closed_game",
    "main_ideas": [
      "Solid pawn structure",
      "Develop light-squared bishop",
      "Counter in center"
    ],
    "famous_games": [
      "Carlsen vs Anand 2014 World Championship"
    ]
  },
  {
    "opening_id": "london_system",
    "name": "London System",
    "eco": "D02",
    "moves": [
      "d4",
      "d5",
      "Bf4"
    ],
    "fen": "rnbqkbnr/ppp1pppp/8/3p4/3P1B2/8/PPP1PPPP/RN1QKBNR b KQkq - 1 2",
    "description": "Solid system for White, easy to learn with consistent setup.",
    "difficulty": "beginner",
    "category": "closed_game",
    "main_ideas": [
      "Solid development",
      "Control e5 square",
      "Safe kingside castle"
    ],
    "famous_games": [
      "Carlsen's many London System games"
    ]
  },
  {
    "opening_id": "english_opening",
    "name": "English Opening",
    "eco": "A10-A39",
    "moves": [
      "c4"
    ],
    "fen": "rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq c3 0 1",
    "description": "Flexible flank opening controlling d5 from the side.",
    "difficulty": "intermediate",
    "category": "flank",
    "main_ideas": [
      "Control d5",
      "Flexible pawn structure",
      "Can transpose to many openings"
    ],
    "famous_games": [
      "Botvinnik's English Opening games"
    ]
  },
  {
    "opening_id": "reti_opening",
    "name": "R\u00e9ti Opening",
    "eco": "A04-A09",
    "moves": [
      "Nf3",
      "d5",
      "c4"
    ],
    "fen": "rnbqkbnr/ppp1pppp/8/3p4/2P5/5N2/PP1PPPPP/RNBQKB1R b KQkq c3 0 2",
    "description": "Hypermodern opening delaying central pawn moves.",
    "difficulty": "advanced",
    "category": "flank",
    "main_ideas": [
      "Hypermodern control",
      "Fianchetto bishops",
      "Flexible structure"
    ],
    "famous_games": [
      "R\u00e9ti vs Alekhine 1925"
    ]
  },
  {
    "opening_id": "kings_gambit",
    "name": "King's Gambit",
    "eco": "C30-C39",
    "moves": [
      "e4",
      "e5",
      "f4"
    ],
    "fen": "rnbqkbnr/pppp1ppp/8/4p3/4PP2/8/PPPP2PP/RNBQKBNR b KQkq f3 0 2",
    "description": "Romantic era gambit sacrificing f-pawn for rapid attack.",
    "difficulty": "advanced",
    "category": "gambit",
    "main_ideas": [
      "Rapid development",
      "Open f-file",
      "Attack on f7"
    ],
    "famous_games": [
      "Immortal Game - Anderssen vs Kieseritzky 1851"
    ]
  },
  {
    "opening_id": "evans_gambit",
    "name": "Evans Gambit",
    "eco": "C51-C52",
    "moves": [
      "e4",
      "e5",
      "Nf3",
      "Nc6",
      "Bc4",
      "Bc5",
      "b4"
    ],
    "fen": "r1bqk1nr/pppp1ppp/2n5/2b1p3/1PB1P3/5N2/P1PP1PPP/RNBQK2R b KQkq b3 0 4",
    "description": "Romantic gambit sacrificing b-pawn for rapid development.",
    "difficulty": "intermediate",
    "category": "gambit",
    "main_ideas": [
      "Rapid development",
      "Open lines",
      "Attack on king"
    ],
    "famous_games": [
      "Morphy vs Duke of Brunswick 1858"
    ]
  },
  {
    "opening_id": "scotch_game",
    "name": "Scotch Game",
    "eco": "C44-C45",
    "moves": [
      "e4",
      "e5",
      "Nf3",
      "Nc6",
      "d4"
    ],
    "fen": "r1bqkbnr/pppp1ppp/2n5/4p3/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq d3 0 3",
    "description": "Direct central opening leading to open positions.",
    "difficulty": "beginner",
    "category": "open_game",
    "main_ideas": [
      "Immediate central tension",
      "Open game",
      "Active pieces"
    ],
    "famous_games": [
      "Kasparov vs Karpov 1990"
    ]
  },
  {
    "opening_id": "vienna_game",
    "name": "Vienna Game",
    "eco": "C25-C29",
    "moves": [
      "e4",
      "e5",
      "Nc3"
    ],
    "fen": "rnbqkbnr/pppp1ppp/8/4p3/4P3/2N5/PPPP1PPP/R1BQKBNR b KQkq - 1 2",
    "description": "Flexible opening that can lead to various positions.",
    "difficulty": "intermediate",
    "category": "open_game",
    "main_ideas": [
      "Flexible development",
      "f4 push option",
      "Control center"
    ],
    "famous_games": [
      "Steinitz games"
    ]
  },
  {
    "opening_id": "pirc_defense",
    "name": "Pirc Defense",
    "eco": "B07-B09",
    "moves": [
      "e4",
      "d6",
      "d4",
      "Nf6",
      "Nc3",
      "g6"
    ],
    "fen": "rnbqkb1r/ppp1pp1p/3p1np1/8/3PP3/2N5/PPP2PPP/R1BQKBNR w KQkq - 0 4",
    "description": "Hypermodern defense allowing White a big center.",
    "difficulty": "intermediate",
    "category": "semi_open",
    "main_ideas": [
      "Counterattack center",
      "Kingside fianchetto",
      "Flexible"
    ],
    "famous_games": [
      "Pirc's original games"
    ]
  },
  {
    "opening_id": "alekhine_defense",
    "name": "Alekhine Defense",
    "eco": "B02-B05",
    "moves": [
      "e4",
      "Nf6"
    ],
    "fen": "rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2",
    "description": "Provocative defense luring White's pawns forward.",
    "difficulty": "advanced",
    "category": "semi_open",
    "main_ideas": [
      "Provoke pawn advances",
      "Attack overextended center",
      "Dynamic play"
    ],
    "famous_games": [
      "Alekhine's games"
    ]
  },
  {
    "opening_id": "dutch_defense",
    "name": "Dutch Defense",
    "eco": "A80-A99",
    "moves": [
      "d4",
      "f5"
    ],
    "fen": "rnbqkbnr/ppppp1pp/8/5p2/3P4/8/PPP1PPPP/RNBQKBNR w KQkq f6 0 2",
    "description": "Aggressive defense aiming for kingside attack.",
    "difficulty": "intermediate",
    "category": "closed_game",
    "main_ideas": [
      "Kingside attack",
      "Control e4 square",
      "Stonewall or Leningrad setup"
    ],
    "famous_games": [
      "Botvinnik's Dutch games"
    ]
  },
  {
    "opening_id": "benko_gambit",
    "name": "Benko Gambit",
    "eco": "A57-A59",
    "moves": [
      "d4",
      "Nf6",
      "c4",
      "c5",
      "d5",
      "b5"
    ],
    "fen": "rnbqkb1r/p2ppppp/5n2/1ppP4/2P5/8/PP2PPPP/RNBQKBNR w KQkq b6 0 4",
    "description": "Positional gambit for long-term queenside pressure.",
    "difficulty": "advanced",
    "category": "gambit",
    "main_ideas": [
      "Queenside pressure",
      "Open a and b files",
      "Long-term compensation"
    ],
    "famous_games": [
      "Benko's original games"
    ]
  },
  {
    "opening_id": "catalan_opening",
    "name": "Catalan Opening",
    "eco": "E01-E09",
    "moves": [
      "d4",
      "Nf6",
      "c4",
      "e6",
      "g3"
    ],
    "fen": "rnbqkb1r/pppp1ppp/4pn2/8/2PP4/6P1/PP2PP1P/RNBQKBNR b KQkq - 0 3",
    "description": "Positional opening with fianchettoed bishop.",
    "difficulty": "advanced",
    "category": "closed_game",
    "main_ideas": [
      "Long diagonal pressure",
      "Positional play",
      "Squeeze Black"
    ],
    "famous_games": [
      "Kramnik's Catalan games"
    ]
  },
  {
    "opening_id": "benoni_defense",
    "name": "Benoni Defense",
    "eco": "A60-A79",
    "moves": [
      "d4",
      "Nf6",
      "c4",
      "c5",
      "d5"
    ],
    "fen": "rnbqkb1r/pp1ppppp/5n2/2pP4/2P5/8/PP2PPPP/RNBQKBNR b KQkq - 0 3",
    "description": "Dynamic defense creating asymmetrical pawn structure.",
    "difficulty": "advanced",
    "category": "indian_defense",
    "main_ideas": [
      "Queenside minority",
      "e6 or e5 break",
      "Dynamic counterplay"
    ],
    "famous_games": [
      "Tal vs Petrosian"
    ]
  },
  {
    "opening_id": "trompowsky_attack",
    "name": "Trompowsky Attack",
    "eco": "A45",
    "moves": [
      "d4",
      "Nf6",
      "Bg5"
    ],
    "fen": "rnbqkb1r/pppppppp/5n2/6B1/3P4/8/PPP1PPPP/RN1QKBNR b KQkq - 2 2",
    "description": "Aggressive system avoiding main lines.",
    "difficulty": "intermediate",
    "category": "closed_game",
    "main_ideas": [
      "Avoid theory",
      "Pin knight",
      "Flexible structure"
    ],
    "famous_games": [
      "Julian Hodgson's games"
    ]
  },
  {
    "opening_id": "bird_opening",
    "name": "Bird's Opening",
    "eco": "A02-A03",
    "moves": [
      "f4"
    ],
    "fen": "rnbqkbnr/pppppppp/8/8/5P2/8/PPPPP1PP/RNBQKBNR b KQkq f3 0 1",
    "description": "Flank opening controlling e5 with f-pawn.",
    "difficulty": "intermediate",
    "category": "flank",
    "main_ideas": [
      "Control e5",
      "Kingside play",
      "Avoid main lines"
    ],
    "famous_games": [
      "Bird's original games"
    ]
  },
  {
    "opening_id": "petrov_defense",
    "name": "Petrov Defense (Russian Game)",
    "eco": "C42-C43",
    "moves": [
      "e4",
      "e5",
      "Nf3",
      "Nf6"
    ],
    "fen": "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
    "description": "Solid symmetrical defense aiming for equality.",
    "difficulty": "intermediate",
    "category": "open_game",
    "main_ideas": [
      "Solid equality",
      "Counterattack e4",
      "Safe but playable"
    ],
    "famous_games": [
      "Kramnik's Petrov games"
    ]
  },
  {
    "opening_id": "philidor_defense",
    "name": "Philidor Defense",
    "eco": "C41",
    "moves": [
      "e4",
      "e5",
      "Nf3",
      "d6"
    ],
    "fen": "rnbqkbnr/ppp2ppp/3p4/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3",
    "description": "Solid but passive defense, popularized by Philidor.",
    "difficulty": "beginner",
    "category": "open_game",
    "main_ideas": [
      "Solid structure",
      "Support e5",
      "Slow development"
    ],
    "famous_games": [
      "Philidor's games"
    ]
  },
  {
    "opening_id": "two_knights_defense",
    "name": "Two Knights Defense",
    "eco": "C55-C59",
    "moves": [
      "e4",
      "e5",
      "Nf3",
      "Nc6",
      "Bc4",
      "Nf6"
    ],
    "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    "description": "Sharp defense inviting the Fried Liver Attack.",
    "difficulty": "intermediate",
    "category": "open_game",
    "main_ideas": [
      "Active defense",
      "Counterattack",
      "Sharp play"
    ],
    "famous_games": [
      "Many Fried Liver games"
    ]
  },
  {
    "opening_id": "najdorf_sicilian",
    "name": "Sicilian Najdorf",
    "eco": "B90-B99",
    "moves": [
      "e4",
      "c5",
      "Nf3",
      "d6",
      "d4",
      "cxd4",
      "Nxd4",
      "Nf6",
      "Nc3",
      "a6"
    ],
    "fen": "rnbqkb1r/1p2pppp/p2p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6",
    "description": "The most popular Sicilian, played by Fischer and Kasparov.",
    "difficulty": "advanced",
    "category": "semi_open",
    "main_ideas": [
      "Flexible structure",
      "b5 expansion",
      "Dynamic play"
    ],
    "famous_games": [
      "Fischer vs Spassky 1972"
    ]
  },
  {
    "opening_id": "dragon_sicilian",
    "name": "Sicilian Dragon",
    "eco": "B70-B79",
    "moves": [
      "e4",
      "c5",
      "Nf3",
      "d6",
      "d4",
      "cxd4",
      "Nxd4",
      "Nf6",
      "Nc3",
      "g6"
    ],
    "fen": "rnbqkb1r/pp2pp1p/3p1np1/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6",
    "description": "Sharp Sicilian with fianchettoed bishop.",
    "difficulty": "advanced",
    "category": "semi_open",
    "main_ideas": [
      "Long diagonal",
      "Opposite castling",
      "Tactical battles"
    ],
    "famous_games": [
      "Karpov vs Korchnoi 1974"
    ]
  },
  {
    "opening_id": "smith_morra_gambit",
    "name": "Smith-Morra Gambit",
    "eco": "B21",
    "moves": [
      "e4",
      "c5",
      "d4",
      "cxd4",
      "c3"
    ],
    "fen": "rnbqkbnr/pp1ppppp/8/8/3pP3/2P5/PP3PPP/RNBQKBNR b KQkq - 0 3",
    "description": "Aggressive gambit against the Sicilian.",
    "difficulty": "intermediate",
    "category": "gambit",
    "main_ideas": [
      "Rapid development",
      "Open c-file",
      "Initiative"
    ],
    "famous_games": [
      "Ken Smith's games"
    ]
  },
  {
    "opening_id": "four_knights",
    "name": "Four Knights Game",
    "eco": "C46-C49",
    "moves": [
      "e4",
      "e5",
      "Nf3",
      "Nc6",
      "Nc3",
      "Nf6"
    ],
    "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 4 4",
    "description": "Symmetrical opening leading to balanced positions.",
    "difficulty": "beginner",
    "category": "open_game",
    "main_ideas": [
      "Symmetrical development",
      "Solid structure",
      "Early equality"
    ],
    "famous_games": [
      "Many classical games"
    ]
  },
  {
    "opening_id": "queens_indian",
    "name": "Queen's Indian Defense",
    "eco": "E12-E19",
    "moves": [
      "d4",
      "Nf6",
      "c4",
      "e6",
      "Nf3",
      "b6"
    ],
    "fen": "rnbqkb1r/p1pp1ppp/1p2pn2/8/2PP4/5N2/PP2PPPP/RNBQKB1R w KQkq - 0 4",
    "description": "Flexible defense with queenside fianchetto.",
    "difficulty": "intermediate",
    "category": "indian_defense",
    "main_ideas": [
      "Control e4",
      "Queenside fianchetto",
      "Solid defense"
    ],
    "famous_games": [
      "Many Karpov games"
    ]
  },
  {
    "opening_id": "modern_defense",
    "name": "Modern Defense",
    "eco": "B06",
    "moves": [
      "e4",
      "g6"
    ],
    "fen": "rnbqkbnr/pppppp1p/6p1/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
    "description": "Hypermodern defense with kingside fianchetto.",
    "difficulty": "intermediate",
    "category": "semi_open",
    "main_ideas": [
      "Delay confrontation",
      "Fianchetto bishop",
      "Flexible structure"
    ],
    "famous_games": [
      "Tiger's Modern games"
    ]
  },
  {
    "opening_id": "kings_fianchetto",
    "name": "King's Fianchetto Opening",
    "eco": "A00",
    "moves": [
      "g3"
    ],
    "fen": "rnbqkbnr/pppppppp/8/8/8/6P1/PPPPPP1P/RNBQKBNR b KQkq - 0 1",
    "description": "Flexible opening aiming for kingside fianchetto.",
    "difficulty": "beginner",
    "category": "flank",
    "main_ideas": [
      "Control long diagonal",
      "Flexible setup",
      "Safe king"
    ],
    "famous_games": [
      "Many hypermodern games"
    ]
  },
  {
    "opening_id": "colle_system",
    "name": "Colle System",
    "eco": "D05",
    "moves": [
      "d4",
      "d5",
      "Nf3",
      "Nf6",
      "e3"
    ],
    "fen": "rnbqkb1r/ppp1pppp/5n2/3p4/3P4/4PN2/PPP2PPP/RNBQKB1R b KQkq - 0 3",
    "description": "Solid system aiming for e4 break.",
    "difficulty": "beginner",
    "category": "closed_game",
    "main_ideas": [
      "Solid structure",
      "e4 pawn break",
      "Easy to learn"
    ],
    "famous_games": [
      "Colle's original games"
    ]
  },
  {
    "opening_id": "torre_attack",
    "name": "Torre Attack",
    "eco": "A46",
    "moves": [
      "d4",
      "Nf6",
      "Nf3",
      "e6",
      "Bg5"
    ],
    "fen": "rnbqkb1r/pppp1ppp/4pn2/6B1/3P4/5N2/PPP1PPPP/RN1QKB1R b KQkq - 2 3",
    "description": "System opening avoiding main lines.",
    "difficulty": "intermediate",
    "category": "closed_game",
    "main_ideas": [
      "Pin knight",
      "Avoid theory",
      "Flexible setup"
    ],
    "famous_games": [
      "Torre's games"
    ]
  },
  {
    "opening_id": "tarrasch_defense",
    "name": "Tarrasch Defense",
    "eco": "D32-D34",
    "moves": [
      "d4",
      "d5",
      "c4",
      "e6",
      "Nc3",
      "c5"
    ],
    "fen": "rnbqkbnr/pp3ppp/4p3/2pp4/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq c6 0 4",
    "description": "Active defense with isolated pawn.",
    "difficulty": "advanced",
    "category": "closed_game",
    "main_ideas": [
      "Active pieces",
      "Accept isolated pawn",
      "Central control"
    ],
    "famous_games": [
      "Tarrasch's games"
    ]
  },
  {
    "opening_id": "old_indian",
    "name": "Old Indian Defense",
    "eco": "A53-A55",
    "moves": [
      "d4",
      "Nf6",
      "c4",
      "d6"
    ],
    "fen": "rnbqkb1r/ppp1pppp/3p1n2/8/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3",
    "description": "Solid defense leading to closed positions.",
    "difficulty": "intermediate",
    "category": "indian_defense",
    "main_ideas": [
      "Solid structure",
      "e5 break",
      "Less theory"
    ],
    "famous_games": [
      "Many classical games"
    ]
  },
  {
    "opening_id": "budapest_gambit",
    "name": "Budapest Gambit",
    "eco": "A51-A52",
    "moves": [
      "d4",
      "Nf6",
      "c4",
      "e5"
    ],
    "fen": "rnbqkb1r/pppp1ppp/5n2/4p3/2PP4/8/PP2PPPP/RNBQKBNR w KQkq e6 0 3",
    "description": "Sharp gambit aiming for piece activity.",
    "difficulty": "intermediate",
    "category": "gambit",
    "main_ideas": [
      "Active pieces",
      "Surprise value",
      "Tactical play"
    ],
    "famous_games": [
      "Budapest Gambit games"
    ]
  },
  {
    "opening_id": "stonewall_attack",
    "name": "Stonewall Attack",
    "eco": "D00",
    "moves": [
      "d4",
      "d5",
      "e3",
      "Nf6",
      "Bd3",
      "e6",
      "f4"
    ],
    "fen": "rnbqkb1r/ppp2ppp/4pn2/3p4/3P1P2/3BP3/PPP3PP/RNBQK1NR b KQkq f3 0 4",
    "description": "Solid pawn structure with kingside attack.",
    "difficulty": "beginner",
    "category": "closed_game",
    "main_ideas": [
      "Solid pawns",
      "Kingside attack",
      "Easy to learn"
    ],
    "famous_games": [
      "Many amateur games"
    ]
  },
  {
    "opening_id": "blackmar_diemer",
    "name": "Blackmar-Diemer Gambit",
    "eco": "D00",
    "moves": [
      "d4",
      "d5",
      "e4",
      "dxe4",
      "Nc3"
    ],
    "fen": "rnbqkbnr/ppp1pppp/8/8/3Pp3/2N5/PPP2PPP/R1BQKBNR b KQkq - 1 3",
    "description": "Aggressive gambit for rapid development.",
    "difficulty": "intermediate",
    "category": "gambit",
    "main_ideas": [
      "Fast development",
      "Open lines",
      "Attack"
    ],
    "famous_games": [
      "BDG thematic games"
    ]
  },
  {
    "opening_id": "ponziani",
    "name": "Ponziani Opening",
    "eco": "C44",
    "moves": [
      "e4",
      "e5",
      "Nf3",
      "Nc6",
      "c3"
    ],
    "fen": "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/2P2N2/PP1P1PPP/RNBQKB1R b KQkq - 0 3",
    "description": "Solid opening preparing d4.",
    "difficulty": "beginner",
    "category": "open_game",
    "main_ideas": [
      "Prepare d4",
      "Solid center",
      "Less theory"
    ],
    "famous_games": [
      "Classical games"
    ]
  },
  {
    "opening_id": "scheveningen",
    "name": "Sicilian Scheveningen",
    "eco": "B80-B89",
    "moves": [
      "e4",
      "c5",
      "Nf3",
      "d6",
      "d4",
      "cxd4",
      "Nxd4",
      "Nf6",
      "Nc3",
      "e6"
    ],
    "fen": "rnbqkb1r/pp3ppp/3ppn2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6",
    "description": "Flexible Sicilian with small center.",
    "difficulty": "advanced",
    "category": "semi_open",
    "main_ideas": [
      "Flexible pawn structure",
      "d5 or e5 breaks",
      "Rich middlegame"
    ],
    "famous_games": [
      "Kasparov's Scheveningen games"
    ]
  },
  {
    "opening_id": "accelerated_dragon",
    "name": "Sicilian Accelerated Dragon",
    "eco": "B34-B39",
    "moves": [
      "e4",
      "c5",
      "Nf3",
      "Nc6",
      "d4",
      "cxd4",
      "Nxd4",
      "g6"
    ],
    "fen": "r1bqkbnr/pp1ppp1p/2n3p1/8/3NP3/8/PPP2PPP/RNBQKB1R w KQkq - 0 5",
    "description": "Early fianchetto avoiding the Yugoslav Attack.",
    "difficulty": "intermediate",
    "category": "semi_open",
    "main_ideas": [
      "Quick fianchetto",
      "Avoid Yugoslav Attack",
      "Maroczy Bind risk"
    ],
    "famous_games": [
      "Many modern games"
    ]
  },
  {
    "opening_id": "nimzowitsch_defense",
    "name": "Nimzowitsch Defense",
    "eco": "B00",
    "moves": [
      "e4",
      "Nc6"
    ],
    "fen": "r1bqkbnr/pppppppp/2n5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2",
    "description": "Hypermodern approach, controlling center from the flank.",
    "difficulty": "intermediate",
    "category": "semi_open",
    "main_ideas": [
      "Hypermodern center control",
      "Flexible structure",
      "Surprise value"
    ],
    "famous_games": [
      "Nimzowitsch's original games"
    ]
  },
  {
    "opening_id": "owen_defense",
    "name": "Owen's Defense",
    "eco": "B00",
    "moves": [
      "e4",
      "b6"
    ],
    "fen": "rnbqkbnr/p1pppppp/1p6/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
    "description": "Fianchetto the bishop to b7 to challenge e4.",
    "difficulty": "beginner",
    "category": "semi_open",
    "main_ideas": [
      "Fianchetto bishop",
      "Pressure on e4",
      "Quiet development"
    ],
    "famous_games": [
      "Owen vs Burn 1887"
    ]
  },
  {
    "opening_id": "latvian_gambit",
    "name": "Latvian Gambit",
    "eco": "C40",
    "moves": [
      "e4",
      "e5",
      "Nf3",
      "f5"
    ],
    "fen": "rnbqkbnr/pppp2pp/8/4pp2/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq f6 0 3",
    "description": "A sharp and risky gambit for Black seeking counterplay.",
    "difficulty": "advanced",
    "category": "open_game",
    "main_ideas": [
      "Sharp counterattack",
      "f-file play",
      "High risk high reward"
    ],
    "famous_games": [
      "Romantic era games"
    ]
  },
  {
    "opening_id": "danish_gambit",
    "name": "Danish Gambit",
    "eco": "C21",
    "moves": [
      "e4",
      "e5",
      "d4",
      "exd4",
      "c3"
    ],
    "fen": "rnbqkbnr/pppp1ppp/8/8/3pP3/2P5/PP3PPP/RNBQKBNR b KQkq - 0 3",
    "description": "White sacrifices pawns for rapid development and attack.",
    "difficulty": "intermediate",
    "category": "gambit",
    "main_ideas": [
      "Rapid development",
      "Open lines",
      "Attacking chances"
    ],
    "famous_games": [
      "From's era gambit games"
    ]
  },
  {
    "opening_id": "center_game",
    "name": "Center Game",
    "eco": "C22",
    "moves": [
      "e4",
      "e5",
      "d4",
      "exd4",
      "Qxd4"
    ],
    "fen": "rnbqkbnr/pppp1ppp/8/8/3QP3/8/PPP2PPP/RNB1KBNR b KQkq - 0 3",
    "description": "White immediately recaptures in the center but exposes the queen.",
    "difficulty": "beginner",
    "category": "open_game",
    "main_ideas": [
      "Central control",
      "Early queen development",
      "Tempo loss risk"
    ],
    "famous_games": [
      "Historic center game miniatures"
    ]
  },
  {
    "opening_id": "giuoco_piano",
    "name": "Giuoco Piano",
    "eco": "C53-C54",
    "moves": [
      "e4",
      "e5",
      "Nf3",
      "Nc6",
      "Bc4",
      "Bc5"
    ],
    "fen": "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    "description": "The Quiet Game - solid Italian setup with symmetrical development.",
    "difficulty": "beginner",
    "category": "open_game",
    "main_ideas": [
      "Solid development",
      "Control d4",
      "Prepare c3 and d4"
    ],
    "famous_games": [
      "Morphy era games"
    ]
  },
  {
    "opening_id": "fried_liver",
    "name": "Fried Liver Attack",
    "eco": "C57",
    "moves": [
      "e4",
      "e5",
      "Nf3",
      "Nc6",
      "Bc4",
      "Nf6",
      "Ng5",
      "d5",
      "exd5",
      "Nxd5",
      "Nxf7"
    ],
    "fen": "r1bqkb1r/ppp2Npp/2n5/3np3/2B5/8/PPPP1PPP/RNBQK2R b KQkq - 0 7",
    "description": "Aggressive knight sacrifice on f7 targeting the black king.",
    "difficulty": "intermediate",
    "category": "gambit",
    "main_ideas": [
      "Knight sacrifice on f7",
      "Expose the king",
      "Tactical fireworks"
    ],
    "famous_games": [
      "Polerio's famous analysis"
    ]
  },
  {
    "opening_id": "max_lange",
    "name": "Max Lange Attack",
    "eco": "C55-C56",
    "moves": [
      "e4",
      "e5",
      "Nf3",
      "Nc6",
      "Bc4",
      "Nf6",
      "d4",
      "exd4",
      "O-O"
    ],
    "fen": "r1bqkb1r/pppp1ppp/2n2n2/8/2BpP3/5N2/PPP2PPP/RNBQ1RK1 b kq - 1 5",
    "description": "Sacrificial gambit offering d4 pawn for rapid piece development.",
    "difficulty": "advanced",
    "category": "gambit",
    "main_ideas": [
      "Sacrifice for development",
      "Open lines",
      "Attack the king"
    ],
    "famous_games": [
      "Max Lange vs Schierstedt 1856"
    ]
  },
  {
    "opening_id": "halloween_gambit",
    "name": "Halloween Gambit",
    "eco": "C47",
    "moves": [
      "e4",
      "e5",
      "Nf3",
      "Nc6",
      "Nc3",
      "Nf6",
      "Nxe5"
    ],
    "fen": "r1bqkb1r/pppp1ppp/2n2n2/4N3/4P3/2N5/PPPP1PPP/R1BQKB1R b KQkq - 0 4",
    "description": "Wild knight sacrifice aiming for rapid central dominance.",
    "difficulty": "intermediate",
    "category": "gambit",
    "main_ideas": [
      "Knight sacrifice for center control",
      "d4 push",
      "Aggressive play"
    ],
    "famous_games": [
      "Brause games on ICC"
    ]
  },
  {
    "opening_id": "vienna_gambit",
    "name": "Vienna Gambit",
    "eco": "C29",
    "moves": [
      "e4",
      "e5",
      "Nc3",
      "Nf6",
      "f4"
    ],
    "fen": "rnbqkb1r/pppp1ppp/5n2/4p3/4PP2/2N5/PPPP2PP/R1BQKBNR b KQkq f3 0 3",
    "description": "Gambit version of the Vienna Game with f4.",
    "difficulty": "intermediate",
    "category": "gambit",
    "main_ideas": [
      "Open f-file",
      "Center pressure",
      "Kingside attack"
    ],
    "famous_games": [
      "Romantic era classics"
    ]
  },
  {
    "opening_id": "bishop_opening",
    "name": "Bishop's Opening",
    "eco": "C23-C24",
    "moves": [
      "e4",
      "e5",
      "Bc4"
    ],
    "fen": "rnbqkbnr/pppp1ppp/8/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR b KQkq - 1 2",
    "description": "Early bishop development to c4, a flexible setup.",
    "difficulty": "beginner",
    "category": "open_game",
    "main_ideas": [
      "Target f7",
      "Flexible setup",
      "Transpose to other openings"
    ],
    "famous_games": [
      "Various classical games"
    ]
  },
  {
    "opening_id": "portuguese_gambit",
    "name": "Portuguese Gambit (Scandinavian)",
    "eco": "B01",
    "moves": [
      "e4",
      "d5",
      "exd5",
      "Nf6",
      "d4",
      "Bg4"
    ],
    "fen": "rn1qkb1r/ppp1pppp/5n2/3P4/3P2b1/8/PPP2PPP/RNBQKBNR w KQkq - 1 4",
    "description": "Aggressive Scandinavian line with bishop pin.",
    "difficulty": "intermediate",
    "category": "semi_open",
    "main_ideas": [
      "Pin the queen",
      "Active piece play",
      "Gambit the pawn"
    ],
    "famous_games": [
      "Portuguese Grandmaster games"
    ]
  },
  {
    "opening_id": "alapin_sicilian",
    "name": "Sicilian Alapin (c3 Sicilian)",
    "eco": "B22",
    "moves": [
      "e4",
      "c5",
      "c3"
    ],
    "fen": "rnbqkbnr/pp1ppppp/8/2p5/4P3/2P5/PP1P1PPP/RNBQKBNR b KQkq - 0 2",
    "description": "White prepares d4 with c3, avoiding main Sicilian theory.",
    "difficulty": "intermediate",
    "category": "semi_open",
    "main_ideas": [
      "Prepare d4",
      "Simpler positions",
      "Avoid theory"
    ],
    "famous_games": [
      "Sveshnikov's games with Alapin"
    ]
  },
  {
    "opening_id": "kan_sicilian",
    "name": "Sicilian Kan (Paulsen)",
    "eco": "B41-B42",
    "moves": [
      "e4",
      "c5",
      "Nf3",
      "e6",
      "d4",
      "cxd4",
      "Nxd4",
      "a6"
    ],
    "fen": "rnbqkbnr/1p1p1ppp/p3p3/8/3NP3/8/PPP2PPP/RNBQKB1R w KQkq - 0 5",
    "description": "Flexible Sicilian with early a6, allowing various setups.",
    "difficulty": "intermediate",
    "category": "semi_open",
    "main_ideas": [
      "Flexible structure",
      "b5 expansion",
      "Multiple piece setups"
    ],
    "famous_games": [
      "Anand's Kan games"
    ]
  },
  {
    "opening_id": "taimanov_sicilian",
    "name": "Sicilian Taimanov",
    "eco": "B44-B49",
    "moves": [
      "e4",
      "c5",
      "Nf3",
      "e6",
      "d4",
      "cxd4",
      "Nxd4",
      "Nc6"
    ],
    "fen": "r1bqkbnr/pp1p1ppp/2n1p3/8/3NP3/8/PPP2PPP/RNBQKB1R w KQkq - 1 5",
    "description": "Dynamic Sicilian system favored by many GMs.",
    "difficulty": "advanced",
    "category": "semi_open",
    "main_ideas": [
      "Central flexibility",
      "e5 or d5 breaks",
      "Rich middlegame"
    ],
    "famous_games": [
      "Taimanov's original games"
    ]
  },
  {
    "opening_id": "sveshnikov_sicilian",
    "name": "Sicilian Sveshnikov",
    "eco": "B33",
    "moves": [
      "e4",
      "c5",
      "Nf3",
      "Nc6",
      "d4",
      "cxd4",
      "Nxd4",
      "Nf6",
      "Nc3",
      "e5"
    ],
    "fen": "r1bqkb1r/pp1p1ppp/2n2n2/4p3/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6",
    "description": "Aggressive system with e5, accepting a backward d-pawn.",
    "difficulty": "advanced",
    "category": "semi_open",
    "main_ideas": [
      "Active piece play",
      "Accept structural weakness",
      "Counterattack"
    ],
    "famous_games": [
      "Sveshnikov's lifetime work"
    ]
  },
  {
    "opening_id": "closed_sicilian",
    "name": "Closed Sicilian",
    "eco": "B23-B26",
    "moves": [
      "e4",
      "c5",
      "Nc3",
      "Nc6",
      "g3"
    ],
    "fen": "r1bqkbnr/pp1ppppp/2n5/2p5/4P3/2N3P1/PPPP1P1P/R1BQKBNR b KQkq - 0 3",
    "description": "White avoids open Sicilian complications with g3 setup.",
    "difficulty": "intermediate",
    "category": "semi_open",
    "main_ideas": [
      "Fianchetto setup",
      "f4 push",
      "Positional play"
    ],
    "famous_games": [
      "Spassky's Closed Sicilian games"
    ]
  },
  {
    "opening_id": "rossolimo_sicilian",
    "name": "Sicilian Rossolimo",
    "eco": "B30-B31",
    "moves": [
      "e4",
      "c5",
      "Nf3",
      "Nc6",
      "Bb5"
    ],
    "fen": "r1bqkbnr/pp1ppppp/2n5/1Bp5/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
    "description": "Anti-Sicilian with Bb5 pin, avoiding theoretical lines.",
    "difficulty": "intermediate",
    "category": "semi_open",
    "main_ideas": [
      "Pin the knight",
      "Avoid main lines",
      "Positional pressure"
    ],
    "famous_games": [
      "Rossolimo's original games"
    ]
  },
  {
    "opening_id": "grand_prix_attack",
    "name": "Grand Prix Attack",
    "eco": "B21",
    "moves": [
      "e4",
      "c5",
      "f4"
    ],
    "fen": "rnbqkbnr/pp1ppppp/8/2p5/4PP2/8/PPPP2PP/RNBQKBNR b KQkq f3 0 2",
    "description": "Aggressive anti-Sicilian with early f4.",
    "difficulty": "intermediate",
    "category": "semi_open",
    "main_ideas": [
      "Kingside attack",
      "f5 push",
      "Aggressive play"
    ],
    "famous_games": [
      "Grand Prix tournament games"
    ]
  },
  {
    "opening_id": "winawer_french",
    "name": "French Winawer Variation",
    "eco": "C15-C19",
    "moves": [
      "e4",
      "e6",
      "d4",
      "d5",
      "Nc3",
      "Bb4"
    ],
    "fen": "rnbqk1nr/ppp2ppp/4p3/3p4/1b1PP3/2N5/PPP2PPP/R1BQKBNR w KQkq - 2 4",
    "description": "The sharpest French Defense variation with Bb4 pin.",
    "difficulty": "advanced",
    "category": "semi_open",
    "main_ideas": [
      "Pin the knight",
      "Pawn chain battle",
      "Structural imbalance"
    ],
    "famous_games": [
      "Botvinnik's Winawer games"
    ]
  },
  {
    "opening_id": "advance_french",
    "name": "French Advance Variation",
    "eco": "C02",
    "moves": [
      "e4",
      "e6",
      "d4",
      "d5",
      "e5"
    ],
    "fen": "rnbqkbnr/ppp2ppp/4p3/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3",
    "description": "White gains space with e5, creating a pawn chain.",
    "difficulty": "intermediate",
    "category": "semi_open",
    "main_ideas": [
      "Space advantage",
      "Pawn chain",
      "Kingside attack"
    ],
    "famous_games": [
      "Nimzowitsch's advance games"
    ]
  },
  {
    "opening_id": "exchange_french",
    "name": "French Exchange Variation",
    "eco": "C01",
    "moves": [
      "e4",
      "e6",
      "d4",
      "d5",
      "exd5",
      "exd5"
    ],
    "fen": "rnbqkbnr/ppp2ppp/8/3p4/3P4/8/PPP2PPP/RNBQKBNR w KQkq - 0 4",
    "description": "Symmetrical pawn structure with equal chances.",
    "difficulty": "beginner",
    "category": "semi_open",
    "main_ideas": [
      "Symmetrical structure",
      "Simple positions",
      "Minority attack"
    ],
    "famous_games": [
      "Classical exchange games"
    ]
  },
  {
    "opening_id": "caro_kann_advance",
    "name": "Caro-Kann Advance Variation",
    "eco": "B12",
    "moves": [
      "e4",
      "c6",
      "d4",
      "d5",
      "e5"
    ],
    "fen": "rnbqkbnr/pp2pppp/2p5/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3",
    "description": "White gains space, similar to French Advance but with c6.",
    "difficulty": "intermediate",
    "category": "semi_open",
    "main_ideas": [
      "Space advantage",
      "Restrict Black's pieces",
      "Kingside expansion"
    ],
    "famous_games": [
      "Short vs Karpov 1992"
    ]
  },
  {
    "opening_id": "caro_kann_classical",
    "name": "Caro-Kann Classical Variation",
    "eco": "B18-B19",
    "moves": [
      "e4",
      "c6",
      "d4",
      "d5",
      "Nc3",
      "dxe4",
      "Nxe4",
      "Bf5"
    ],
    "fen": "rn1qkbnr/pp2pppp/2p5/5b2/3PN3/8/PPP2PPP/R1BQKBNR w KQkq - 1 5",
    "description": "The main line of the Caro-Kann with Bf5 development.",
    "difficulty": "intermediate",
    "category": "semi_open",
    "main_ideas": [
      "Develop bishop before e6",
      "Solid structure",
      "Endgame advantage"
    ],
    "famous_games": [
      "Karpov's many Caro-Kann games"
    ]
  },
  {
    "opening_id": "fantasy_caro_kann",
    "name": "Caro-Kann Fantasy Variation",
    "eco": "B12",
    "moves": [
      "e4",
      "c6",
      "d4",
      "d5",
      "f3"
    ],
    "fen": "rnbqkbnr/pp2pppp/2p5/3p4/3PP3/5P2/PPP3PP/RNBQKBNR b KQkq - 0 3",
    "description": "Aggressive setup supporting e4 with f3.",
    "difficulty": "intermediate",
    "category": "semi_open",
    "main_ideas": [
      "Support e4",
      "Aggressive center",
      "f4 expansion"
    ],
    "famous_games": [
      "Fantasy variation thematic games"
    ]
  },
  {
    "opening_id": "semi_slav",
    "name": "Semi-Slav Defense",
    "eco": "D43-D49",
    "moves": [
      "d4",
      "d5",
      "c4",
      "c6",
      "Nf3",
      "Nf6",
      "Nc3",
      "e6"
    ],
    "fen": "rnbqkb1r/pp3ppp/2p1pn2/3p4/2PP4/2N2N2/PP3PPP/R1BQKB1R w KQkq - 0 5",
    "description": "Solid hybrid of Slav and Queen's Gambit Declined.",
    "difficulty": "advanced",
    "category": "closed_game",
    "main_ideas": [
      "Solid structure",
      "e5 or dxc4 breaks",
      "Rich theory"
    ],
    "famous_games": [
      "Meran and Anti-Meran systems"
    ]
  },
  {
    "opening_id": "meran_variation",
    "name": "Semi-Slav Meran Variation",
    "eco": "D47-D49",
    "moves": [
      "d4",
      "d5",
      "c4",
      "c6",
      "Nf3",
      "Nf6",
      "Nc3",
      "e6",
      "e3",
      "Nbd7",
      "Bd3",
      "dxc4",
      "Bxc4",
      "b5"
    ],
    "fen": "r1bqkb1r/p2n1ppp/2p1pn2/1p6/2BP4/2N1PN2/PP3PPP/R1BQK2R w KQkq b6 0 8",
    "description": "Dynamic b5 push creating queenside counterplay.",
    "difficulty": "advanced",
    "category": "closed_game",
    "main_ideas": [
      "Queenside expansion",
      "b5-b4 push",
      "Active piece play"
    ],
    "famous_games": [
      "Kramnik's Meran games"
    ]
  },
  {
    "opening_id": "qgd_orthodox",
    "name": "Queen's Gambit Declined Orthodox",
    "eco": "D60-D69",
    "moves": [
      "d4",
      "d5",
      "c4",
      "e6",
      "Nc3",
      "Nf6",
      "Bg5",
      "Be7",
      "e3",
      "O-O",
      "Nf3"
    ],
    "fen": "rnbq1rk1/ppp1bppp/4pn2/3p2B1/2PP4/2N1PN2/PP3PPP/R2QKB1R b KQ - 3 6",
    "description": "Classical QGD setup with the Orthodox defense.",
    "difficulty": "intermediate",
    "category": "closed_game",
    "main_ideas": [
      "Solid structure",
      "Minority attack",
      "Classical play"
    ],
    "famous_games": [
      "Capablanca's QGD games"
    ]
  },
  {
    "opening_id": "qgd_ragozin",
    "name": "Ragozin Defense",
    "eco": "D38-D39",
    "moves": [
      "d4",
      "d5",
      "c4",
      "e6",
      "Nc3",
      "Nf6",
      "Nf3",
      "Bb4"
    ],
    "fen": "rnbqk2r/ppp2ppp/4pn2/3p4/1bPP4/2N2N2/PP3PPP/R1BQKB1R w KQkq - 4 5",
    "description": "Active defense combining QGD and Nimzo-Indian ideas.",
    "difficulty": "advanced",
    "category": "closed_game",
    "main_ideas": [
      "Active piece play",
      "Pin the knight",
      "Dynamic positions"
    ],
    "famous_games": [
      "Ragozin's original games"
    ]
  },
  {
    "opening_id": "qga",
    "name": "Queen's Gambit Accepted",
    "eco": "D20-D29",
    "moves": [
      "d4",
      "d5",
      "c4",
      "dxc4"
    ],
    "fen": "rnbqkbnr/ppp1pppp/8/8/2pP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3",
    "description": "Black accepts the gambit pawn and tries to hold it or equalize.",
    "difficulty": "intermediate",
    "category": "closed_game",
    "main_ideas": [
      "Accept the pawn",
      "Active development",
      "Counter in center"
    ],
    "famous_games": [
      "Kasparov's QGA games"
    ]
  },
  {
    "opening_id": "chigorin_defense",
    "name": "Chigorin Defense",
    "eco": "D07",
    "moves": [
      "d4",
      "d5",
      "c4",
      "Nc6"
    ],
    "fen": "r1bqkbnr/ppp1pppp/2n5/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 1 3",
    "description": "Unusual defense developing the knight before the bishop.",
    "difficulty": "intermediate",
    "category": "closed_game",
    "main_ideas": [
      "Knight development",
      "Piece activity",
      "Dynamic play"
    ],
    "famous_games": [
      "Chigorin vs Tarrasch matches"
    ]
  },
  {
    "opening_id": "albin_countergambit",
    "name": "Albin Countergambit",
    "eco": "D08-D09",
    "moves": [
      "d4",
      "d5",
      "c4",
      "e5"
    ],
    "fen": "rnbqkbnr/ppp2ppp/8/3pp3/2PP4/8/PP2PPPP/RNBQKBNR w KQkq e6 0 3",
    "description": "Sharp countergambit trying to seize the initiative.",
    "difficulty": "intermediate",
    "category": "gambit",
    "main_ideas": [
      "Counter in center",
      "e4 push",
      "Lasker trap"
    ],
    "famous_games": [
      "Games featuring the Lasker Trap"
    ]
  },
  {
    "opening_id": "marshall_defense",
    "name": "Marshall Defense (QGD)",
    "eco": "D06",
    "moves": [
      "d4",
      "d5",
      "c4",
      "Nf6"
    ],
    "fen": "rnbqkb1r/ppp1pppp/5n2/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 1 3",
    "description": "Rare but playable defense with Nf6 before e6.",
    "difficulty": "intermediate",
    "category": "closed_game",
    "main_ideas": [
      "Flexible setup",
      "Avoid main QGD lines",
      "Surprise value"
    ],
    "famous_games": [
      "Marshall's original ideas"
    ]
  },
  {
    "opening_id": "kings_indian_classical",
    "name": "King's Indian Classical Variation",
    "eco": "E92-E99",
    "moves": [
      "d4",
      "Nf6",
      "c4",
      "g6",
      "Nc3",
      "Bg7",
      "e4",
      "d6",
      "Nf3",
      "O-O",
      "Be2"
    ],
    "fen": "rnbq1rk1/ppp1ppbp/3p1np1/8/2PPP3/2N2N2/PP2BPPP/R1BQK2R b KQ - 3 6",
    "description": "The main classical line of the King's Indian.",
    "difficulty": "advanced",
    "category": "indian_defense",
    "main_ideas": [
      "e5 break",
      "Kingside attack",
      "f5-f4 pawn storm"
    ],
    "famous_games": [
      "Fischer vs Spassky 1992 Game 1"
    ]
  },
  {
    "opening_id": "kings_indian_samisch",
    "name": "King's Indian Samisch Variation",
    "eco": "E80-E89",
    "moves": [
      "d4",
      "Nf6",
      "c4",
      "g6",
      "Nc3",
      "Bg7",
      "e4",
      "d6",
      "f3"
    ],
    "fen": "rnbqk2r/ppp1ppbp/3p1np1/8/2PPP3/2N2P2/PP4PP/R1BQKBNR b KQkq - 0 5",
    "description": "Aggressive setup with f3, supporting the center and planning Be3.",
    "difficulty": "advanced",
    "category": "indian_defense",
    "main_ideas": [
      "Massive center",
      "Be3 setup",
      "Queenside castling option"
    ],
    "famous_games": [
      "Petrosian's Samisch games"
    ]
  },
  {
    "opening_id": "kings_indian_four_pawns",
    "name": "King's Indian Four Pawns Attack",
    "eco": "E76-E79",
    "moves": [
      "d4",
      "Nf6",
      "c4",
      "g6",
      "Nc3",
      "Bg7",
      "e4",
      "d6",
      "f4"
    ],
    "fen": "rnbqk2r/ppp1ppbp/3p1np1/8/2PPPP2/2N5/PP4PP/R1BQKBNR b KQkq f3 0 5",
    "description": "Ultra-aggressive with four center pawns.",
    "difficulty": "advanced",
    "category": "indian_defense",
    "main_ideas": [
      "Maximum center control",
      "Aggressive expansion",
      "Space advantage"
    ],
    "famous_games": [
      "Various four pawns attack battles"
    ]
  },
  {
    "opening_id": "nimzo_indian_classical",
    "name": "Nimzo-Indian Classical (Capablanca)",
    "eco": "E32",
    "moves": [
      "d4",
      "Nf6",
      "c4",
      "e6",
      "Nc3",
      "Bb4",
      "Qc2"
    ],
    "fen": "rnbqk2r/pppp1ppp/4pn2/8/1bPP4/2N5/PPQ1PPPP/R1B1KBNR b KQkq - 3 4",
    "description": "White avoids doubled pawns with Qc2.",
    "difficulty": "advanced",
    "category": "indian_defense",
    "main_ideas": [
      "Avoid doubled pawns",
      "Prepare e4",
      "Positional play"
    ],
    "famous_games": [
      "Capablanca's original concept"
    ]
  },
  {
    "opening_id": "nimzo_indian_rubinstein",
    "name": "Nimzo-Indian Rubinstein",
    "eco": "E40-E59",
    "moves": [
      "d4",
      "Nf6",
      "c4",
      "e6",
      "Nc3",
      "Bb4",
      "e3"
    ],
    "fen": "rnbqk2r/pppp1ppp/4pn2/8/1bPP4/2N1P3/PP3PPP/R1BQKBNR b KQkq - 0 4",
    "description": "Solid system accepting the doubled pawns possibility.",
    "difficulty": "intermediate",
    "category": "indian_defense",
    "main_ideas": [
      "Solid center",
      "Bishop pair potential",
      "Slow but strong"
    ],
    "famous_games": [
      "Rubinstein's games"
    ]
  },
  {
    "opening_id": "bogo_indian",
    "name": "Bogo-Indian Defense",
    "eco": "E11",
    "moves": [
      "d4",
      "Nf6",
      "c4",
      "e6",
      "Nf3",
      "Bb4+"
    ],
    "fen": "rnbqk2r/pppp1ppp/4pn2/8/1bPP4/5N2/PP2PPPP/RNBQKB1R w KQkq - 2 4",
    "description": "Related to Nimzo-Indian, checking on b4 after Nf3.",
    "difficulty": "intermediate",
    "category": "indian_defense",
    "main_ideas": [
      "Check and trade bishop",
      "Solid setup",
      "Flexible"
    ],
    "famous_games": [
      "Bogoljubow's original games"
    ]
  },
  {
    "opening_id": "grunfeld_exchange",
    "name": "Grunfeld Exchange Variation",
    "eco": "D85-D89",
    "moves": [
      "d4",
      "Nf6",
      "c4",
      "g6",
      "Nc3",
      "d5",
      "cxd5",
      "Nxd5",
      "e4",
      "Nxc3",
      "bxc3"
    ],
    "fen": "rnbqkb1r/ppp1pp1p/6p1/8/3PP3/2P5/P4PPP/R1BQKBNR b KQkq - 0 6",
    "description": "The main theoretical battleground of the Grunfeld.",
    "difficulty": "advanced",
    "category": "indian_defense",
    "main_ideas": [
      "Central pawn mass",
      "White center vs Black piece activity",
      "Dynamic balance"
    ],
    "famous_games": [
      "Kasparov's Grunfeld masterpieces"
    ]
  },
  {
    "opening_id": "grunfeld_russian",
    "name": "Grunfeld Russian System",
    "eco": "D97",
    "moves": [
      "d4",
      "Nf6",
      "c4",
      "g6",
      "Nc3",
      "d5",
      "Nf3",
      "Bg7",
      "Qb3"
    ],
    "fen": "rnbqk2r/ppp1ppbp/5np1/3p4/2PP4/1QN2N2/PP2PPPP/R1B1KB1R b KQkq - 3 5",
    "description": "White pressures d5 with the queen from b3.",
    "difficulty": "advanced",
    "category": "indian_defense",
    "main_ideas": [
      "Pressure d5",
      "Quick development",
      "Tactical complications"
    ],
    "famous_games": [
      "Russian Grunfeld school games"
    ]
  },
  {
    "opening_id": "dutch_stonewall",
    "name": "Dutch Stonewall",
    "eco": "A83-A84",
    "moves": [
      "d4",
      "f5",
      "c4",
      "Nf6",
      "g3",
      "e6",
      "Bg2",
      "d5"
    ],
    "fen": "rnbqkb1r/ppp3pp/4pn2/3p1p2/2PP4/6P1/PP2PPBP/RNBQK1NR w KQkq d6 0 5",
    "description": "Solid pawn wall on light squares with e6-d5-f5.",
    "difficulty": "intermediate",
    "category": "closed_game",
    "main_ideas": [
      "Stonewall formation",
      "Kingside attack",
      "e4 square control"
    ],
    "famous_games": [
      "Botvinnik's Stonewall games"
    ]
  },
  {
    "opening_id": "dutch_leningrad",
    "name": "Dutch Leningrad Variation",
    "eco": "A87-A89",
    "moves": [
      "d4",
      "f5",
      "c4",
      "Nf6",
      "g3",
      "g6",
      "Bg2",
      "Bg7"
    ],
    "fen": "rnbqk2r/ppp1p1bp/5np1/5p2/2PP4/6P1/PP2PPBP/RNBQK1NR w KQkq - 2 5",
    "description": "Combining Dutch f5 with King's Indian fianchetto.",
    "difficulty": "advanced",
    "category": "closed_game",
    "main_ideas": [
      "Fianchetto both sides",
      "e5 push",
      "Dynamic piece play"
    ],
    "famous_games": [
      "Nakamura's Leningrad games"
    ]
  },
  {
    "opening_id": "english_symmetrical",
    "name": "English Symmetrical Variation",
    "eco": "A30-A39",
    "moves": [
      "c4",
      "c5"
    ],
    "fen": "rnbqkbnr/pp1ppppp/8/2p5/2P5/8/PP1PPPPP/RNBQKBNR w KQkq c6 0 2",
    "description": "Symmetrical structure after 1.c4 c5.",
    "difficulty": "intermediate",
    "category": "flank",
    "main_ideas": [
      "Symmetrical play",
      "Hedgehog setup",
      "Maroczy Bind"
    ],
    "famous_games": [
      "Karpov's English games"
    ]
  },
  {
    "opening_id": "english_four_knights",
    "name": "English Four Knights",
    "eco": "A28-A29",
    "moves": [
      "c4",
      "e5",
      "Nc3",
      "Nf6",
      "Nf3",
      "Nc6"
    ],
    "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/2P5/2N2N2/PP1PPPPP/R1BQKB1R w KQkq - 4 4",
    "description": "English version of the Four Knights with flank pressure.",
    "difficulty": "intermediate",
    "category": "flank",
    "main_ideas": [
      "Flank approach",
      "d4 preparation",
      "Flexible center"
    ],
    "famous_games": [
      "Botvinnik's English games"
    ]
  },
  {
    "opening_id": "english_reversed_sicilian",
    "name": "English Reversed Sicilian",
    "eco": "A20-A26",
    "moves": [
      "c4",
      "e5"
    ],
    "fen": "rnbqkbnr/pppp1ppp/8/4p3/2P5/8/PP1PPPPP/RNBQKBNR w KQkq e6 0 2",
    "description": "White plays a Sicilian with an extra tempo.",
    "difficulty": "intermediate",
    "category": "flank",
    "main_ideas": [
      "Extra tempo Sicilian",
      "g3 fianchetto",
      "Flexible development"
    ],
    "famous_games": [
      "Fischer's Reversed Sicilian"
    ]
  },
  {
    "opening_id": "reti_kings_indian_attack",
    "name": "Reti / King's Indian Attack",
    "eco": "A05-A06",
    "moves": [
      "Nf3",
      "d5",
      "g3",
      "Nf6",
      "Bg2"
    ],
    "fen": "rnbqkb1r/ppp1pppp/5n2/3p4/8/5NP1/PPPPPPBP/RNBQK2R b KQkq - 2 3",
    "description": "Flexible system that can transpose into many positions.",
    "difficulty": "intermediate",
    "category": "flank",
    "main_ideas": [
      "Flexible system",
      "KIA setup",
      "Transpose options"
    ],
    "famous_games": [
      "Fischer's KIA games"
    ]
  },
  {
    "opening_id": "larsen_opening",
    "name": "Larsen's Opening",
    "eco": "A01",
    "moves": [
      "b3"
    ],
    "fen": "rnbqkbnr/pppppppp/8/8/8/1P6/P1PPPPPP/RNBQKBNR b KQkq - 0 1",
    "description": "Hypermodern first move, fianchettoing the queenside bishop.",
    "difficulty": "intermediate",
    "category": "flank",
    "main_ideas": [
      "Queenside fianchetto",
      "Flexible",
      "Hypermodern approach"
    ],
    "famous_games": [
      "Larsen vs Spassky 1970 (loss in 17 moves!)"
    ]
  },
  {
    "opening_id": "sokolsky_opening",
    "name": "Sokolsky Opening (Polish)",
    "eco": "A00",
    "moves": [
      "b4"
    ],
    "fen": "rnbqkbnr/pppppppp/8/8/1P6/8/P1PPPPPP/RNBQKBNR b KQkq b3 0 1",
    "description": "Unusual first move grabbing queenside space.",
    "difficulty": "beginner",
    "category": "flank",
    "main_ideas": [
      "Queenside space",
      "Surprise value",
      "Unusual positions"
    ],
    "famous_games": [
      "Sokolsky's original games"
    ]
  },
  {
    "opening_id": "grob_attack",
    "name": "Grob's Attack",
    "eco": "A00",
    "moves": [
      "g4"
    ],
    "fen": "rnbqkbnr/pppppppp/8/8/6P1/8/PPPPPP1P/RNBQKBNR b KQkq g3 0 1",
    "description": "Eccentric opening weakening the kingside immediately.",
    "difficulty": "beginner",
    "category": "flank",
    "main_ideas": [
      "Surprise",
      "Unorthodox play",
      "Psychological weapon"
    ],
    "famous_games": [
      "Grob's games and Basman's games"
    ]
  },
  {
    "opening_id": "kings_english",
    "name": "King's English",
    "eco": "A20",
    "moves": [
      "c4",
      "e5",
      "g3"
    ],
    "fen": "rnbqkbnr/pppp1ppp/8/4p3/2P5/6P1/PP1PPP1P/RNBQKBNR b KQkq - 0 2",
    "description": "English with fianchetto setup against e5.",
    "difficulty": "intermediate",
    "category": "flank",
    "main_ideas": [
      "Fianchetto",
      "Control d5",
      "Flexible structure"
    ],
    "famous_games": [
      "Kasparov's English games"
    ]
  },
  {
    "opening_id": "london_with_bf4",
    "name": "London System (Bf4 line)",
    "eco": "D02",
    "moves": [
      "d4",
      "d5",
      "Bf4"
    ],
    "fen": "rnbqkbnr/ppp1pppp/8/3p4/3P1B2/8/PPP1PPPP/RN1QKBNR b KQkq - 1 2",
    "description": "The popular London with early Bf4.",
    "difficulty": "beginner",
    "category": "closed_game",
    "main_ideas": [
      "Solid setup",
      "Avoid theory",
      "Easy to learn"
    ],
    "famous_games": [
      "Kamsky's London games"
    ]
  },
  {
    "opening_id": "jobava_london",
    "name": "Jobava London",
    "eco": "D00",
    "moves": [
      "d4",
      "d5",
      "Bf4",
      "Nf6",
      "Nc3"
    ],
    "fen": "rnbqkb1r/ppp1pppp/5n2/3p4/3P1B2/2N5/PPP1PPPP/R2QKBNR b KQkq - 2 3",
    "description": "Modern aggressive London with Nc3 instead of Nf3.",
    "difficulty": "intermediate",
    "category": "closed_game",
    "main_ideas": [
      "Aggressive London",
      "Nc3 development",
      "e4 push"
    ],
    "famous_games": [
      "Jobava's original games"
    ]
  },
  {
    "opening_id": "veresov_attack",
    "name": "Veresov Attack",
    "eco": "D01",
    "moves": [
      "d4",
      "d5",
      "Nc3",
      "Nf6",
      "Bg5"
    ],
    "fen": "rnbqkb1r/ppp1pppp/5n2/3p2B1/3P4/2N5/PPP1PPPP/R2QKBNR b KQkq - 2 3",
    "description": "Unusual system with Nc3 and Bg5.",
    "difficulty": "intermediate",
    "category": "closed_game",
    "main_ideas": [
      "Pin the knight",
      "f3 and e4 push",
      "Unconventional play"
    ],
    "famous_games": [
      "Veresov's original games"
    ]
  },
  {
    "opening_id": "richter_veresov",
    "name": "Richter-Veresov Attack",
    "eco": "D01",
    "moves": [
      "d4",
      "Nf6",
      "Nc3",
      "d5",
      "Bg5"
    ],
    "fen": "rnbqkb1r/ppp1pppp/5n2/3p2B1/3P4/2N5/PPP1PPPP/R2QKBNR b KQkq - 2 3",
    "description": "Aggressive system pinning Nf6 and preparing f3-e4.",
    "difficulty": "intermediate",
    "category": "closed_game",
    "main_ideas": [
      "Pin knight",
      "Prepare e4",
      "Aggressive middlegame"
    ],
    "famous_games": [
      "Richter and Veresov games"
    ]
  },
  {
    "opening_id": "barry_attack",
    "name": "Barry Attack",
    "eco": "D00",
    "moves": [
      "d4",
      "Nf6",
      "Nf3",
      "g6",
      "Nc3",
      "d5",
      "Bf4"
    ],
    "fen": "rnbqkb1r/ppp1pp1p/5np1/3p4/3P1B2/2N2N2/PPP1PPPP/R2QKB1R b KQkq - 2 4",
    "description": "Anti-King's Indian system with Bf4.",
    "difficulty": "intermediate",
    "category": "closed_game",
    "main_ideas": [
      "Anti-KID setup",
      "e3 and Bd3",
      "Queenside play"
    ],
    "famous_games": [
      "Mark Hebden's Barry Attack games"
    ]
  },
  {
    "opening_id": "zukertort_opening",
    "name": "Zukertort Opening",
    "eco": "A04",
    "moves": [
      "Nf3",
      "c5"
    ],
    "fen": "rnbqkbnr/pp1ppppp/8/2p5/8/5N2/PPPPPPPP/RNBQKB1R w KQkq c6 0 2",
    "description": "Flexible Nf3 followed by various setups.",
    "difficulty": "intermediate",
    "category": "flank",
    "main_ideas": [
      "Flexible system",
      "Transpose possibilities",
      "Control center later"
    ],
    "famous_games": [
      "Zukertort's tournament games"
    ]
  },
  {
    "opening_id": "catalonian",
    "name": "Catalan (Closed)",
    "eco": "E06-E09",
    "moves": [
      "d4",
      "Nf6",
      "c4",
      "e6",
      "g3",
      "d5",
      "Bg2",
      "Be7"
    ],
    "fen": "rnbqk2r/ppp1bppp/4pn2/3p4/2PP4/6P1/PP2PPBP/RNBQK1NR w KQkq - 2 5",
    "description": "Closed Catalan with fianchettoed bishop pressuring the center.",
    "difficulty": "advanced",
    "category": "closed_game",
    "main_ideas": [
      "Long diagonal pressure",
      "Positional squeeze",
      "Endgame edge"
    ],
    "famous_games": [
      "Kramnik's Catalan games"
    ]
  },
  {
    "opening_id": "catalan_open",
    "name": "Catalan (Open)",
    "eco": "E01-E05",
    "moves": [
      "d4",
      "Nf6",
      "c4",
      "e6",
      "g3",
      "d5",
      "Bg2",
      "dxc4"
    ],
    "fen": "rnbqkb1r/ppp2ppp/4pn2/8/2pP4/6P1/PP2PPBP/RNBQK1NR w KQkq - 0 5",
    "description": "Black accepts the gambit pawn in the Catalan.",
    "difficulty": "advanced",
    "category": "closed_game",
    "main_ideas": [
      "Gambit pawn",
      "Bg2 pressure",
      "Long-term compensation"
    ],
    "famous_games": [
      "Giri's Open Catalan games"
    ]
  },
  {
    "opening_id": "benoni_modern",
    "name": "Modern Benoni",
    "eco": "A60-A79",
    "moves": [
      "d4",
      "Nf6",
      "c4",
      "c5",
      "d5",
      "e6",
      "Nc3",
      "exd5",
      "cxd5",
      "d6"
    ],
    "fen": "rnbqkb1r/pp3ppp/3p1n2/2pP4/8/2N5/PP2PPPP/R1BQKBNR w KQkq - 0 6",
    "description": "Dynamic defense with asymmetrical pawn structure.",
    "difficulty": "advanced",
    "category": "indian_defense",
    "main_ideas": [
      "Queenside counterplay",
      "b5 break",
      "Dynamic piece play"
    ],
    "famous_games": [
      "Tal's Benoni brilliancies"
    ]
  },
  {
    "opening_id": "czech_benoni",
    "name": "Czech Benoni",
    "eco": "A56",
    "moves": [
      "d4",
      "Nf6",
      "c4",
      "c5",
      "d5",
      "e5"
    ],
    "fen": "rnbqkb1r/pp1p1ppp/5n2/2pPp3/2P5/8/PP2PPPP/RNBQKBNR w KQkq e6 0 4",
    "description": "Closed Benoni structure with e5, a blocked center.",
    "difficulty": "intermediate",
    "category": "indian_defense",
    "main_ideas": [
      "Closed center",
      "f5 break",
      "Maneuvering game"
    ],
    "famous_games": [
      "Czech GM games"
    ]
  },
  {
    "opening_id": "leningrad_dutch",
    "name": "Leningrad Dutch System",
    "eco": "A87",
    "moves": [
      "d4",
      "f5",
      "g3",
      "Nf6",
      "Bg2",
      "g6",
      "Nf3",
      "Bg7",
      "O-O",
      "O-O"
    ],
    "fen": "rnbq1rk1/ppp1p1bp/5np1/5p2/3P4/5NP1/PPP1PPBP/RNBQ1RK1 w - - 4 6",
    "description": "Double fianchetto with f5 kingside ambitions.",
    "difficulty": "advanced",
    "category": "closed_game",
    "main_ideas": [
      "Kingside attack",
      "e5 push",
      "Dynamic play"
    ],
    "famous_games": [
      "Malaniuk's Leningrad Dutch"
    ]
  },
  {
    "opening_id": "classical_dutch",
    "name": "Classical Dutch",
    "eco": "A82-A84",
    "moves": [
      "d4",
      "f5",
      "c4",
      "e6",
      "Nc3",
      "Nf6",
      "g3",
      "Be7"
    ],
    "fen": "rnbqk2r/ppp1b1pp/4pn2/5p2/2PP4/2N3P1/PP2PP1P/R1BQKBNR w KQkq - 1 5",
    "description": "Classical development in the Dutch Defense.",
    "difficulty": "intermediate",
    "category": "closed_game",
    "main_ideas": [
      "Solid setup",
      "Kingside expansion",
      "Ne4 maneuver"
    ],
    "famous_games": [
      "Botvinnik's Dutch games"
    ]
  },
  {
    "opening_id": "nimzo_larsen",
    "name": "Nimzo-Larsen Attack",
    "eco": "A01",
    "moves": [
      "b3",
      "e5"
    ],
    "fen": "rnbqkbnr/pppp1ppp/8/4p3/8/1P6/P1PPPPPP/RNBQKBNR w KQkq e6 0 2",
    "description": "Queenside fianchetto with hypermodern ideas.",
    "difficulty": "intermediate",
    "category": "flank",
    "main_ideas": [
      "Bb2 fianchetto",
      "Control e5/d4",
      "Flexible structure"
    ],
    "famous_games": [
      "Larsen and Nimzowitsch games"
    ]
  },
  {
    "opening_id": "hedgehog",
    "name": "Hedgehog System",
    "eco": "A30",
    "moves": [
      "c4",
      "c5",
      "Nf3",
      "Nf6",
      "g3",
      "b6",
      "Bg2",
      "Bb7"
    ],
    "fen": "rn1qkb1r/pb1ppppp/1p3n2/2p5/2P5/5NP1/PP1PPPBP/RNBQK2R w KQkq - 2 5",
    "description": "Compact pawn structure allowing flexible piece play.",
    "difficulty": "advanced",
    "category": "flank",
    "main_ideas": [
      "Compact structure",
      "b5 or d5 breaks",
      "Patient maneuvering"
    ],
    "famous_games": [
      "Andersson's Hedgehog games"
    ]
  },
  {
    "opening_id": "torre_london",
    "name": "Torre Attack (Bg5 System)",
    "eco": "A46",
    "moves": [
      "d4",
      "Nf6",
      "Nf3",
      "e6",
      "Bg5"
    ],
    "fen": "rnbqkb1r/pppp1ppp/4pn2/6B1/3P4/5N2/PPP1PPPP/RN1QKB1R b KQkq - 2 3",
    "description": "Systematic development with Bg5 pin.",
    "difficulty": "beginner",
    "category": "closed_game",
    "main_ideas": [
      "Pin the knight",
      "e3-Bd3 setup",
      "Solid position"
    ],
    "famous_games": [
      "Torre's original games"
    ]
  },
  {
    "opening_id": "tromp_attack",
    "name": "Trompowsky Attack (Bg5)",
    "eco": "A45",
    "moves": [
      "d4",
      "Nf6",
      "Bg5"
    ],
    "fen": "rnbqkb1r/pppppppp/5n2/6B1/3P4/8/PPP1PPPP/RN1QKBNR b KQkq - 2 2",
    "description": "Early Bg5 pinning the knight, avoiding main-line theory.",
    "difficulty": "intermediate",
    "category": "closed_game",
    "main_ideas": [
      "Pin the knight early",
      "Avoid theory",
      "Unbalanced play"
    ],
    "famous_games": [
      "Adams and Hodgson's Tromp games"
    ]
  },
  {
    "opening_id": "wade_defense",
    "name": "Wade Defense",
    "eco": "A41",
    "moves": [
      "d4",
      "d6",
      "Nf3",
      "Bg4"
    ],
    "fen": "rn1qkbnr/ppp1pppp/3p4/8/3P2b1/5N2/PPP1PPPP/RNBQKB1R w KQkq - 2 3",
    "description": "Early Bg4 pin against Nf3.",
    "difficulty": "beginner",
    "category": "closed_game",
    "main_ideas": [
      "Pin the knight",
      "Flexible structure",
      "Surprise weapon"
    ],
    "famous_games": [
      "Wade's original games"
    ]
  },
  {
    "opening_id": "old_benoni",
    "name": "Old Benoni Defense",
    "eco": "A43",
    "moves": [
      "d4",
      "c5"
    ],
    "fen": "rnbqkbnr/pp1ppppp/8/2p5/3P4/8/PPP1PPPP/RNBQKBNR w KQkq c6 0 2",
    "description": "Simple counter to d4 with c5.",
    "difficulty": "beginner",
    "category": "closed_game",
    "main_ideas": [
      "Challenge d4",
      "Benoni structures",
      "Asymmetry"
    ],
    "famous_games": [
      "Classical Benoni games"
    ]
  },
  {
    "opening_id": "english_defense",
    "name": "English Defense",
    "eco": "A40",
    "moves": [
      "d4",
      "e6",
      "c4",
      "b6"
    ],
    "fen": "rnbqkbnr/p1pp1ppp/1p2p3/8/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3",
    "description": "Fianchetto bishop to challenge White's center.",
    "difficulty": "intermediate",
    "category": "closed_game",
    "main_ideas": [
      "Bb7 pressure",
      "Flexible pawn structure",
      "Counter central play"
    ],
    "famous_games": [
      "Miles and Speelman's games"
    ]
  },
  {
    "opening_id": "modern_benoni_taimanov",
    "name": "Modern Benoni Taimanov Variation",
    "eco": "A67",
    "moves": [
      "d4",
      "Nf6",
      "c4",
      "c5",
      "d5",
      "e6",
      "Nc3",
      "exd5",
      "cxd5",
      "d6",
      "e4",
      "g6",
      "f4"
    ],
    "fen": "rnbqkb1r/pp3p1p/3p1np1/2pP4/4PP2/2N5/PP4PP/R1BQKBNR b KQkq f3 0 7",
    "description": "Aggressive f4 system against the Modern Benoni.",
    "difficulty": "advanced",
    "category": "indian_defense",
    "main_ideas": [
      "f4-e5 push",
      "Kingside attack",
      "Space advantage"
    ],
    "famous_games": [
      "Taimanov's original games"
    ]
  },
  {
    "opening_id": "blumenfeld_gambit",
    "name": "Blumenfeld Gambit",
    "eco": "E10",
    "moves": [
      "d4",
      "Nf6",
      "c4",
      "e6",
      "Nf3",
      "c5",
      "d5",
      "b5"
    ],
    "fen": "rnbqkb1r/p2p1ppp/4pn2/1ppP4/2P5/5N2/PP2PPPP/RNBQKB1R w KQkq b6 0 5",
    "description": "Bold gambit sacrificing b5 for central control.",
    "difficulty": "intermediate",
    "category": "gambit",
    "main_ideas": [
      "Sacrifice b5",
      "Central control",
      "Active piece play"
    ],
    "famous_games": [
      "Blumenfeld's original analysis"
    ]
  },
  {
    "opening_id": "volga_gambit",
    "name": "Volga (Benko) Gambit Accepted",
    "eco": "A57-A59",
    "moves": [
      "d4",
      "Nf6",
      "c4",
      "c5",
      "d5",
      "b5",
      "cxb5",
      "a6"
    ],
    "fen": "rnbqkb1r/3ppppp/p4n2/1PpP4/8/8/PP2PPPP/RNBQKBNR w KQkq - 0 5",
    "description": "Black sacrifices a pawn for lasting queenside pressure.",
    "difficulty": "intermediate",
    "category": "gambit",
    "main_ideas": [
      "Queenside pressure",
      "a and b file play",
      "Long-term compensation"
    ],
    "famous_games": [
      "Benko's original games"
    ]
  },
  {
    "opening_id": "budapest_defense",
    "name": "Budapest Defense (Fajarowicz)",
    "eco": "A51-A52",
    "moves": [
      "d4",
      "Nf6",
      "c4",
      "e5",
      "dxe5",
      "Ne4"
    ],
    "fen": "rnbqkb1r/pppp1ppp/8/4P3/2P1n3/8/PP2PPPP/RNBQKBNR w KQkq - 1 4",
    "description": "Fajarowicz variation with Ne4 instead of Ng4.",
    "difficulty": "intermediate",
    "category": "gambit",
    "main_ideas": [
      "Unexpected Ne4",
      "Tactical traps",
      "Surprise weapon"
    ],
    "famous_games": [
      "Fajarowicz's original analysis"
    ]
  },
  {
    "opening_id": "polish_defense",
    "name": "Polish Defense",
    "eco": "A40",
    "moves": [
      "d4",
      "b5"
    ],
    "fen": "rnbqkbnr/p1pppppp/8/1p6/3P4/8/PPP1PPPP/RNBQKBNR w KQkq b6 0 2",
    "description": "Rare defense grabbing queenside space immediately.",
    "difficulty": "beginner",
    "category": "closed_game",
    "main_ideas": [
      "Queenside expansion",
      "Surprise value",
      "Unusual play"
    ],
    "famous_games": [
      "Rare but fun encounters"
    ]
  },
  {
    "opening_id": "st_george_defense",
    "name": "St. George Defense",
    "eco": "B00",
    "moves": [
      "e4",
      "a6"
    ],
    "fen": "rnbqkbnr/1ppppppp/p7/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
    "description": "Flexible and unusual defense preparing b5.",
    "difficulty": "beginner",
    "category": "semi_open",
    "main_ideas": [
      "Prepare b5",
      "Flexible",
      "Avoid theory entirely"
    ],
    "famous_games": [
      "Miles vs Karpov 1980 (famously won with this!)"
    ]
  },
  {
    "opening_id": "hippopotamus",
    "name": "Hippopotamus Defense",
    "eco": "B00",
    "moves": [
      "e4",
      "g6",
      "d4",
      "Bg7",
      "Nc3",
      "d6",
      "Nf3",
      "a6"
    ],
    "fen": "rnbqk1nr/1pp1ppbp/p2p2p1/8/3PP3/2N2N2/PPP2PPP/R1BQKB1R w KQkq - 0 5",
    "description": "Ultra-flexible setup with pawns on 6th rank, pieces behind.",
    "difficulty": "intermediate",
    "category": "semi_open",
    "main_ideas": [
      "Ultra-flexible",
      "All pieces behind pawns",
      "Counter-punch later"
    ],
    "famous_games": [
      "Various surprise encounters"
    ]
  },
  {
    "opening_id": "rat_defense",
    "name": "Rat Defense (Modern)",
    "eco": "B06",
    "moves": [
      "e4",
      "d6",
      "d4",
      "Nf6",
      "Nc3",
      "g6"
    ],
    "fen": "rnbqkb1r/ppp1pp1p/3p1np1/8/3PP3/2N5/PPP2PPP/R1BQKBNR w KQkq - 0 4",
    "description": "Flexible defense combining Pirc and Modern ideas.",
    "difficulty": "intermediate",
    "category": "semi_open",
    "main_ideas": [
      "Flexible development",
      "Counter-attack center",
      "King Indian-like"
    ],
    "famous_games": [
      "Various Pirc/Modern games"
    ]
  },
  {
    "opening_id": "robatsch_defense",
    "name": "Robatsch (Modern) Defense",
    "eco": "B06",
    "moves": [
      "e4",
      "g6",
      "d4",
      "Bg7"
    ],
    "fen": "rnbqk1nr/ppppppbp/6p1/8/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 1 3",
    "description": "Hypermodern defense letting White build a center to attack later.",
    "difficulty": "intermediate",
    "category": "semi_open",
    "main_ideas": [
      "Hypermodern approach",
      "Attack center later",
      "Flexible structure"
    ],
    "famous_games": [
      "Robatsch's games"
    ]
  },
  {
    "opening_id": "goring_gambit",
    "name": "Goring Gambit",
    "eco": "C44",
    "moves": [
      "e4",
      "e5",
      "Nf3",
      "Nc6",
      "d4",
      "exd4",
      "c3"
    ],
    "fen": "r1bqkbnr/pppp1ppp/2n5/8/3pP3/2P2N2/PP3PPP/RNBQKB1R b KQkq - 0 4",
    "description": "Gambit related to the Scotch with c3 push.",
    "difficulty": "intermediate",
    "category": "gambit",
    "main_ideas": [
      "Sacrifice for center",
      "Rapid development",
      "Open lines"
    ],
    "famous_games": [
      "Goring's original games"
    ]
  },
  {
    "opening_id": "elephant_gambit",
    "name": "Elephant Gambit",
    "eco": "C40",
    "moves": [
      "e4",
      "e5",
      "Nf3",
      "d5"
    ],
    "fen": "rnbqkbnr/ppp2ppp/8/3pp3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq d6 0 3",
    "description": "Rare counter-gambit by Black, aggressive but risky.",
    "difficulty": "beginner",
    "category": "gambit",
    "main_ideas": [
      "Counter-gambit",
      "Surprise value",
      "Aggressive intent"
    ],
    "famous_games": [
      "Rare online encounters"
    ]
  },
  {
    "opening_id": "stafford_gambit",
    "name": "Stafford Gambit",
    "eco": "C42",
    "moves": [
      "e4",
      "e5",
      "Nf3",
      "Nf6",
      "Nxe5",
      "Nc6"
    ],
    "fen": "r1bqkb1r/pppp1ppp/2n2n2/4N3/4P3/8/PPPP1PPP/RNBQKB1R w KQkq - 3 4",
    "description": "Trappy gambit popular in online blitz.",
    "difficulty": "beginner",
    "category": "gambit",
    "main_ideas": [
      "Traps galore",
      "Piece activity",
      "Online weapon"
    ],
    "famous_games": [
      "Eric Rosen's popularization"
    ]
  },
  {
    "opening_id": "marshall_attack",
    "name": "Marshall Attack (Ruy Lopez)",
    "eco": "C89",
    "moves": [
      "e4",
      "e5",
      "Nf3",
      "Nc6",
      "Bb5",
      "a6",
      "Ba4",
      "Nf6",
      "O-O",
      "Be7",
      "Re1",
      "b5",
      "Bb3",
      "O-O",
      "c3",
      "d5"
    ],
    "fen": "r1bq1rk1/2p1bppp/p1n2n2/1p1pp3/4P3/1BP2N2/PP1P1PPP/RNBQR1K1 w - d6 0 9",
    "description": "Famous pawn sacrifice for attacking chances in the Ruy Lopez.",
    "difficulty": "advanced",
    "category": "open_game",
    "main_ideas": [
      "Pawn sacrifice for attack",
      "Kingside pressure",
      "Long-term initiative"
    ],
    "famous_games": [
      "Marshall vs Capablanca 1918"
    ]
  },
  {
    "opening_id": "berlin_defense",
    "name": "Berlin Defense (Ruy Lopez)",
    "eco": "C65-C67",
    "moves": [
      "e4",
      "e5",
      "Nf3",
      "Nc6",
      "Bb5",
      "Nf6"
    ],
    "fen": "r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    "description": "The Berlin Wall - ultra-solid defense popularized by Kramnik.",
    "difficulty": "advanced",
    "category": "open_game",
    "main_ideas": [
      "Solid endgame",
      "Berlin Wall structure",
      "Drawing weapon"
    ],
    "famous_games": [
      "Kramnik vs Kasparov WC 2000"
    ]
  },
  {
    "opening_id": "petroff_classical",
    "name": "Petrov Classical Attack",
    "eco": "C42",
    "moves": [
      "e4",
      "e5",
      "Nf3",
      "Nf6",
      "Nxe5",
      "d6",
      "Nf3",
      "Nxe4",
      "d4"
    ],
    "fen": "rnbqkb1r/ppp2ppp/3p4/8/3Pn3/5N2/PPP2PPP/RNBQKB1R b KQkq d3 0 5",
    "description": "Main line Petrov's Defense with classical center.",
    "difficulty": "intermediate",
    "category": "open_game",
    "main_ideas": [
      "Symmetrical structure",
      "Solid play",
      "Endgame focus"
    ],
    "famous_games": [
      "Caruana's Petrov games"
    ]
  },
  {
    "opening_id": "sicilian_moscow",
    "name": "Sicilian Moscow Variation",
    "eco": "B51-B52",
    "moves": [
      "e4",
      "c5",
      "Nf3",
      "d6",
      "Bb5+"
    ],
    "fen": "rnbqkbnr/pp2pppp/3p4/1Bp5/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 1 3",
    "description": "Anti-Sicilian check with Bb5+.",
    "difficulty": "intermediate",
    "category": "semi_open",
    "main_ideas": [
      "Disrupt development",
      "Anti-Sicilian",
      "Simple positions"
    ],
    "famous_games": [
      "Various anti-Sicilian games"
    ]
  },
  {
    "opening_id": "sicilian_o_kelly",
    "name": "Sicilian O'Kelly Variation",
    "eco": "B28",
    "moves": [
      "e4",
      "c5",
      "Nf3",
      "a6"
    ],
    "fen": "rnbqkbnr/1p1ppppp/p7/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3",
    "description": "Early a6 preventing Bb5 ideas.",
    "difficulty": "intermediate",
    "category": "semi_open",
    "main_ideas": [
      "Prevent Bb5",
      "Flexible setup",
      "Queenside play"
    ],
    "famous_games": [
      "O'Kelly's original games"
    ]
  },
  {
    "opening_id": "sicilian_kalashnikov",
    "name": "Sicilian Kalashnikov",
    "eco": "B32",
    "moves": [
      "e4",
      "c5",
      "Nf3",
      "Nc6",
      "d4",
      "cxd4",
      "Nxd4",
      "e5",
      "Nb5",
      "d6"
    ],
    "fen": "r1bqkbnr/pp3ppp/2np4/1N2p3/4P3/8/PPP2PPP/RNBQKB1R w KQkq - 0 6",
    "description": "Related to Sveshnikov but with d6 instead of a6.",
    "difficulty": "advanced",
    "category": "semi_open",
    "main_ideas": [
      "e5 push",
      "Accept structural weakness",
      "Active play"
    ],
    "famous_games": [
      "Kalashnikov's games"
    ]
  },
  {
    "opening_id": "pirc_austrian",
    "name": "Pirc Austrian Attack",
    "eco": "B09",
    "moves": [
      "e4",
      "d6",
      "d4",
      "Nf6",
      "Nc3",
      "g6",
      "f4"
    ],
    "fen": "rnbqkb1r/ppp1pp1p/3p1np1/8/3PPP2/2N5/PPP3PP/R1BQKBNR b KQkq f3 0 4",
    "description": "Aggressive setup with f4 in the Pirc Defense.",
    "difficulty": "intermediate",
    "category": "semi_open",
    "main_ideas": [
      "Aggressive center",
      "f5 push",
      "Kingside attack"
    ],
    "famous_games": [
      "Fischer's Pirc games"
    ]
  },
  {
    "opening_id": "pirc_classical",
    "name": "Pirc Classical System",
    "eco": "B08",
    "moves": [
      "e4",
      "d6",
      "d4",
      "Nf6",
      "Nc3",
      "g6",
      "Nf3",
      "Bg7",
      "Be2"
    ],
    "fen": "rnbqk2r/ppp1ppbp/3p1np1/8/3PP3/2N2N2/PPP1BPPP/R1BQK2R b KQkq - 3 5",
    "description": "Classical development against the Pirc.",
    "difficulty": "intermediate",
    "category": "semi_open",
    "main_ideas": [
      "Solid development",
      "Prepare O-O",
      "Central dominance"
    ],
    "famous_games": [
      "Classical Pirc encounters"
    ]
  },
  {
    "opening_id": "alekhine_four_pawns",
    "name": "Alekhine Four Pawns Attack",
    "eco": "B03",
    "moves": [
      "e4",
      "Nf6",
      "e5",
      "Nd5",
      "d4",
      "d6",
      "c4",
      "Nb6",
      "f4"
    ],
    "fen": "rnbqkb1r/ppp1pppp/1n1p4/4P3/2PP1P2/8/PP4PP/RNBQKBNR b KQkq f3 0 5",
    "description": "Aggressive four pawns setup against Alekhine's Defense.",
    "difficulty": "advanced",
    "category": "semi_open",
    "main_ideas": [
      "Four pawn center",
      "Space advantage",
      "Aggressive play"
    ],
    "famous_games": [
      "Fischer's four pawns Alekhine"
    ]
  },
  {
    "opening_id": "alekhine_exchange",
    "name": "Alekhine Exchange Variation",
    "eco": "B03",
    "moves": [
      "e4",
      "Nf6",
      "e5",
      "Nd5",
      "d4",
      "d6",
      "c4",
      "Nb6",
      "exd6"
    ],
    "fen": "rnbqkb1r/ppp1pppp/1n1P4/8/2PP4/8/PP3PPP/RNBQKBNR b KQkq - 0 5",
    "description": "White exchanges the e5 pawn for a strong center.",
    "difficulty": "intermediate",
    "category": "semi_open",
    "main_ideas": [
      "Strong center",
      "Development lead",
      "Simple positions"
    ],
    "famous_games": [
      "Exchange Alekhine games"
    ]
  },
  {
    "opening_id": "scandinavian_modern",
    "name": "Scandinavian Modern (Qd6)",
    "eco": "B01",
    "moves": [
      "e4",
      "d5",
      "exd5",
      "Qxd5",
      "Nc3",
      "Qd6"
    ],
    "fen": "rnb1kbnr/ppp1pppp/3q4/8/8/2N5/PPPP1PPP/R1BQKBNR w KQkq - 2 4",
    "description": "Modern Scandinavian keeping the queen on d6.",
    "difficulty": "intermediate",
    "category": "semi_open",
    "main_ideas": [
      "Queen stays active",
      "Bf5 development",
      "Solid structure"
    ],
    "famous_games": [
      "Tiviakov's Scandinavian games"
    ]
  },
  {
    "opening_id": "scotch_gambit",
    "name": "Scotch Gambit",
    "eco": "C44",
    "moves": [
      "e4",
      "e5",
      "Nf3",
      "Nc6",
      "d4",
      "exd4",
      "Bc4"
    ],
    "fen": "r1bqkbnr/pppp1ppp/2n5/8/2BpP3/5N2/PPP2PPP/RNBQK2R b KQkq - 1 4",
    "description": "Gambit line of the Scotch Game with Bc4.",
    "difficulty": "intermediate",
    "category": "gambit",
    "main_ideas": [
      "Development over pawn",
      "Target f7",
      "Active play"
    ],
    "famous_games": [
      "Romantic era Scotch games"
    ]
  },
  {
    "opening_id": "london_barry",
    "name": "London-Barry Hybrid",
    "eco": "D02",
    "moves": [
      "d4",
      "Nf6",
      "Nf3",
      "d5",
      "Bf4",
      "e6",
      "e3",
      "Bd6"
    ],
    "fen": "rnbqk2r/ppp2ppp/3bpn2/3p4/3P1B2/4PN2/PPP2PPP/RN1QKB1R w KQkq - 2 5",
    "description": "Hybrid setup combining London and Barry ideas.",
    "difficulty": "beginner",
    "category": "closed_game",
    "main_ideas": [
      "Solid development",
      "Bg3 retreat",
      "Kingside play"
    ],
    "famous_games": [
      "Modern London players"
    ]
  },
  {
    "opening_id": "breyer_ruy_lopez",
    "name": "Ruy Lopez Breyer Variation",
    "eco": "C94-C95",
    "moves": [
      "e4",
      "e5",
      "Nf3",
      "Nc6",
      "Bb5",
      "a6",
      "Ba4",
      "Nf6",
      "O-O",
      "Be7",
      "Re1",
      "b5",
      "Bb3",
      "d6",
      "c3",
      "O-O",
      "h3",
      "Nb8"
    ],
    "fen": "rnbq1rk1/2p1bppp/p2p1n2/1p2p3/4P3/1BP2N1P/PP1P1PP1/RNBQR1K1 w - - 1 10",
    "description": "Deep strategic retreat Nb8 to reroute the knight.",
    "difficulty": "advanced",
    "category": "open_game",
    "main_ideas": [
      "Knight reroute via Nbd7",
      "Long-term strategy",
      "Complex middlegame"
    ],
    "famous_games": [
      "Karpov's Breyer games"
    ]
  },
  {
    "opening_id": "exchange_slav",
    "name": "Slav Exchange Variation",
    "eco": "D13-D14",
    "moves": [
      "d4",
      "d5",
      "c4",
      "c6",
      "cxd5",
      "cxd5"
    ],
    "fen": "rnbqkbnr/pp2pppp/8/3p4/3P4/8/PP2PPPP/RNBQKBNR w KQkq - 0 4",
    "description": "Symmetrical Slav exchange, often leading to quiet play.",
    "difficulty": "beginner",
    "category": "closed_game",
    "main_ideas": [
      "Symmetrical structure",
      "Minority attack",
      "Simple play"
    ],
    "famous_games": [
      "Exchange Slav endgames"
    ]
  },
  {
    "opening_id": "chebanenko_slav",
    "name": "Slav Chebanenko Variation",
    "eco": "D15",
    "moves": [
      "d4",
      "d5",
      "c4",
      "c6",
      "Nf3",
      "Nf6",
      "Nc3",
      "a6"
    ],
    "fen": "rnbqkb1r/1p2pppp/p1p2n2/3p4/2PP4/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 0 5",
    "description": "Modern Slav with a6 preparing b5 expansion.",
    "difficulty": "intermediate",
    "category": "closed_game",
    "main_ideas": [
      "Prepare b5",
      "Queenside expansion",
      "Modern approach"
    ],
    "famous_games": [
      "Chebanenko's original games"
    ]
  },
  {
    "opening_id": "anti_berlin",
    "name": "Anti-Berlin (Ruy Lopez d3)",
    "eco": "C65",
    "moves": [
      "e4",
      "e5",
      "Nf3",
      "Nc6",
      "Bb5",
      "Nf6",
      "d3"
    ],
    "fen": "r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/3P1N2/PPP2PPP/RNBQK2R b KQkq - 0 4",
    "description": "White avoids the Berlin endgame with quiet d3.",
    "difficulty": "intermediate",
    "category": "open_game",
    "main_ideas": [
      "Avoid Berlin endgame",
      "Slow buildup",
      "Italian-like play"
    ],
    "famous_games": [
      "Modern anti-Berlin games"
    ]
  },
  {
    "opening_id": "symmetrical_english_botvinnik",
    "name": "English Botvinnik System",
    "eco": "A36-A37",
    "moves": [
      "c4",
      "c5",
      "Nc3",
      "Nc6",
      "g3",
      "g6",
      "Bg2",
      "Bg7",
      "e4"
    ],
    "fen": "r1bqk1nr/pp1pppbp/2n3p1/2p5/2P1P3/2N3P1/PP1P1PBP/R1BQK1NR b KQkq - 0 5",
    "description": "Botvinnik system in the Symmetrical English.",
    "difficulty": "advanced",
    "category": "flank",
    "main_ideas": [
      "Big center with e4",
      "Bg2 pressure",
      "Strategic complexity"
    ],
    "famous_games": [
      "Botvinnik's English system"
    ]
  },
  {
    "opening_id": "dutch_anti_systems",
    "name": "Anti-Dutch (Bg5)",
    "eco": "A80",
    "moves": [
      "d4",
      "f5",
      "Bg5"
    ],
    "fen": "rnbqkbnr/ppppp1pp/8/5pB1/3P4/8/PPP1PPPP/RN1QKBNR b KQkq - 1 2",
    "description": "Aggressive anti-Dutch with early Bg5.",
    "difficulty": "intermediate",
    "category": "closed_game",
    "main_ideas": [
      "Disrupt Black's plan",
      "e4 ideas",
      "Surprise value"
    ],
    "famous_games": [
      "Anti-Dutch surprise games"
    ]
  },
  {
    "opening_id": "staunton_gambit",
    "name": "Staunton Gambit",
    "eco": "A82-A83",
    "moves": [
      "d4",
      "f5",
      "e4"
    ],
    "fen": "rnbqkbnr/ppppp1pp/8/5p2/3PP3/8/PPP2PPP/RNBQKBNR b KQkq e3 0 2",
    "description": "Aggressive gambit against the Dutch Defense.",
    "difficulty": "intermediate",
    "category": "gambit",
    "main_ideas": [
      "Challenge f5",
      "Open center",
      "Active play"
    ],
    "famous_games": [
      "Staunton's original analysis"
    ]
  },
  {
    "opening_id": "from_gambit",
    "name": "From's Gambit",
    "eco": "A02",
    "moves": [
      "f4",
      "e5"
    ],
    "fen": "rnbqkbnr/pppp1ppp/8/4p3/5P2/8/PPPPP1PP/RNBQKBNR w KQkq e6 0 2",
    "description": "Counter-gambit against Bird's Opening.",
    "difficulty": "intermediate",
    "category": "gambit",
    "main_ideas": [
      "Counter the Bird",
      "Open f-file",
      "Tactical play"
    ],
    "famous_games": [
      "From's original analysis"
    ]
  },
  {
    "opening_id": "blackburne_shilling",
    "name": "Blackburne Shilling Gambit",
    "eco": "C50",
    "moves": [
      "e4",
      "e5",
      "Nf3",
      "Nc6",
      "Bc4",
      "Nd4"
    ],
    "fen": "r1bqkbnr/pppp1ppp/8/4p3/2BnP3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    "description": "Trappy gambit with Nd4, popular at club level.",
    "difficulty": "beginner",
    "category": "gambit",
    "main_ideas": [
      "Trap Nxe5",
      "Qg5 fork",
      "Club-level surprise"
    ],
    "famous_games": [
      "Blackburne's games"
    ]
  },
  {
    "opening_id": "englund_gambit",
    "name": "Englund Gambit",
    "eco": "A40",
    "moves": [
      "d4",
      "e5"
    ],
    "fen": "rnbqkbnr/pppp1ppp/8/4p3/3P4/8/PPP1PPPP/RNBQKBNR w KQkq e6 0 2",
    "description": "Dubious but trappy gambit against 1.d4.",
    "difficulty": "beginner",
    "category": "gambit",
    "main_ideas": [
      "Trap dxe5 Qh4",
      "Surprise weapon",
      "Online fun"
    ],
    "famous_games": [
      "Online blitz traps"
    ]
  },
  {
    "opening_id": "dutch_ilyin_zhenevsky",
    "name": "Dutch Ilyin-Zhenevsky System",
    "eco": "A96-A99",
    "moves": [
      "d4",
      "f5",
      "c4",
      "Nf6",
      "g3",
      "e6",
      "Bg2",
      "Be7",
      "Nf3",
      "O-O",
      "O-O",
      "d6"
    ],
    "fen": "rnbq1rk1/ppp1b1pp/3ppn2/5p2/2PP4/5NP1/PP2PPBP/RNBQ1RK1 w - - 0 7",
    "description": "Classical Dutch setup with Be7 and O-O.",
    "difficulty": "intermediate",
    "category": "closed_game",
    "main_ideas": [
      "Kingside play",
      "e5 break",
      "Central maneuvering"
    ],
    "famous_games": [
      "Ilyin-Zhenevsky's games"
    ]
  },
  {
    "opening_id": "king_hunt_gambit",
    "name": "King's Gambit Accepted",
    "eco": "C33-C39",
    "moves": [
      "e4",
      "e5",
      "f4",
      "exf4"
    ],
    "fen": "rnbqkbnr/pppp1ppp/8/8/4Pp2/8/PPPP2PP/RNBQKBNR w KQkq - 0 3",
    "description": "The classic King's Gambit Accepted - full romantic chess.",
    "difficulty": "intermediate",
    "category": "gambit",
    "main_ideas": [
      "Open f-file",
      "Fast development",
      "Romantic attacking chess"
    ],
    "famous_games": [
      "Immortal Game - Anderssen vs Kieseritzky 1851"
    ]
  },
  {
    "opening_id": "king_gambit_declined",
    "name": "King's Gambit Declined",
    "eco": "C30-C32",
    "moves": [
      "e4",
      "e5",
      "f4",
      "Bc5"
    ],
    "fen": "rnbqk1nr/pppp1ppp/8/2b1p3/4PP2/8/PPPP2PP/RNBQKBNR w KQkq - 1 3",
    "description": "Black declines the gambit, keeping a solid position.",
    "difficulty": "intermediate",
    "category": "open_game",
    "main_ideas": [
      "Decline the gambit",
      "Target f4 weakness",
      "Solid position"
    ],
    "famous_games": [
      "Classical declined games"
    ]
  },
  {
    "opening_id": "vienna_copycat",
    "name": "Vienna Game Copycat Variation",
    "eco": "C26",
    "moves": [
      "e4",
      "e5",
      "Nc3",
      "Nc6"
    ],
    "fen": "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/2N5/PPPP1PPP/R1BQKBNR w KQkq - 2 3",
    "description": "Symmetrical knight development in the Vienna.",
    "difficulty": "beginner",
    "category": "open_game",
    "main_ideas": [
      "Symmetrical play",
      "Flexible center",
      "Multiple plans"
    ],
    "famous_games": [
      "Classical Vienna games"
    ]
  },
  {
    "opening_id": "ruy_lopez_exchange",
    "name": "Ruy Lopez Exchange Variation",
    "eco": "C68-C69",
    "moves": [
      "e4",
      "e5",
      "Nf3",
      "Nc6",
      "Bb5",
      "a6",
      "Bxc6",
      "dxc6"
    ],
    "fen": "r1bqkbnr/1pp1pppp/p1B5/4p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 4",
    "description": "White trades bishop for knight aiming for endgame advantage.",
    "difficulty": "intermediate",
    "category": "open_game",
    "main_ideas": [
      "Endgame play",
      "Better pawn structure",
      "4v3 kingside"
    ],
    "famous_games": [
      "Fischer's Exchange Ruy games"
    ]
  },
  {
    "opening_id": "italian_two_knights",
    "name": "Italian Game Two Knights Defense",
    "eco": "C55-C59",
    "moves": [
      "e4",
      "e5",
      "Nf3",
      "Nc6",
      "Bc4",
      "Nf6"
    ],
    "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    "description": "Active defense with Nf6 counter-attacking e4.",
    "difficulty": "intermediate",
    "category": "open_game",
    "main_ideas": [
      "Counter-attack e4",
      "Active defense",
      "Tactical complications"
    ],
    "famous_games": [
      "Many Morphy-era games"
    ]
  },
  {
    "opening_id": "queens_pawn_game",
    "name": "Queen's Pawn Game",
    "eco": "D00",
    "moves": [
      "d4",
      "d5"
    ],
    "fen": "rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq d6 0 2",
    "description": "The basic Queen's Pawn opening.",
    "difficulty": "beginner",
    "category": "closed_game",
    "main_ideas": [
      "Central control",
      "Multiple systems",
      "Solid play"
    ],
    "famous_games": [
      "Countless classical games"
    ]
  },
  {
    "opening_id": "colle_zukertort",
    "name": "Colle-Zukertort System",
    "eco": "D05",
    "moves": [
      "d4",
      "d5",
      "Nf3",
      "Nf6",
      "e3",
      "e6",
      "Bd3",
      "c5",
      "b3"
    ],
    "fen": "rnbqkb1r/pp3ppp/4pn2/2pp4/3P4/1P1BPN2/P1P2PPP/RNBQK2R b KQkq - 0 5",
    "description": "Systematic queenside fianchetto with the Colle structure.",
    "difficulty": "beginner",
    "category": "closed_game",
    "main_ideas": [
      "Bb2 fianchetto",
      "e4 break",
      "Systematic development"
    ],
    "famous_games": [
      "Colle's tournament games"
    ]
  },
  {
    "opening_id": "tartakower_qgd",
    "name": "QGD Tartakower Variation",
    "eco": "D58-D59",
    "moves": [
      "d4",
      "d5",
      "c4",
      "e6",
      "Nc3",
      "Nf6",
      "Bg5",
      "Be7",
      "e3",
      "O-O",
      "Nf3",
      "h6",
      "Bh4",
      "b6"
    ],
    "fen": "rnbq1rk1/p1p1bpp1/1p2pn1p/3p4/2PP3B/2N1PN2/PP3PPP/R2QKB1R w KQ - 0 8",
    "description": "Classical QGD with b6 fianchetto idea.",
    "difficulty": "advanced",
    "category": "closed_game",
    "main_ideas": [
      "Bb7 development",
      "Flexible structure",
      "Active piece play"
    ],
    "famous_games": [
      "Tartakower's original concept"
    ]
  },
  {
    "opening_id": "dutch_hopton_attack",
    "name": "Dutch Hopton Attack",
    "eco": "A80",
    "moves": [
      "d4",
      "f5",
      "Bg5",
      "h6",
      "Bh4",
      "g5",
      "e3"
    ],
    "fen": "rnbqkbnr/ppp1p2p/7B/5pp1/3P4/4P3/PPP2PPP/RN1QKBNR b KQkq - 0 4",
    "description": "Anti-Dutch system provoking kingside weaknesses.",
    "difficulty": "intermediate",
    "category": "closed_game",
    "main_ideas": [
      "Provoke weaknesses",
      "Exploit g5",
      "Anti-Dutch weapon"
    ],
    "famous_games": [
      "Hopton Attack surprise games"
    ]
  },
  {
    "opening_id": "queens_indian_petrosian",
    "name": "Queen's Indian Petrosian System",
    "eco": "E12",
    "moves": [
      "d4",
      "Nf6",
      "c4",
      "e6",
      "Nf3",
      "b6",
      "a3"
    ],
    "fen": "rnbqkb1r/p1pp1ppp/1p2pn2/8/2PP4/P4N2/1P2PPPP/RNBQKB1R b KQkq - 0 4",
    "description": "Petrosian's a3 system preventing Bb4+.",
    "difficulty": "advanced",
    "category": "indian_defense",
    "main_ideas": [
      "Prevent Bb4",
      "Nc3 without pin",
      "Positional control"
    ],
    "famous_games": [
      "Petrosian's QI games"
    ]
  },
  {
    "opening_id": "nimzo_leningrad",
    "name": "Nimzo-Indian Leningrad Variation",
    "eco": "E30",
    "moves": [
      "d4",
      "Nf6",
      "c4",
      "e6",
      "Nc3",
      "Bb4",
      "Bg5"
    ],
    "fen": "rnbqk2r/pppp1ppp/4pn2/6B1/1bPP4/2N5/PP2PPPP/R2QKBNR b KQkq - 3 4",
    "description": "Sharp Bg5 system pinning the knight in the Nimzo.",
    "difficulty": "advanced",
    "category": "indian_defense",
    "main_ideas": [
      "Pin the knight",
      "Sharp play",
      "Complex middlegame"
    ],
    "famous_games": [
      "Soviet school games"
    ]
  },
  {
    "opening_id": "gruenfeld_fianchetto",
    "name": "Grunfeld Fianchetto Variation",
    "eco": "D90-D99",
    "moves": [
      "d4",
      "Nf6",
      "c4",
      "g6",
      "Nc3",
      "d5",
      "Nf3",
      "Bg7",
      "g3"
    ],
    "fen": "rnbqk2r/ppp1ppbp/5np1/3p4/2PP4/2N2NP1/PP2PP1P/R1BQKB1R b KQkq - 0 5",
    "description": "Quiet fianchetto approach against the Grunfeld.",
    "difficulty": "intermediate",
    "category": "indian_defense",
    "main_ideas": [
      "Quiet positional approach",
      "Bg2 pressure",
      "Avoid theory"
    ],
    "famous_games": [
      "Karpov's Grunfeld fianchetto"
    ]
  }
];
