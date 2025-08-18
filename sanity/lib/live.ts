import "server-only"; 

import { defineLive } from "next-sanity";

import { sanityClient } from "@/sanity/lib/client";

export const { sanityFetch, SanityLive } = defineLive({ sanityClient });
