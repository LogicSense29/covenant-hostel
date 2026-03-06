SELECT "status", COUNT(*) FROM "Room" GROUP BY "status";
SELECT COUNT(*) as total_inspections, SUM("amountPaid") as total_fees FROM "GuestInspection" WHERE "feePaid" = true;
SELECT "id", "status" FROM "Room" LIMIT 10;
