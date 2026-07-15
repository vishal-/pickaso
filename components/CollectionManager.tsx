"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useDialog } from "@/components/DialogProvider";

type CollectionData = {
  id: string;
  name: string;
  imageCount: number;
};

interface CollectionManagerProps {
  appId: string;
}

export function CollectionManager({ appId }: CollectionManagerProps) {
  const { alert, confirm } = useDialog();
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = useCallback(async (pageNumber: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/collections?appId=${appId}&page=${pageNumber}&limit=10`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch collections");
      }
      setCollections(data.collections);
      setTotalPages(data.pagination.pages);
      setPage(data.pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load collections");
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        fetchCollections(1);
      }
    });
    return () => {
      active = false;
    };
  }, [fetchCollections]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchCollections(newPage);
    }
  };

  const handleDeleteCollection = async (collectionId: string, collectionName: string) => {
    setError(null);
    const confirmed = await confirm(
      `Delete collection "${collectionName}" and all associated images? This action cannot be undone.`,
      "Delete Collection"
    );
    if (!confirmed) {
      return;
    }

    setDeletingId(collectionId);
    try {
      const response = await fetch(`/api/v1/collection/${collectionId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete collection");
      }

      await alert(`Successfully deleted collection "${collectionName}" and its images.`, "Deleted");

      // Adjust page if we deleted the last item on the current page
      const isLastItem = collections.length === 1;
      const targetPage = isLastItem && page > 1 ? page - 1 : page;
      fetchCollections(targetPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete collection");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6">
      <h3 className="text-base font-semibold text-white mb-4">Collections</h3>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Collection Name</th>
              <th className="py-3 px-4 text-center">Image Count</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading && collections.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-xs text-slate-500">
                  Loading collections...
                </td>
              </tr>
            ) : collections.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-xs text-slate-500">
                  No collections created yet for this app.
                </td>
              </tr>
            ) : (
              collections.map((col) => (
                <tr key={col.id} className="hover:bg-white/3 transition-colors">
                  <td className="py-3.5 px-4 text-sm font-medium text-white">
                    {col.name}
                  </td>
                  <td className="py-3.5 px-4 text-center text-sm text-slate-300 font-semibold">
                    {col.imageCount}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      disabled={deletingId !== null}
                      onClick={() => handleDeleteCollection(col.id, col.name)}
                      className="inline-flex items-center justify-center rounded-md border border-rose-500/40 bg-rose-500/10 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-rose-300 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {deletingId === col.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4 text-xs">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => handlePageChange(page - 1)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-medium text-slate-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-slate-400">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => handlePageChange(page + 1)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-medium text-slate-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
