-- Keep existing loan-out players visible in the club squad loan tab.
WITH latest_transfer AS (
  SELECT DISTINCT ON (player_id)
    player_id,
    direction,
    transfer_type
  FROM public.transfers
  ORDER BY player_id, created_at DESC
)
UPDATE public.players
SET
  is_active = true,
  squad_status = 'loan'
FROM latest_transfer
WHERE players.id = latest_transfer.player_id
  AND latest_transfer.direction = 'out'
  AND latest_transfer.transfer_type = 'loan_out';
