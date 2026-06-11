// A UUID that will never match a real row, used to force an empty result set.
const NO_MATCH_SENTINEL = '00000000-0000-0000-0000-000000000000'

/**
 * Resolve the client_id values to filter invoices by, given the ids of clients whose name
 * matched a search. When nothing matched, return a sentinel id that matches no row — otherwise
 * an empty `.in([])` filter (or omitting it) would return ALL invoices instead of none, which
 * is the opposite of what a "no results" search should show.
 */
export function clientSearchFilterIds(matchedClientIds: string[]): string[] {
  return matchedClientIds.length > 0 ? matchedClientIds : [NO_MATCH_SENTINEL]
}
