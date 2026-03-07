'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ChevronDown } from 'lucide-react';
import {
  calculatePreviewPoints,
  formatScoringPreview,
  getScoringAlgorithmDescription,
  DECAY_RATE_PRESETS,
  type ScoringAlgorithmType,
} from '@lib/scoring-preview';

type ScoringSettingsProps = {
  timePerQuestion: number;
  scoringAlgorithm?: ScoringAlgorithmType;
  scoringDecayRate?: number;
  onScoringAlgorithmChange: (algorithm: ScoringAlgorithmType) => void;
  onScoringDecayRateChange: (rate: number | undefined) => void;
  disabled?: boolean;
};

export function ScoringSettings({
  timePerQuestion,
  scoringAlgorithm = 'EXPONENTIAL_DECAY',
  scoringDecayRate = 2.0,
  onScoringAlgorithmChange,
  onScoringDecayRateChange,
  disabled = false,
}: ScoringSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customRate, setCustomRate] = useState<string>(
    scoringDecayRate?.toString() || '2.0'
  );

  // Update custom rate when prop changes
  useEffect(() => {
    if (scoringDecayRate !== undefined) {
      setCustomRate(scoringDecayRate.toString());
    }
  }, [scoringDecayRate]);

  const needsDecayRate =
    scoringAlgorithm === 'EXPONENTIAL_DECAY' || scoringAlgorithm === 'LINEAR';

  const handlePresetClick = (rate: number) => {
    setCustomRate(rate.toString());
    onScoringDecayRateChange(rate);
  };

  const handleCustomRateChange = (value: string) => {
    setCustomRate(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0.1 && parsed <= 5.0) {
      onScoringDecayRateChange(parsed);
    }
  };

  // Calculate preview
  const previewPoints = needsDecayRate
    ? calculatePreviewPoints(
        100,
        timePerQuestion,
        scoringAlgorithm,
        scoringDecayRate
      )
    : scoringAlgorithm === 'FIXED'
      ? calculatePreviewPoints(100, timePerQuestion, 'FIXED')
      : [];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="space-y-2">
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="flex w-full justify-between p-0 hover:bg-transparent"
            disabled={disabled}
          >
            <Label className="cursor-pointer font-medium">
              Scoring Settings
            </Label>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-4">
          {/* Algorithm Selection */}
          <div className="space-y-2">
            <Label htmlFor="scoringAlgorithm">Scoring Algorithm</Label>
            <Select
              value={scoringAlgorithm}
              onValueChange={(value) =>
                onScoringAlgorithmChange(value as ScoringAlgorithmType)
              }
              disabled={disabled}
            >
              <SelectTrigger id="scoringAlgorithm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXPONENTIAL_DECAY">
                  Exponential Decay (Recommended)
                </SelectItem>
                <SelectItem value="LINEAR">Linear Decay</SelectItem>
                <SelectItem value="FIXED">Fixed Points</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Decay Rate (only for algorithms that need it) */}
          {needsDecayRate && (
            <div className="space-y-3">
              <Label>Decay Rate</Label>

              {/* Preset Buttons */}
              <div className="flex flex-wrap gap-2">
                {DECAY_RATE_PRESETS.map((preset) => (
                  <Button
                    key={preset.value}
                    type="button"
                    variant={
                      scoringDecayRate === preset.value ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => handlePresetClick(preset.value)}
                    disabled={disabled}
                    className="flex-1"
                  >
                    <div className="text-center">
                      <div className="font-semibold">{preset.label}</div>
                      <div className="text-xs opacity-70">
                        {preset.description}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>

              {/* Custom Input */}
              <div className="space-y-2">
                <Label htmlFor="customDecayRate" className="text-xs">
                  Custom Rate (0.1 - 5.0)
                </Label>
                <Input
                  id="customDecayRate"
                  type="number"
                  min={0.1}
                  max={5.0}
                  step={0.1}
                  value={customRate}
                  onChange={(e) => handleCustomRateChange(e.target.value)}
                  disabled={disabled}
                  className="text-sm"
                />
              </div>
            </div>
          )}

          {/* Live Preview */}
          {previewPoints.length > 0 && (
            <div className="rounded-md border bg-muted/50 p-3 space-y-2">
              <Label className="text-xs font-medium">
                Preview (100 points, {timePerQuestion}s)
              </Label>
              <p className="text-xs text-muted-foreground font-mono">
                {formatScoringPreview(previewPoints)}
              </p>
            </div>
          )}

          {/* Help Section */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="help" className="border-0">
              <AccordionTrigger className="py-2 text-xs text-muted-foreground hover:no-underline">
                How does scoring work?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground space-y-2">
                <p>{getScoringAlgorithmDescription(scoringAlgorithm)}</p>
                {needsDecayRate && (
                  <p className="mt-2">
                    <strong>Decay Rate:</strong> Higher values mean faster point
                    decay. Use low values (0.5-1.0) for casual quizzes, medium
                    values (1.5-2.5) for balanced gameplay, and high values
                    (3.0-5.0) for competitive games.
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
