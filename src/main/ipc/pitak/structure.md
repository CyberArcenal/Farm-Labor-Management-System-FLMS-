src/ipc/pitak/
├── index.ipc.js                    # Main handler (already created above)
├── bulk_create.ipc.js             # Already created above
├── create.ipc.js
├── update.ipc.js
├── delete.ipc.js
├── update_status.ipc.js
├── update_luwang.ipc.js
├── update_location.ipc.js
├── transfer_bukid.ipc.js
├── bulk_update.ipc.js
├── import_csv.ipc.js
├── export_csv.ipc.js
├── export_assignments.ipc.js
├── export_payments.ipc.js
├── validate_data.ipc.js
├── check_availability.ipc.js
├── validate_capacity.ipc.js
├── check_duplicate.ipc.js
├── search.ipc
├── get/
│   ├── all.ipc
│   ├── by_id.ipc
│   ├── by_status.ipc
│   ├── by_bukid.ipc
│   ├── active.ipc
│   ├── inactive.ipc
│   ├── harvested.ipc
│   ├── stats.ipc
│   ├── with_assignments.ipc
│   ├── with_payments.ipc
│   ├── report.ipc
│   ├── summary.ipc
│   ├── performance.ipc
│   └── luwang_report.ipc
└── analytics/
    ├── productivity.ipc
    ├── utilization.ipc
    ├── forecast.ipc
    └── trends.ipc