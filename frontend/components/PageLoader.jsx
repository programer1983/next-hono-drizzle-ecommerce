"use client";

import { LoaderIcon } from "lucide-react";
import React from "react";

const PageLoader = () => {
  return (
    <div className="flex min-h-screen justify-center items-center">
      <LoaderIcon className="animate-spin text-primary size-20" />
    </div>
  );
};

export default PageLoader;
