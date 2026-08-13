"use client";

import AdminProductForm from "@/components/AdminProductForm";
import { AdminProductsTableSkeleton } from "@/components/LoadingSkeletons";
import { useAdminProductPage } from "@/hooks/useAdminProductPage";
import { IK_PRESETS, imageKitOptimizedUrl } from "@/lib/imagekitUrl";
import { formatPrice } from "@/utils/format";
import { PackageIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

function AdminProductPage() {
  const {
    getToken,
    isSignedIn,
    meData,
    isLoading,
    saveMutation,
    deleteMutation,
    modalOpen,
    editing,
    setModalOpen,
    setEditing,
    products,
  } = useAdminProductPage();

  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push("/");
    }
  }, [isLoaded, userId, router]);

  if (meData && meData.user?.role !== "admin") {
    router.push("/");
    return null;
  }

  function handleDeleteProduct(product) {
    if (!window.confirm(`Delete "${product.name}" permanently?`)) return;

    deleteMutation.mutate(product.id);
  }

  return (
    <div className="text-left mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <PackageIcon className="size-8 text-secondary" aria-hidden />
          <div>
            <h1 className="text-2xl font-bold text-base-content">Products</h1>
            <p className="text-sm text-base-content/60">
              Manage catalog (admin only).
            </p>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm gap-2"
          onClick={() => {
            (setEditing(null), setModalOpen(true));
          }}
        >
          Add product
        </button>
      </div>

      {isLoading ? (
        <AdminProductsTableSkeleton />
      ) : (
        <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th className="w-24">Preview</th>
                <th>Name</th>
                <th>Category</th>
                <th>Slug</th>
                <th>Price</th>
                <th>Active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="align-middle">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-base-300 bg-base-200 shadow-sm ring-1 ring-base-300/50 sm:h-18 sm:w-18">
                      {p.imageUrl ? (
                        <img
                          src={imageKitOptimizedUrl(
                            p.imageUrl,
                            IK_PRESETS.adminThumb,
                          )}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-base-300 to-base-200">
                          <PackageIcon
                            className="size-6 text-base-content/35"
                            aria-hidden
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="font-medium">{p.name}</td>
                  <td>
                    <span className="badge badge-ghost badge-sm">
                      {p.category ?? "-"}
                    </span>
                  </td>
                  <td className="font-mono text-sm opacity-80">{p.slug}</td>
                  <td>{formatPrice(p.priceCents, p.currency)}</td>
                  <td>
                    {p.active ? (
                      <span className="badge badge-success badge-sm">yes</span>
                    ) : (
                      <span className="badge badge-ghost badge-sm">no</span>
                    )}
                  </td>
                  <td>
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm gap-1"
                        onClick={() => {
                          (setEditing(p), setModalOpen(true));
                        }}
                      >
                        <PencilIcon className="size-3" aria-hidden />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm gap-1 text-error hover:bg-error/10"
                        onClick={() => handleDeleteProduct(p)}
                        disabled={
                          deleteMutation.isPending &&
                          deleteMutation.variables === p.id
                        }
                      >
                        {deleteMutation.isPending &&
                        deleteMutation.variables === p.id ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <Trash2Icon className="size-3" aria-hidden />
                        )}
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <dialog className={`modal ${modalOpen ? "modal-open" : ""}`}>
        <div className="modal-box max-w-lg">
          <h3 className="text-lg font-bold">
            {editing ? "Edit  Product" : "New Product"}
          </h3>
          <AdminProductForm
            key={editing?.id ?? "new"}
            initial={editing}
            saving={saveMutation.isPending}
            error={saveMutation.isError}
            getToken={getToken}
            onCancel={() => {
              setModalOpen(false);
              setEditing(null);
            }}
            onSubmit={(body) => saveMutation.mutate({ body, id: editing?.id })}
          />
        </div>
        <button
          type="button"
          className="modal-backdrop bg-neutral/50"
          onClick={() => {
            setEditing(null);
            setModalOpen(false);
          }}
        />
      </dialog>
    </div>
  );
}

export default AdminProductPage;
