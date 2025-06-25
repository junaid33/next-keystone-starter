import { useCallback, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer";
import { useList } from "../../../../hooks/useAdminMeta";
import { useCreateItem } from "../../../../utils/useCreateItem";
import { enhanceFields } from "../../../../utils/enhanceFields";
import { GraphQLErrorNotice } from "@/features/dashboard/components/GraphQLErrorNotice";
import { Fields } from "../../../../components/Fields";

interface CreateItemDrawerProps {
  listKey: string;
  onClose: () => void;
  onCreate: (item: { id: string; label: string }) => void;
}

function CreateItemDrawerInner({
  list,
  onClose,
  onCreate,
}: {
  list: any;
  onClose: () => void;
  onCreate: (item: { id: string; label: string }) => void;
}) {
  // Create enhanced fields like in CreatePage
  const enhancedFields = useMemo(() => {
    return enhanceFields(list.fields || {}, list.key)
  }, [list.fields, list.key])
  
  const createItemState = useCreateItem(list, enhancedFields);

  const handleSubmit = useCallback(async () => {
    if (!createItemState) return;
    const item = await createItemState.create();
    if (item) {
      onCreate({
        id: item.id,
        label: item.label || item.id,
      });
    }
  }, [createItemState, onCreate]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!createItemState) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>Create {list.singular}</DrawerTitle>
      </DrawerHeader>

      <DrawerBody className="py-2">
        {createItemState.error && (
          <GraphQLErrorNotice
            networkError={createItemState.error.networkError}
            errors={createItemState.error.graphQLErrors}
          />
        )}
        <Fields {...createItemState.props} />
      </DrawerBody>

      <DrawerFooter>
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={createItemState.state === "loading"}
        >
          {createItemState.state === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            `Create ${list.singular}`
          )}
        </Button>
      </DrawerFooter>
    </>
  );
}

export function CreateItemDrawer({
  listKey,
  onClose,
  onCreate,
}: CreateItemDrawerProps) {
  const { list, isLoading } = useList(listKey);

  if (isLoading || !list) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <CreateItemDrawerInner
      list={list}
      onClose={onClose}
      onCreate={onCreate}
    />
  );
}
