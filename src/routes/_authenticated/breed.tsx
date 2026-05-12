import { createFileRoute } from "@tanstack/react-router";
import { GameHeader } from "@/components/GameHeader";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { fetchAllUserData } from "@/lib/game";
import { breedDragonsRpc, breedNestsRpc } from "@/lib/world";
import { DragonAvatar } from "@/components/DragonAvatar";
import { NestVisual } from "@/components/NestVisual";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RARITY_LABEL, dragonName, type Rarity } from "@/lib/dragons";
import { Heart, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/breed")({ component: BreedPage });

function BreedPage() {
  const { session } = useAuth();
  const userId = session!.user.id;
  const qc = useQueryClient();
  const dataQ = useQuery({ queryKey: ["userdata", userId], queryFn: () => fetchAllUserData(userId) });

  const [pickD, setPickD] = useState<string[]>([]);
  const [pickN, setPickN] = useState<string[]>([]);

  const dragons = (dataQ.data?.dragons ?? []).filter((d) => !d.placed_in_nest);
  const nests = (dataQ.data?.nests ?? []).filter((n) => n.slot_index == null);

  const toggle = (id: string, list: string[], set: (v: string[]) => void) => {
    if (list.includes(id)) set(list.filter((x) => x !== id));
    else if (list.length < 2) set([...list, id]);
    else set([list[1], id]);
  };

  const doBreedDragons = async () => {
    if (pickD.length !== 2) return;
    try {
      await breedDragonsRpc(pickD[0], pickD[1]);
      toast.success("¡Fusión completada!");
      setPickD([]);
      qc.invalidateQueries({ queryKey: ["userdata", userId] });
    } catch (e: any) { toast.error(e.message); }
  };

  const doBreedNests = async () => {
    if (pickN.length !== 2) return;
    try {
      await breedNestsRpc(pickN[0], pickN[1]);
      toast.success("¡Nido fusionado!");
      setPickN([]);
      qc.invalidateQueries({ queryKey: ["userdata", userId] });
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="min-h-screen bg-grid">
      <GameHeader />
      <div className="container mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-6">
          <Heart className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-display text-glow">SISTEMA DE BREED</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
          Selecciona <strong>2 dragones idénticos</strong> (misma especie + rareza) o <strong>2 nidos de la misma rareza</strong> para fusionarlos. Los originales se consumen y obtienes uno mejorado.
        </p>

        <Tabs defaultValue="dragons">
          <TabsList>
            <TabsTrigger value="dragons">Dragones</TabsTrigger>
            <TabsTrigger value="nests">Nidos</TabsTrigger>
          </TabsList>

          <TabsContent value="dragons" className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                {pickD.length}/2 seleccionados
              </span>
              <Button onClick={doBreedDragons} disabled={pickD.length !== 2}>
                <Sparkles className="w-4 h-4 mr-2" />Fusionar dragones
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {dragons.map((d) => (
                <button
                  key={d.id}
                  onClick={() => toggle(d.id, pickD, setPickD)}
                  className={cn(
                    "p-3 rounded-xl border bg-card/40 flex flex-col items-center gap-2 transition",
                    pickD.includes(d.id) ? "border-primary shadow-[0_0_20px_rgba(74,222,128,0.4)]" : "border-border hover:border-primary/40",
                  )}
                >
                  <DragonAvatar catalogId={d.catalog_id} rarity={d.rarity as Rarity} size="sm" />
                  <span className="text-[10px] font-display text-center mt-2 truncate w-full">{dragonName(d.catalog_id).replace(" Dragon","")}</span>
                  <span className="text-[9px] text-muted-foreground">{RARITY_LABEL[d.rarity as Rarity]}</span>
                </button>
              ))}
              {dragons.length === 0 && (
                <p className="col-span-full text-center text-sm text-muted-foreground py-8">No tienes dragones disponibles para breed.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="nests" className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                {pickN.length}/2 seleccionados
              </span>
              <Button onClick={doBreedNests} disabled={pickN.length !== 2}>
                <Sparkles className="w-4 h-4 mr-2" />Fusionar nidos
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {nests.map((n) => (
                <button
                  key={n.id}
                  onClick={() => toggle(n.id, pickN, setPickN)}
                  className={cn(
                    "p-3 rounded-xl border bg-card/40 flex flex-col items-center gap-2 transition",
                    pickN.includes(n.id) ? "border-primary shadow-[0_0_20px_rgba(74,222,128,0.4)]" : "border-border hover:border-primary/40",
                  )}
                >
                  <NestVisual rarity={n.rarity as Rarity} size="sm" />
                  <span className="text-[10px] mt-2">{RARITY_LABEL[n.rarity as Rarity]}</span>
                </button>
              ))}
              {nests.length === 0 && (
                <p className="col-span-full text-center text-sm text-muted-foreground py-8">No tienes nidos libres.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
