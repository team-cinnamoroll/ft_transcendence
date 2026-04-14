"use client";

import { useMemo, useState } from "react";
import type { Activity } from "@/types/activity";
import type { Face } from "@/types/face";
import type { User } from "@/types/user";
import { createLookupMap } from "@/lib/display";
import SearchBar from "@/components/search/SearchBar";
import SearchScopeSelector, {
  type SearchScope,
} from "@/components/search/SearchScopeSelector";
import SearchResults, {
  type SearchActivityResultItem,
} from "@/components/search/SearchResults";

type SearchClientProps = {
  allActivities: Activity[];
  allFaces: Face[];
  allUsers: User[];
  currentUserId: string;
  subscribedFaceIds: string[];
};

const SearchClient = ({
  allActivities,
  allFaces,
  allUsers,
  currentUserId,
  subscribedFaceIds,
}: SearchClientProps) => {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<SearchScope>("all");

  const faceMap = useMemo(() => createLookupMap(allFaces, (face) => face.id), [allFaces]);
  const userMap = useMemo(() => createLookupMap(allUsers, (user) => user.id), [allUsers]);

  const activityResults = useMemo<SearchActivityResultItem[]>(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return [];

    const lowerQuery = trimmedQuery.toLowerCase();
    const scopedActivities = allActivities.filter((activity) => {
      if (scope === "mine") return activity.userId === currentUserId;
      if (scope === "subscribed") {
        return subscribedFaceIds.includes(activity.faceId);
      }
      return true;
    });

    return scopedActivities.flatMap((activity) => {
      if (!activity.body.toLowerCase().includes(lowerQuery)) {
        return [];
      }

      const user = userMap.get(activity.userId);
      const face = faceMap.get(activity.faceId);

      if (!user || !face) {
        return [];
      }

      return [{ activity, user, face }];
    });
  }, [allActivities, currentUserId, faceMap, query, scope, subscribedFaceIds, userMap]);

  const faceResults = useMemo(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return [];

    const lowerQuery = trimmedQuery.toLowerCase();

    return allFaces.filter(
      (face) =>
        face.name.toLowerCase().includes(lowerQuery) ||
        (face.description ?? "").toLowerCase().includes(lowerQuery),
    );
  }, [allFaces, query]);

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur-sm">
        <h1 className="mb-3 text-lg font-bold text-zinc-100">検索</h1>
        <div className="flex flex-col gap-2">
          <SearchBar value={query} onChange={setQuery} />
          <SearchScopeSelector scope={scope} onScopeChange={setScope} />
        </div>
      </header>

      <main className="px-4 py-4">
        <SearchResults
          query={query.trim()}
          activityResults={activityResults}
          faceResults={faceResults}
          subscribedFaceIds={subscribedFaceIds}
        />
      </main>
    </div>
  );
};

export default SearchClient;