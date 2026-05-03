'use server';

import { prisma } from '@/lib/prisma';
import type { Member, Booking } from '@/lib/types';


export async function checkMemberIdAction(memberId: string, eventId: string): Promise<{ isValid: boolean; message: string; memberName?: string }> {
  if (!memberId || !eventId) {
    return { isValid: false, message: 'Member ID and Event ID are required.' };
  }

  try {
    // 1. Check if the member ID exists in the members collection
    const member = await prisma.member.findFirst({
      where: { memberId: parseInt(memberId, 10) }
    });

    if (!member) {
      return { isValid: false, message: 'Invalid Member ID. This ID is not valid.' };
    }

    // 2. Check if the member ID has already been used for this event
    const bookings = await prisma.booking.findMany({
      where: { eventId }
    });
    
    const isMemberIdUsed = bookings.some(booking => {
      const attendees = booking.attendees as any[];
      return attendees.some(attendee => 
        attendee.isMember && String(attendee.memberId) === String(memberId)
      );
    });

    if (isMemberIdUsed) {
      return { isValid: false, message: 'This Member ID has already been used for a booking at this event.' };
    }

    // If we reach here, the ID is valid and has not been used for this event
    return { isValid: true, message: 'Member ID verified successfully!', memberName: member.name };

  } catch (error) {
    console.error("Error verifying member ID:", error);
    return { isValid: false, message: 'An unexpected error occurred during verification.' };
  }
}
