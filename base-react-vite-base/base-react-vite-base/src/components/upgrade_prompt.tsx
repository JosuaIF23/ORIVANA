import { Lock } from 'lucide-react';
import { Card } from './card';

interface UpgradePromptProps {
  featureName: string;
  description?: string;
}

export function UpgradePrompt({ featureName, description }: UpgradePromptProps) {
  return (
    <Card className="border-dashed border-amber-300 bg-amber-50 p-6 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
        <Lock className="h-5 w-5 text-amber-600" />
      </div>
      <p className="text-base font-semibold text-gray-900">
        {featureName} requires a plan upgrade
      </p>
      <p className="mt-1 text-sm text-gray-600">
        {description || `Your current plan doesn't include ${featureName}. Choose a plan below to unlock it.`}
      </p>
    </Card>
  );
}
