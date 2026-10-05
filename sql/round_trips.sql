SELECT
    outgoing.id AS outgoing_id,
    incoming.id AS return_id,
    outgoing.sender AS account_a,
    outgoing.receiver AS account_b,
    outgoing.currency,
    outgoing.amount_cents / 100.0 AS sent_amount,
    incoming.amount_cents / 100.0 AS returned_amount,
    outgoing.sent_at AS sent_at,
    incoming.sent_at AS returned_at
FROM transfers AS outgoing
JOIN transfers AS incoming
  ON incoming.sender = outgoing.receiver
 AND incoming.receiver = outgoing.sender
 AND incoming.currency = outgoing.currency
 AND (
     incoming.sent_at > outgoing.sent_at
     OR (incoming.sent_at = outgoing.sent_at AND incoming.id > outgoing.id)
 )
 AND unixepoch(incoming.sent_at) - unixepoch(outgoing.sent_at) BETWEEN 0 AND 86400
 AND incoming.amount_cents * 100 BETWEEN outgoing.amount_cents * 90 AND outgoing.amount_cents * 110
ORDER BY outgoing.id, incoming.id;
