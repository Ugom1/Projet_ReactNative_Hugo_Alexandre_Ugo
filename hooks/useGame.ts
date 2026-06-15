import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  click,
  deleteCard,
  getCollection,
  getUser,
  openPack,
  playMatch,
  recycleCard,
  recycleCards,
  resetPaliers,
  saveComposition,
  upgradeClick,
  type RecycleItem,
} from '@/services/gameService';
import type { CompositionDoc, PackId } from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';

export function useUserQuery() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user', user?.uid],
    queryFn: () => getUser(user!.uid),
    enabled: !!user,
  });
}

export function useCollectionQuery() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['collection', user?.uid],
    queryFn: () => getCollection(user!.uid),
    enabled: !!user,
  });
}

export function useClickMutation() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => click(user!.uid, profile!.gainParClic),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user', user?.uid] }),
  });
}

export function useUpgradeMutation() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => upgradeClick(user!.uid, profile!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user', user?.uid] }),
  });
}

export function useOpenPackMutation() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (packId: PackId) => openPack(user!.uid, packId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user', user?.uid] });
      qc.invalidateQueries({ queryKey: ['collection', user?.uid] });
    },
  });
}

export function useDeleteCardMutation() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, ownershipId }: RecycleItem) => deleteCard(user!.uid, cardId, ownershipId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['collection', user?.uid] }),
  });
}

export function useRecycleCardMutation() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, ownershipId }: RecycleItem) => recycleCard(user!.uid, cardId, ownershipId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user', user?.uid] });
      qc.invalidateQueries({ queryKey: ['collection', user?.uid] });
    },
  });
}

export function useRecycleCardsMutation() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: RecycleItem[]) => recycleCards(user!.uid, items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user', user?.uid] });
      qc.invalidateQueries({ queryKey: ['collection', user?.uid] });
    },
  });
}

export function useSaveCompositionMutation() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: (data: CompositionDoc) => saveComposition(user!.uid, data),
  });
}

export function usePlayMatchMutation() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      palierIndex,
      moyenne,
      scoreRequis,
    }: {
      palierIndex: number;
      moyenne: number;
      scoreRequis: number;
    }) => playMatch(user!.uid, palierIndex, moyenne, scoreRequis),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user', user?.uid] });
      qc.invalidateQueries({ queryKey: ['collection', user?.uid] });
    },
  });
}

export function useResetPaliersMutation() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => resetPaliers(user!.uid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user', user?.uid] }),
  });
}
