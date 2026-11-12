import { ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/common/states';

export default function NotFoundPage() {
  return (
    <EmptyState
      title="This page doesn’t exist"
      description="The link may be outdated, or the item was deleted."
      action={
        <ButtonLink to="/home" variant="primary">
          Go to Home
        </ButtonLink>
      }
    />
  );
}
