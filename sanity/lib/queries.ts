import { defineQuery } from "next-sanity";

export const AUTHOR_QUERY = defineQuery(`
  *[_type == "author"]{
    _id,
    name,
    username,
    email,
    bio
  }
`);
