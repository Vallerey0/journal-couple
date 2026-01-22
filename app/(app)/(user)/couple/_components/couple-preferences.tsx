"use client";

import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type Props = {
  couple?: {
    show_age?: boolean;
    show_zodiac?: boolean;
  };
};

export function CouplePreferences({ couple }: Props) {
  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-1">
        <h2 className="font-medium">Preferensi Tampilan</h2>
        <p className="text-sm text-muted-foreground">
          Atur informasi apa yang ingin ditampilkan
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Label>Tampilkan usia</Label>
        <Switch defaultChecked={couple?.show_age ?? true} />
      </div>

      <div className="flex items-center justify-between">
        <Label>Tampilkan zodiak</Label>
        <Switch defaultChecked={couple?.show_zodiac ?? true} />
      </div>
    </Card>
  );
}
