"use client";

/**
 * Comptes utilisateurs.
 *
 * Un compte n'est pas une fiche client : c'est une porte. Ce qu'on décide ici
 * se lit trente minutes plus tard dans le grand livre — une écriture portant le
 * nom de celui qui l'a passée. D'où trois règles que l'écran rend visibles
 * plutôt que de les laisser au seul backend :
 *
 *   - on ne se ferme pas la porte derrière soi (propre rôle, propre compte) ;
 *   - la société garde au moins un administrateur, sinon plus personne ne peut
 *     en nommer un ;
 *   - un compte ne se supprime pas, il s'éteint. Ce qu'il a écrit reste.
 *
 * Le journal, en bas d'écran, vient d'`audit_logs`, déjà rempli automatiquement
 * par chaque écriture. Il n'est pas décoratif : c'est lui qui répond à
 * « qui a donné les droits comptables, et quand ».
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  ADMIN_ROLES,
  ASSIGNABLE_ROLES,
  ROLE_LABELS,
  roleLabel,
} from "@/lib/constants";
import type { UserRole } from "@/types";

interface Compte {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  role: UserRole;
  is_active: boolean;
  two_fa_enabled: boolean;
  last_login_at?: string | null;
  created_at?: string;
  partner?: { id: number; name: string } | null;
}

interface LigneJournal {
  id: string;
  date: string;
  type: "creation" | "modification";
  acteur: string | null;
  compte: string | null;
  systeme: boolean;
  changements: string[];
}

const FILTRES_STATUT = [
  { value: "", label: "Tous" },
  { value: "true", label: "Actifs" },
  { value: "false", label: "Désactivés" },
];

const VARIANT_ROLE: Partial<Record<UserRole, "brand" | "info" | "outline" | "warning">> = {
  PLATFORM_ADMIN: "brand",
  ADMIN: "brand",
  MANAGER: "info",
  READ_ONLY: "outline",
  PARTNER: "warning",
};

const nomComplet = (c: { first_name?: string | null; last_name?: string | null; email: string }) =>
  [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email;

const fmtDate = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

const fmtAcces = (v?: string | null) =>
  v
    ? new Date(v).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "jamais connecté";

export default function UtilisateursPage() {
  const { user } = useAuth();
  const peutGerer = !!user && ADMIN_ROLES.includes(user.role);

  const [comptes, setComptes] = useState<Compte[]>([]);
  const [journal, setJournal] = useState<LigneJournal[]>([]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [statut, setStatut] = useState("");
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const [creation, setCreation] = useState(false);
  const [edition, setEdition] = useState<Compte | null>(null);
  const [extinction, setExtinction] = useState<Compte | null>(null);
  const [occupation, setOccupation] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErreur(null);
    try {
      const qs = new URLSearchParams();
      if (query) qs.set("q", query);
      if (role) qs.set("role", role);
      if (statut) qs.set("active", statut);
      const suffixe = qs.toString() ? `?${qs}` : "";
      const [liste, journalisation] = await Promise.all([
        apiGet<{ users?: Compte[] }>(`/users${suffixe}`),
        apiGet<{ journal?: LigneJournal[] }>("/users/journal"),
      ]);
      setComptes(liste?.users ?? []);
      setJournal(journalisation?.journal ?? []);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur de chargement");
      setComptes([]);
    } finally {
      setLoading(false);
    }
  }, [query, role, statut]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const desactiver = async () => {
    if (!extinction) return;
    setOccupation(true);
    try {
      await apiPatch(`/users/${extinction.id}`, { isActive: false });
      setExtinction(null);
      await fetchData();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Désactivation impossible");
      setExtinction(null);
    } finally {
      setOccupation(false);
    }
  };

  const reactiver = async (c: Compte) => {
    setOccupation(true);
    try {
      await apiPatch(`/users/${c.id}`, { isActive: true });
      await fetchData();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Réactivation impossible");
    } finally {
      setOccupation(false);
    }
  };

  const actifs = comptes.filter((c) => c.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Utilisateurs</h1>
          <p className="mt-1 max-w-2xl text-neutral-600 dark:text-neutral-400">
            Les comptes qui ont une porte d&apos;entrée sur la société. Chacun
            écrit sous son nom au journal : modifier un rôle ou éteindre un
            compte se voit donc ici, et se retrouve trente minutes plus tard
            dans les écritures.
          </p>
        </div>
        {peutGerer && (
          <Button onClick={() => setCreation(true)}>Nouveau compte</Button>
        )}
      </div>

      {!peutGerer && (
        <p className="rounded-xl bg-neutral-100 px-4 py-3 text-sm text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
          Votre rôle vous montre la liste sans vous permettre de la modifier. La
          création des comptes et le changement de rôle appartiennent aux
          administrateurs.
        </p>
      )}

      <Card title="Filtres">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-wrap gap-2">
            {FILTRES_STATUT.map((f) => (
              <button
                key={f.value || "tous"}
                type="button"
                onClick={() => setStatut(f.value)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  statut === f.value
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {ASSIGNABLE_ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(role === r ? "" : r)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  role === r
                    ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                    : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                }`}
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
          <Input
            label="Recherche"
            placeholder="Email, nom…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </Card>

      {erreur && (
        <p className="rounded-xl bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700 dark:bg-danger-500/10 dark:text-danger-300">
          {erreur}
        </p>
      )}

      <Card
        title={`${comptes.length} compte${comptes.length > 1 ? "s" : ""}${
          comptes.length ? ` · ${actifs} actif${actifs > 1 ? "s" : ""}` : ""
        }`}
        description="Un compte désactivé ne peut plus se connecter ni renouveler sa session."
      >
        {loading ? (
          <p className="py-6 text-sm text-neutral-500">Chargement…</p>
        ) : comptes.length === 0 ? (
          <p className="py-6 text-sm text-neutral-500">
            Aucun compte ne correspond. {peutGerer ? "Créez le premier." : ""}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
                  <th className="p-3 font-medium">Compte</th>
                  <th className="p-3 font-medium">Rôle</th>
                  <th className="p-3 font-medium">Deuxième facteur</th>
                  <th className="p-3 font-medium">Dernier accès</th>
                  <th className="p-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {comptes.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-neutral-100 dark:border-neutral-800"
                  >
                    <td className="p-3">
                      <span className="font-medium">{nomComplet(c)}</span>
                      {c.id === user?.id && (
                        <Badge variant="outline" className="ml-2">
                          vous
                        </Badge>
                      )}
                      {!c.is_active && (
                        <Badge variant="danger" className="ml-2">
                          désactivé
                        </Badge>
                      )}
                      <span className="block text-xs text-neutral-500">
                        {c.email}
                      </span>
                      {c.partner && (
                        <span className="block text-xs text-neutral-500">
                          tiers rattaché : {c.partner.name}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant={VARIANT_ROLE[c.role] ?? "default"} dot>
                        {roleLabel(c.role)}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {c.two_fa_enabled ? (
                        <Badge variant="success">activé</Badge>
                      ) : (
                        <span className="text-neutral-500">—</span>
                      )}
                    </td>
                    <td className="p-3 text-neutral-600 dark:text-neutral-400">
                      {fmtAcces(c.last_login_at)}
                    </td>
                    <td className="p-3">
                      <span className="flex justify-end gap-1">
                        {peutGerer &&
                          (c.is_active ? (
                            <>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => setEdition(c)}
                              >
                                Modifier
                              </Button>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => setExtinction(c)}
                                disabled={c.id === user?.id}
                                title={
                                  c.id === user?.id
                                    ? "On ne se désactive pas soi-même"
                                    : undefined
                                }
                              >
                                Désactiver
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="xs"
                              variant="secondary"
                              onClick={() => reactiver(c)}
                              disabled={occupation}
                            >
                              Réactiver
                            </Button>
                          ))}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card
        title="Journal des accès"
        description="Créations et changements de rôle, tels qu’ils ont été écrits."
        action={
          <span className="font-mono text-xs text-neutral-500">
            {journal.length} lignes
          </span>
        }
      >
        {journal.length === 0 ? (
          <p className="py-4 text-sm text-neutral-500">
            Rien à montrer pour l&apos;instant : chaque création et chaque
            changement de rôle viendra s&apos;inscrire ici.
          </p>
        ) : (
          <ul className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {journal.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-neutral-100 pb-2 text-sm last:border-0 dark:border-neutral-800"
              >
                <span className="font-mono text-xs text-neutral-500">
                  {fmtDate(l.date)}
                </span>
                <Badge variant={l.type === "creation" ? "success" : "info"}>
                  {l.type === "creation" ? "créé" : "modifié"}
                </Badge>
                <span className="font-medium">
                  {l.compte ?? "compte d’une autre société"}
                </span>
                <span className="text-neutral-600 dark:text-neutral-400">
                  {l.changements.length > 0 ? l.changements.join(" · ") : "aucun champ d’accès modifié"}
                </span>
                <span className="ml-auto text-xs text-neutral-500">
                  par {l.systeme ? "le système" : l.acteur ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {creation && (
        <ModalNouveauCompte
          onClose={() => setCreation(false)}
          onSuccess={() => {
            setCreation(false);
            fetchData();
          }}
        />
      )}

      {edition && (
        <ModalModification
          compte={edition}
          moiId={user?.id}
          onClose={() => setEdition(null)}
          onSuccess={() => {
            setEdition(null);
            fetchData();
          }}
        />
      )}

      {extinction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <h3 className="text-lg font-semibold">
              Éteindre le compte de {nomComplet(extinction)} ?
            </h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Il ne pourra plus se connecter. Sa session en cours tombe au plus
              tard à son expiration, soit trente minutes. Ses écritures restent
              au journal et au grand livre — c&apos;est la raison pour laquelle
              on éteint un compte plutôt qu&apos;on ne le supprime.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setExtinction(null)}>
                Annuler
              </Button>
              <Button variant="danger" onClick={desactiver} loading={occupation}>
                Désactiver
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function ModalNouveauCompte({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [role, setRole] = useState<UserRole>("USER");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);
    if (!email.includes("@")) {
      setErreur("Adresse email invalide.");
      return;
    }
    if (motDePasse.length < 8) {
      setErreur("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    setSaving(true);
    try {
      await apiPost("/users", {
        email,
        password: motDePasse,
        firstName: prenom || undefined,
        lastName: nom || undefined,
        role,
      });
      onSuccess();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Création impossible");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-xl font-semibold">Nouveau compte</h2>
        <form onSubmit={soumettre} className="mt-4 space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} />
            <Input label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Rôle</label>
            <select
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Mot de passe"
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            hint="8 caractères minimum. Transmettez-le par un canal sûr : le courriel de bienvenue ne le contient pas."
            required
          />
          {erreur && (
            <p className="text-sm font-medium text-danger-600">{erreur}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Création…" : "Créer le compte"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function ModalModification({
  compte,
  moiId,
  onClose,
  onSuccess,
}: {
  compte: Compte;
  moiId?: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const soi = compte.id === moiId;
  const [prenom, setPrenom] = useState(compte.first_name ?? "");
  const [nom, setNom] = useState(compte.last_name ?? "");
  const [role, setRole] = useState<UserRole>(compte.role);
  const [erreur, setErreur] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Un compte déjà porteur d'un rôle non attribuable (éditeur, accès externe
  // hérité) doit rester affichable sans être transformé malgré lui.
  const rolesDisponibles: readonly UserRole[] = ASSIGNABLE_ROLES.includes(role)
    ? ASSIGNABLE_ROLES
    : [role, ...ASSIGNABLE_ROLES];

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);
    const corps: Record<string, unknown> = {
      firstName: prenom,
      lastName: nom,
    };
    if (!soi && role !== compte.role) corps.role = role;
    setSaving(true);
    try {
      await apiPatch(`/users/${compte.id}`, corps);
      onSuccess();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Modification impossible");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-xl font-semibold">Modifier {nomComplet(compte)}</h2>
        <p className="mt-1 text-sm text-neutral-500">{compte.email}</p>
        <form onSubmit={soumettre} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} />
            <Input label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Rôle</label>
            <select
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              disabled={soi}
            >
              {rolesDisponibles.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            {soi && (
              <p className="mt-1.5 text-xs text-warning-700 dark:text-warning-300">
                Votre propre rôle : à confier à un autre administrateur, sinon
                vous vous fermez la porte en enregistrant.
              </p>
            )}
          </div>
          {erreur && (
            <p className="text-sm font-medium text-danger-600">{erreur}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
