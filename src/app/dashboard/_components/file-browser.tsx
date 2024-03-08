"use client";

import { useOrganization, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import Image from "next/image";
import { GridIcon, Loader2, RowsIcon } from "lucide-react";
import { useState } from "react";
import { UploadButton } from "@/app/dashboard/_components/upload-button";
import { api } from "../../../../convex/_generated/api";
import { SearchBar } from "@/app/dashboard/_components/search-bar";
import { FileCard } from "@/app/dashboard/_components/file-card";
import { DataTable } from "./file-table";
import { columns } from "./columns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Doc } from "../../../../convex/_generated/dataModel";
import { Label } from "@/components/ui/label";

function Placeholder() {
  return (
    <div className="flex flex-col gap-8 w-full items-center mt-24">
      <Image
        alt="an image of picture and directory"
        width={300}
        height={300}
        src={"/empty.svg"}
      />
      <div className="text-2xl">No files, upload now</div>
      <UploadButton />
    </div>
  );
}

export default function FileBrowser({
  title,
  favouritesOnly,
  deletedOnly,
}: {
  title: string;
  favouritesOnly?: boolean;
  deletedOnly?: boolean;
}) {
  const organization = useOrganization();
  const user = useUser();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<Doc<"files">["type"] | "all">("all");

  let orgId: string | undefined = undefined;
  if (organization.isLoaded && user.isLoaded) {
    orgId = organization.organization?.id ?? user.user?.id;
  }

  const favourites = useQuery(
    api.files.getAllFavourites,
    orgId ? { orgId } : "skip"
  );

  const files = useQuery(
    api.files.getFiles,
    orgId
      ? {
          orgId,
          type: type === "all" ? undefined : type,
          favourites: favouritesOnly,
          deletedOnly,
        }
      : "skip"
  );

  const isLoading = files === undefined;

  const modifiedFiles =
    files?.map((file) => ({
      ...file,
      isFavourited: (favourites ?? []).some(
        (favourite) => favourite.fileId === file._id
      ),
    })) ?? [];

  return (
    <div>
      <>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">{title}</h1>

          <SearchBar query={query} setQuery={setQuery} />

          <UploadButton />
        </div>

        <Tabs defaultValue="grid">
          <div className="flex justify-between items-center">
            <TabsList className="mb-2">
              <TabsTrigger value="grid" className="flex gap-2 items-center">
                <GridIcon />
                Grid
              </TabsTrigger>
              <TabsTrigger value="table" className="flex gap-2 items-center">
                <RowsIcon /> Table
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2 items-center">
              <Label htmlFor="type-select">Type Filter</Label>
              <Select
                value={type}
                onValueChange={(newType) => {
                  setType(newType as any);
                }}
              >
                <SelectTrigger id="type-select" className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading === undefined && (
            <div className="flex flex-col gap-8 w-full items-center mt-24">
              <Loader2 className="h-32 w-32 animate-spin text-gray-500" />
              <div className="text-2xl">Loading...</div>
            </div>
          )}

          <TabsContent value="grid">
            <div className="grid grid-cols-3 gap-4">
              {modifiedFiles?.map((file) => {
                return <FileCard key={file._id} file={file} />;
              })}
            </div>
          </TabsContent>
          <TabsContent value="table">
            <DataTable columns={columns} data={modifiedFiles} />
          </TabsContent>
        </Tabs>

        {files?.length === 0 && <Placeholder />}
      </>
    </div>
  );
}
