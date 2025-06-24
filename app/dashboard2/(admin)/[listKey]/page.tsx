import { ListPage } from "@/features/dashboard2/screens/ListPage";

interface ListPageProps {
  params: {
    listKey: string;
  };
}

export default function ListPageWrapper({ params }: ListPageProps) {
  return <ListPage listKey={params.listKey} />;
}