// An agent may act on a booking when they are either the referral agent or the
// delegated manager. Reused across booking/transfer/message/milestone actions
// and the agent pages. Kept outside any "use server" module so it can be a
// plain synchronous helper.
export function bookingAgentAccess(
  booking: { agentId: string | null; managerAgentId: string | null },
  profileId: string,
) {
  return booking.agentId === profileId || booking.managerAgentId === profileId;
}
