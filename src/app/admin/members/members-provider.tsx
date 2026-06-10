"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import type { Member } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getMembers as serverGetMembers, addMember as serverAddMember, updateMember as serverUpdateMember, deleteMember as serverDeleteMember, deleteAllMembers as serverDeleteAllMembers } from '@/app/actions/member-actions';

interface MembersContextType {
  members: Member[];
  loading: boolean;
  refreshMembers: () => Promise<void>;
  addMember: (member: Omit<Member, 'id'>) => Promise<void>;
  updateMember: (id: string, member: Partial<Omit<Member, 'id'>>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  seedDatabase: () => Promise<void>;
  deleteAllMembers: () => Promise<void>;
}

const MembersContext = createContext<MembersContextType | undefined>(undefined);

export const MembersProvider = ({ children }: { children: ReactNode }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchedRef = useRef(false);

  const fetchMembers = useCallback(async (force = false) => {
    if (!force && fetchedRef.current) return;
    setLoading(true);
    try {
      const data = await serverGetMembers();
      const formattedMembers = data.map((m: any) => ({
        ...m,
        doa: new Date(m.doa).toISOString(),
        dob: new Date(m.dob).toISOString()
      })) as Member[];
      setMembers(formattedMembers);
      fetchedRef.current = true;
    } catch (error) {
      console.error("Error fetching members: ", error);
      toast({ variant: 'destructive', title: "Error", description: "Could not fetch members from the database." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const refreshMembers = useCallback(async () => {
    fetchedRef.current = false;
    await fetchMembers(true);
  }, [fetchMembers]);

  const addMember = async (member: Omit<Member, 'id'>) => {
    try {
      const res = await serverAddMember({
        ...member,
        doa: new Date(member.doa),
        dob: new Date(member.dob)
      } as any);
      
      if (res.success) {
        toast({ title: "Success", description: "Member created successfully." });
        await refreshMembers();
      } else {
        throw new Error(res.error || "Failed");
      }
    } catch (error) {
      console.error("Error adding member: ", error);
      toast({ variant: 'destructive', title: "Error", description: "Could not create member." });
    }
  };

  const updateMember = async (id: string, member: Partial<Omit<Member, 'id'>>) => {
    try {
      const dataToUpdate = { ...member } as any;
      if (member.doa) dataToUpdate.doa = new Date(member.doa);
      if (member.dob) dataToUpdate.dob = new Date(member.dob);
      
      const res = await serverUpdateMember(id, dataToUpdate);
      if (res.success) {
        toast({ title: "Success", description: "Member updated successfully." });
        await refreshMembers();
      } else {
        throw new Error(res.error || "Failed");
      }
    } catch (error) {
      console.error("Error updating member: ", error);
      toast({ variant: 'destructive', title: "Error", description: "Could not update member." });
    }
  };

  const deleteMember = async (id: string) => {
    try {
      const res = await serverDeleteMember(id);
      if (res.success) {
        toast({ title: "Success", description: "Member deleted successfully." });
        await refreshMembers();
      } else {
        throw new Error(res.error || "Failed");
      }
    } catch (error) {
      console.error("Error deleting member: ", error);
      toast({ variant: 'destructive', title: "Error", description: "Could not delete member." });
    }
  };

  const seedDatabase = async () => {
    try {
      const { sampleMembers } = await import('@/lib/dummy-data');
      const { seedMembers } = await import('@/app/actions/member-actions');
      const res = await seedMembers(sampleMembers);
      if (res.success) {
        toast({ title: 'Database Seeded', description: 'Sample members have been added.' });
        await fetchMembers();
      } else {
        toast({ title: 'Database Not Empty', description: res.error || 'Seeding was skipped because members already exist.' });
      }
    } catch (error) {
       toast({ variant: 'destructive', title: 'Seeding Failed', description: 'Could not seed database.' });
    }
  };

  const deleteAllMembers = async () => {
    try {
      const res = await serverDeleteAllMembers();
      if (res.success) {
        toast({ title: 'Members Cleared', description: 'All members have been deleted.' });
        await refreshMembers();
      } else {
        toast({ variant: 'destructive', title: 'Failed', description: res.error || 'Could not delete all members.' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed', description: 'Could not delete all members.' });
    }
  };

  return (
    <MembersContext.Provider value={{ members, loading, refreshMembers, addMember, updateMember, deleteMember, seedDatabase, deleteAllMembers }}>
      {children}
    </MembersContext.Provider>
  );
};

export const useMembers = () => {
  const context = useContext(MembersContext);
  if (context === undefined) {
    throw new Error('useMembers must be used within a MembersProvider');
  }
  return context;
};
