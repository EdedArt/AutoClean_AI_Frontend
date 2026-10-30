import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { MY_PLATES_QUERY_KEY } from './useMyPlates';
import { deleteMyPlate, type SearchedPlateEntry } from '@/api/plates';

interface DeletePlateContext {
  previousPlates?: SearchedPlateEntry[];
  deletedPlate: string;
}

export interface UseDeleteMyPlateOptions {
  onSuccess?: (placa: string) => void;
  onRollback?: (placa: string, message: string) => void;
}

export function useDeleteMyPlate(options?: UseDeleteMyPlateOptions) {
  const queryClient = useQueryClient();
  const [rollbackError, setRollbackError] = useState<string | null>(null);

  const mutation = useMutation<void, Error, string, DeletePlateContext>({
    mutationFn: (placa: string) => deleteMyPlate(placa),
    onMutate: async (placa: string) => {
      setRollbackError(null);
      await queryClient.cancelQueries({ queryKey: MY_PLATES_QUERY_KEY });

      const previousPlates = queryClient.getQueryData<SearchedPlateEntry[]>(MY_PLATES_QUERY_KEY);

      if (previousPlates) {
        queryClient.setQueryData<SearchedPlateEntry[]>(
          MY_PLATES_QUERY_KEY,
          previousPlates.filter((entry) => entry.placa !== placa),
        );
      }

      return { previousPlates, deletedPlate: placa };
    },
    onError: (_error, placa, context) => {
      if (context?.previousPlates) {
        queryClient.setQueryData<SearchedPlateEntry[]>(MY_PLATES_QUERY_KEY, context.previousPlates);
      }
      const message = `No se pudo quitar ${placa} del historial. Se restauró en la lista.`;
      setRollbackError(message);
      options?.onRollback?.(placa, message);
    },
    onSuccess: (_data, placa) => {
      options?.onSuccess?.(placa);
    },
  });

  const clearRollbackError = () => {
    setRollbackError(null);
  };

  return {
    ...mutation,
    rollbackError,
    clearRollbackError,
  };
}
