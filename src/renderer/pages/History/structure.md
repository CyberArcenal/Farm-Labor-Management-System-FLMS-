components/History/
├── HistoryPage.tsx              # Main container
├── components/
│   ├── HistoryViewToggle.tsx    # View type toggle
│   ├── HistoryStats.tsx         # Statistics cards
│   ├── HistoryFilters.tsx       # Filter controls
│   ├── HistoryList.tsx          # History list container
│   ├── PaymentHistoryItem.tsx   # Individual payment history item
│   └── DebtHistoryItem.tsx      # Individual debt history item
├── hooks/
│   ├── useHistoryData.ts        # Data fetching logic
│   ├── useHistoryFilters.ts     # Filter management
│   └── useHistoryStats.ts       # Statistics calculation
├── utils/
│   ├── historyFormatters.ts     # Formatting utilities
│   └── historyConstants.ts      # Constants and configs
└── types/
    └── history.types.ts         # TypeScript interfaces