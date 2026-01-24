ipc/worker/
├── index.ipc.js           # Main handler (yan)
├── create.ipc.js          # Create worker
├── update.ipc.js          # Update worker
├── delete.ipc.js          # Delete worker
├── get/
│   ├── all.ipc.js         # Get all workers
│   ├── by_id.ipc.js       # Get worker by ID
│   ├── by_name.ipc.js     # Get worker by name
│   ├── by_kabisilya.ipc.js # Get workers by kabisilya
│   ├── by_status.ipc.js   # Get workers by status
│   ├── with_debts.ipc.js  # Get worker with debts
│   ├── with_payments.ipc.js # Get worker with payments
│   ├── with_assignments.ipc.js # Get worker with assignments
│   ├── summary.ipc.js     # Get worker summary
│   ├── active.ipc.js      # Get active workers
│   └── stats.ipc.js       # Get worker statistics
├── search.ipc.js          # Search workers
├── update_status.ipc.js   # Update worker status
├── update_contact.ipc.js  # Update worker contact
├── update_financials.ipc.js # Update financial info
├── assign_to_kabisilya.ipc.js # Assign to kabisilya
├── remove_from_kabisilya.ipc.js # Remove from kabisilya
├── get_kabisilya_info.ipc.js # Get kabisilya info
├── get_debt_summary.ipc.js # Get debt summary
├── get_payment_summary.ipc.js # Get payment summary
├── get_assignment_summary.ipc.js # Get assignment summary
├── calculate_balance.ipc.js # Calculate balance
├── bulk_create.ipc.js     # Bulk create workers
├── bulk_update.ipc.js     # Bulk update workers
├── import_csv.ipc.js      # Import from CSV
├── export_csv.ipc.js      # Export to CSV
├── generate_report.ipc.js # Generate worker report
├── get_attendance.ipc.js  # Get worker attendance
└── get_performance.ipc.js # Get worker performance